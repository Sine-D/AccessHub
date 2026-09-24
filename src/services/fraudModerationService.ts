import type {
  ModerationItem,
  ModerationItemType,
  ModerationStatus,
  PaginatedModerationResponse,
  ContentReport,
} from '../types/fraudModeration.ts';
import { supabase } from '../core/supabase.ts';

// In-memory reports store tracking reports per contentId
let reportsStore: ContentReport[] = [
  { id: 'rep-1', contentId: 'mod-rev-101', reporterUserId: 'u-user1', createdAt: new Date().toISOString(), reason: 'Spam review' },
  { id: 'rep-2', contentId: 'mod-rev-101', reporterUserId: 'u-user2', createdAt: new Date().toISOString(), reason: 'Fake rating' },
  { id: 'rep-3', contentId: 'mod-rev-101', reporterUserId: 'u-user3', createdAt: new Date().toISOString(), reason: 'Misleading info' },
];

// Initial moderation queue items (AC-253, AC-254, AC-255)
let initialModerationItems: ModerationItem[] = [
  {
    id: 'mod-rev-101',
    contentType: 'flagged_review',
    contentId: 'rev-901',
    title: 'Flagged Place Review: Kandy City Center Ramp Access',
    description: '"Total scam location, zero stars, fake ramp claim." (Flagged after 3 distinct user reports)',
    photoUri: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=600',
    authorName: 'Anonymous Reviewer',
    authorId: 'u-anon-88',
    reports: ['u-user1', 'u-user2', 'u-user3'], // 3 DISTINCT user reports (AC-259)
    reportCount: 3,
    status: 'flagged',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    locationId: 'loc-kandy-1',
  },
  {
    id: 'mod-photo-102',
    contentType: 'duplicate_photo',
    contentId: 'photo-dup-55',
    title: 'Duplicate Photo Submission Detected',
    description: 'Same stock image uploaded across 4 different vendor listings in Colombo.',
    photoUri: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=600',
    authorName: 'Vendor Stock Spammer',
    authorId: 'u-spammer-12',
    reports: ['u-detector-bot'],
    reportCount: 1,
    status: 'flagged',
    photoHash: 'hash-a89b7c6d5e4f3a2b',
    duplicateCount: 4,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'mod-list-103',
    contentType: 'flagged_listing',
    contentId: 'p6',
    title: 'Flagged Listing: Unverified Non-Compliant Walking Cane',
    description: 'Basic plastic stick with no safety grip testing or visual contrast markings.',
    photoUri: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=600',
    authorName: 'Unknown Reseller',
    authorId: 'u-reseller-9',
    reports: ['u-buyer1', 'u-buyer2', 'u-buyer3'],
    reportCount: 3,
    status: 'flagged',
    rejectionReason: 'Missing certified anti-slip grip test and no image alt-text provided.',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'mod-rev-104',
    contentType: 'flagged_review',
    contentId: 'rev-904',
    title: 'Flagged Review: Galle Fort Braille Signage',
    description: 'Review contains offensive speech and misleading accessibility rating.',
    photoUri: null,
    authorName: 'Disruptive User',
    authorId: 'u-disrupt-04',
    reports: ['u-report1', 'u-report2', 'u-report3'],
    reportCount: 3,
    status: 'flagged',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

let memoryQueue: ModerationItem[] = [...initialModerationItems];

// Realtime subscribers array for AC-263
type RemovalSubscriber = (contentId: string) => void;
const removalSubscribers: Set<RemovalSubscriber> = new Set();

/**
 * Submits a report for a piece of content (AC-259).
 * A review becomes automatically flagged after 3 DISTINCT users report it.
 * Multiple reports from the SAME user are ignored.
 */
export async function submitContentReport(
  contentId: string,
  contentType: ModerationItemType,
  reporterUserId: string,
  reason: string = 'Inappropriate or suspicious content'
): Promise<{ flagged: boolean; reportCount: number; distinctReporters: number }> {
  // Check if this specific user has ALREADY reported this content
  const existingReport = reportsStore.find(
    (r) => r.contentId === contentId && r.reporterUserId === reporterUserId
  );

  if (!existingReport) {
    // Record new report
    const newReport: ContentReport = {
      id: `rep-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      contentId,
      reporterUserId,
      createdAt: new Date().toISOString(),
      reason,
    };
    reportsStore.push(newReport);
  }

  // Calculate distinct reporter user IDs for this content
  const distinctReporters = Array.from(
    new Set(
      reportsStore
        .filter((r) => r.contentId === contentId)
        .map((r) => r.reporterUserId)
    )
  );

  const reportCount = distinctReporters.length;

  // Threshold: If distinctReporters >= 3, automatically flag content (AC-259)
  const isFlagged = reportCount >= 3;

  // Update or insert item in memory moderation queue
  const existingItem = memoryQueue.find((item) => item.contentId === contentId);

  if (existingItem) {
    existingItem.reports = distinctReporters;
    existingItem.reportCount = reportCount;
    if (isFlagged && existingItem.status !== 'removed') {
      existingItem.status = 'flagged';
    }
  } else if (isFlagged) {
    const newItem: ModerationItem = {
      id: `mod-auto-${Date.now()}`,
      contentType,
      contentId,
      title: `Auto-Flagged ${contentType.replace('_', ' ').toUpperCase()}`,
      description: `Reported by ${reportCount} distinct users. Flagged for administrator inspection.`,
      photoUri: null,
      authorName: 'User Submission',
      authorId: 'u-user',
      reports: distinctReporters,
      reportCount,
      status: 'flagged',
      createdAt: new Date().toISOString(),
    };
    memoryQueue = [newItem, ...memoryQueue];
  }

  return { flagged: isFlagged, reportCount, distinctReporters: reportCount };
}

/**
 * Fetches the paginated moderation queue (AC-252, AC-256).
 * Security (AC-260): Enforces admin-only authorization. Throws UNAUTHORIZED_ADMIN_REQUIRED if non-admin.
 */
export async function fetchModerationQueue(
  userRole: string,
  options: {
    page?: number;
    pageSize?: number;
    typeFilter?: string;
    statusFilter?: string;
  } = {}
): Promise<PaginatedModerationResponse> {
  // AC-260: Admin authorization check
  if ((userRole || '').toLowerCase() !== 'admin') {
    throw new Error('UNAUTHORIZED_ADMIN_REQUIRED: Moderation queue access requires administrator role.');
  }

  const page = Math.max(1, options.page || 1);
  const pageSize = Math.max(1, options.pageSize || 3);
  const typeFilter = options.typeFilter || 'all';
  const statusFilter = options.statusFilter || 'flagged';

  // Try fetching from Supabase moderation_queue table first
  try {
    let query = supabase.from('moderation_queue').select('*').order('created_at', { ascending: false });
    if (typeFilter !== 'all') {
      query = query.eq('content_type', typeFilter);
    }
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      const formatted: ModerationItem[] = data.map((item: any) => ({
        id: item.id,
        contentType: item.content_type,
        contentId: item.content_id,
        title: item.title,
        description: item.description,
        photoUri: item.photo_uri,
        authorName: item.author_name,
        authorId: item.author_id,
        reports: item.reports || [],
        reportCount: item.report_count || (item.reports ? item.reports.length : 0),
        status: item.status,
        photoHash: item.photo_hash,
        duplicateCount: item.duplicate_count,
        rejectionReason: item.rejection_reason,
        createdAt: item.created_at,
      }));

      const totalItems = formatted.length;
      const totalPages = Math.ceil(totalItems / pageSize) || 1;
      const currentPage = Math.min(page, totalPages);
      const startIndex = (currentPage - 1) * pageSize;
      const items = formatted.slice(startIndex, startIndex + pageSize);

      return {
        items,
        page: currentPage,
        pageSize,
        totalPages,
        totalItems,
      };
    }
  } catch (err) {
    // Memory fallback will execute below
  }

  // Fallback to in-memory queue
  const filtered = memoryQueue.filter((item) => {
    const matchesType = typeFilter === 'all' || item.contentType === typeFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesType && matchesStatus;
  });

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const currentPage = Math.min(page, totalPages);

  const startIndex = (currentPage - 1) * pageSize;
  const items = filtered.slice(startIndex, startIndex + pageSize);

  return {
    items,
    page: currentPage,
    pageSize,
    totalPages,
    totalItems,
  };
}

/**
 * Helper to check if string is a valid database UUID or integer primary key.
 */
function isDbId(id: string): boolean {
  if (!id) return false;
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  const numericRegex = /^\d+$/;
  return uuidRegex.test(id) || numericRegex.test(id);
}

/**
 * Approves flagged content (AC-257).
 * Security (AC-260): Enforces admin-only authorization.
 */
export async function approveModeratedContent(
  contentId: string,
  userRole: string
): Promise<boolean> {
  if ((userRole || '').toLowerCase() !== 'admin') {
    throw new Error('UNAUTHORIZED_ADMIN_REQUIRED: Content approval requires administrator role.');
  }

  memoryQueue = memoryQueue.map((item) =>
    item.contentId === contentId || item.id === contentId
      ? { ...item, status: 'approved' }
      : item
  );

  // Update Supabase moderation_queue table if available
  try {
    await supabase
      .from('moderation_queue')
      .update({ status: 'approved' })
      .or(`id.eq.${contentId},content_id.eq.${contentId}`);
  } catch (err) {
    // Notice
  }

  if (isDbId(contentId)) {
    try {
      const targetItem = memoryQueue.find((i) => i.contentId === contentId || i.id === contentId);
      const tableName = targetItem?.contentType === 'flagged_listing'
        ? 'marketplace_listings'
        : 'place_accessibility_ratings';

      const updatePayload = targetItem?.contentType === 'flagged_listing'
        ? { status: 'active' }
        : { verification_status: 'verified' };

      const { error } = await supabase
        .from(tableName)
        .update(updatePayload)
        .eq('id', contentId);

      if (error) {
        console.warn(`Supabase approveModeratedContent notice (${tableName}):`, error.message);
      }
    } catch (err) {
      console.warn('Supabase approveModeratedContent notice:', err);
    }
  }

  return true;
}

/**
 * Removes flagged content from system (AC-258, AC-262).
 * Security (AC-260): Enforces admin-only authorization.
 * Realtime (AC-263): Notifies all real-time removal subscribers.
 */
export async function removeModeratedContent(
  contentId: string,
  userRole: string
): Promise<boolean> {
  if ((userRole || '').toLowerCase() !== 'admin') {
    throw new Error('UNAUTHORIZED_ADMIN_REQUIRED: Content removal requires administrator role.');
  }

  memoryQueue = memoryQueue.map((item) =>
    item.contentId === contentId || item.id === contentId
      ? { ...item, status: 'removed' }
      : item
  );

  // Update Supabase moderation_queue table if available
  try {
    await supabase
      .from('moderation_queue')
      .update({ status: 'removed' })
      .or(`id.eq.${contentId},content_id.eq.${contentId}`);
  } catch (err) {
    // Notice
  }

  if (isDbId(contentId)) {
    try {
      const targetItem = memoryQueue.find((i) => i.contentId === contentId || i.id === contentId);
      const tableName = targetItem?.contentType === 'flagged_listing'
        ? 'marketplace_listings'
        : 'place_accessibility_ratings';

      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', contentId);

      if (error) {
        console.warn(`Supabase removeModeratedContent notice (${tableName}):`, error.message);
      }
    } catch (err) {
      console.warn('Supabase removeModeratedContent notice:', err);
    }
  }

  // AC-263: Notify real-time removal subscribers
  notifyRemovalSubscribers(contentId);

  return true;
}

/**
 * AC-263: Registers a real-time listener for content removal updates.
 */
export function subscribeToRemovalUpdates(callback: RemovalSubscriber): () => void {
  removalSubscribers.add(callback);
  return () => {
    removalSubscribers.delete(callback);
  };
}

function notifyRemovalSubscribers(contentId: string) {
  removalSubscribers.forEach((cb) => {
    try {
      cb(contentId);
    } catch (e) {
      console.warn('Removal subscriber error:', e);
    }
  });
}

/**
 * Helper to reset/get memory queue for unit testing.
 */
export function resetModerationStore() {
  reportsStore = [
    { id: 'rep-1', contentId: 'mod-rev-101', reporterUserId: 'u-user1', createdAt: new Date().toISOString() },
    { id: 'rep-2', contentId: 'mod-rev-101', reporterUserId: 'u-user2', createdAt: new Date().toISOString() },
    { id: 'rep-3', contentId: 'mod-rev-101', reporterUserId: 'u-user3', createdAt: new Date().toISOString() },
  ];
  memoryQueue = [...initialModerationItems];
}

export function getMemoryModerationItems(): ModerationItem[] {
  return [...memoryQueue];
}

