import { supabase } from '../core/supabase';
import { VendorVerificationRequest, VerificationStatus } from '../types/vendorVerification';

// Initial queue for demonstration and offline fallback
const initialVerificationRequests: VendorVerificationRequest[] = [
  {
    id: 'ver-101',
    userId: 'u-chamara',
    vendorName: 'Chamara Perera',
    email: 'chamara.artisan@accesslink.lk',
    phone: '+94 77 123 4567',
    district: 'Colombo',
    businessType: 'artisan',
    documentType: 'medical_board_cert',
    documentNumber: 'MBC-COL-4521',
    documentUrl: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&q=80&w=800',
    disabilityBadge: 'Wheelchair User',
    guardianName: 'Sunethra Perera',
    guardianPhone: '+94 71 987 6543',
    status: 'pending',
    submittedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'ver-102',
    userId: 'u-hope-ngo',
    vendorName: 'Hope Lanka NGO',
    email: 'contact@hopelanka.org',
    phone: '+94 11 234 5678',
    district: 'Kandy',
    businessType: 'ngo',
    documentType: 'ngo_charter',
    documentNumber: 'NGO-REG-G-89512',
    documentUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800',
    disabilityBadge: 'Mobility Support NGO',
    status: 'pending',
    submittedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'ver-103',
    userId: 'u-kasun',
    vendorName: 'Kasun Kalhara Handicrafts',
    email: 'kasun.seller@accesshub.lk',
    phone: '+94 72 345 6789',
    district: 'Galle',
    businessType: 'artisan',
    documentType: 'disability_certificate',
    documentNumber: 'DIS-GAL-9921',
    documentUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=800',
    disabilityBadge: 'Visually Impaired Creator',
    status: 'approved',
    submittedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    reviewedAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    reviewedBy: 'Admin Team',
  }
];

let memoryQueue: VendorVerificationRequest[] = [...initialVerificationRequests];

/**
 * Fetches vendor verification requests from Supabase with memory fallback.
 */
export async function fetchVendorVerifications(
  statusFilter?: VerificationStatus
): Promise<VendorVerificationRequest[]> {
  try {
    const { data, error } = await supabase
      .from('vendor_verifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      const formatted: VendorVerificationRequest[] = data.map((item: any) => ({
        id: item.id,
        userId: item.user_id,
        vendorName: item.vendor_name,
        email: item.email,
        phone: item.phone,
        district: item.district,
        businessType: item.business_type,
        documentType: item.document_type,
        documentNumber: item.document_number,
        documentUrl: item.document_url,
        disabilityBadge: item.disability_badge,
        guardianName: item.guardian_name,
        guardianPhone: item.guardian_phone,
        status: item.status,
        rejectionReason: item.rejection_reason,
        submittedAt: item.created_at || item.submitted_at || new Date().toISOString(),
        reviewedAt: item.reviewed_at,
        reviewedBy: item.reviewed_by,
      }));

      if (statusFilter) {
        return formatted.filter((r) => r.status === statusFilter);
      }
      return formatted;
    }
  } catch (err) {
    console.warn('Supabase fetch notice (vendor_verifications fallback):', err);
  }

  // Memory fallback
  if (statusFilter) {
    return memoryQueue.filter((r) => r.status === statusFilter);
  }
  return [...memoryQueue];
}

/**
 * Submits a new vendor verification request (AC-52).
 */
export async function submitVendorVerification(
  request: Omit<VendorVerificationRequest, 'id' | 'status' | 'submittedAt'>
): Promise<VendorVerificationRequest> {
  const newId = `ver-${Date.now()}`;
  const newRequest: VendorVerificationRequest = {
    ...request,
    id: newId,
    status: 'pending',
    submittedAt: new Date().toISOString(),
  };

  memoryQueue = [newRequest, ...memoryQueue];

  try {
    await supabase.from('vendor_verifications').insert([
      {
        id: newId,
        user_id: request.userId,
        vendor_name: request.vendorName,
        email: request.email,
        phone: request.phone,
        district: request.district,
        business_type: request.businessType,
        document_type: request.documentType,
        document_number: request.documentNumber,
        document_url: request.documentUrl,
        disability_badge: request.disabilityBadge,
        guardian_name: request.guardianName,
        guardian_phone: request.guardianPhone,
        status: 'pending',
      },
    ]);
  } catch (err) {
    console.warn('Supabase insert notice (vendor_verifications):', err);
  }

  return newRequest;
}

/**
 * Approves a vendor verification request (AC-54, AC-56).
 * Also updates public.users table (is_verified = true, disability_badge).
 */
export async function approveVendorVerification(
  id: string,
  userId: string,
  disabilityBadge: string
): Promise<boolean> {
  const now = new Date().toISOString();

  // Update memory store
  memoryQueue = memoryQueue.map((item) =>
    item.id === id
      ? { ...item, status: 'approved', reviewedAt: now, reviewedBy: 'Admin' }
      : item
  );

  try {
    // 1. Update verification table status
    await supabase
      .from('vendor_verifications')
      .update({ status: 'approved', reviewed_at: now, reviewed_by: 'Admin' })
      .eq('id', id);

    // 2. Update user table profile
    if (userId) {
      await supabase
        .from('users')
        .update({
          is_verified: true,
          verified: true,
          disability_badge: disabilityBadge,
        })
        .eq('id', userId);
    }
    return true;
  } catch (err) {
    console.warn('Supabase update notice on approval:', err);
    return true;
  }
}

/**
 * Rejects a vendor verification request with reason (AC-55, AC-56).
 */
export async function rejectVendorVerification(
  id: string,
  rejectionReason: string
): Promise<boolean> {
  const now = new Date().toISOString();

  // Update memory store
  memoryQueue = memoryQueue.map((item) =>
    item.id === id
      ? {
          ...item,
          status: 'rejected',
          rejectionReason,
          reviewedAt: now,
          reviewedBy: 'Admin',
        }
      : item
  );

  try {
    await supabase
      .from('vendor_verifications')
      .update({
        status: 'rejected',
        rejection_reason: rejectionReason,
        reviewed_at: now,
        reviewed_by: 'Admin',
      })
      .eq('id', id);
    return true;
  } catch (err) {
    console.warn('Supabase update notice on rejection:', err);
    return true;
  }
}

