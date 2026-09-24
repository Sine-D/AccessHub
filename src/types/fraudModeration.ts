export type ModerationItemType = 'flagged_review' | 'duplicate_photo' | 'flagged_listing';

export type ModerationStatus = 'flagged' | 'approved' | 'removed';

export interface ContentReport {
  id: string;
  contentId: string;
  reporterUserId: string;
  createdAt: string;
  reason?: string;
}

export interface ModerationItem {
  id: string;
  contentType: ModerationItemType;
  contentId: string;
  title: string;
  description: string;
  photoUri?: string | null;
  authorName: string;
  authorId: string;
  reports: string[]; // List of DISTINCT reporter user IDs (AC-259)
  reportCount: number;
  status: ModerationStatus;
  rejectionReason?: string;
  createdAt: string;
  photoHash?: string;
  duplicateCount?: number;
  locationId?: string;
}

export interface PaginatedModerationResponse {
  items: ModerationItem[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
}

