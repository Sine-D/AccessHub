export type VerificationStatus = 'pending' | 'approved' | 'rejected';
export type VendorBusinessType = 'artisan' | 'service_provider' | 'ngo' | 'company';
export type VerificationDocumentType = 
  | 'disability_certificate' 
  | 'medical_board_cert' 
  | 'ngo_charter' 
  | 'national_id';

export interface VendorVerificationRequest {
  id: string;
  userId: string;
  vendorName: string;
  email: string;
  phone: string;
  district: string;
  businessType: VendorBusinessType;
  documentType: VerificationDocumentType;
  documentNumber: string;
  documentUrl: string;
  disabilityBadge: string;
  guardianName?: string;
  guardianPhone?: string;
  status: VerificationStatus;
  rejectionReason?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

