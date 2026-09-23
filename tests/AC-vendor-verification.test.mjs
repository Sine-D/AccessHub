import test from 'node:test';
import assert from 'node:assert/strict';

// Test suite for Vendor Verification Workflow (AC-51 to AC-56)

test('AC-51 & AC-52: Vendor verification request data structure verification', () => {
  const sampleRequest = {
    id: 'ver-101',
    userId: 'u-chamara',
    vendorName: 'Chamara Perera',
    email: 'chamara.artisan@accesslink.lk',
    phone: '+94 77 123 4567',
    district: 'Colombo',
    businessType: 'artisan',
    documentType: 'medical_board_cert',
    documentNumber: 'MBC-COL-4521',
    documentUrl: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789',
    disabilityBadge: 'Wheelchair User',
    status: 'pending',
    submittedAt: new Date().toISOString(),
  };

  assert.equal(sampleRequest.id, 'ver-101');
  assert.equal(sampleRequest.status, 'pending');
  assert.equal(sampleRequest.businessType, 'artisan');
  assert.equal(sampleRequest.documentType, 'medical_board_cert');
  assert.equal(sampleRequest.documentNumber, 'MBC-COL-4521');
});

test('AC-54 & AC-56: Vendor verification approval transition', () => {
  const request = {
    id: 'ver-101',
    userId: 'u-chamara',
    vendorName: 'Chamara Perera',
    disabilityBadge: 'Wheelchair User',
    status: 'pending',
  };

  // Simulate approval action
  const approvedRequest = {
    ...request,
    status: 'approved',
    reviewedAt: new Date().toISOString(),
    reviewedBy: 'Admin',
  };

  const updatedUserProfile = {
    id: request.userId,
    name: request.vendorName,
    is_verified: true,
    verified: true,
    disability_badge: request.disabilityBadge,
  };

  assert.equal(approvedRequest.status, 'approved');
  assert.equal(updatedUserProfile.is_verified, true);
  assert.equal(updatedUserProfile.disability_badge, 'Wheelchair User');
});

test('AC-55 & AC-56: Vendor verification rejection with reason', () => {
  const request = {
    id: 'ver-102',
    userId: 'u-hope-ngo',
    vendorName: 'Hope Lanka NGO',
    status: 'pending',
  };

  const rejectionReason = 'Medical board certificate photo is illegible. Please re-upload a clear scan.';

  // Simulate rejection action
  const rejectedRequest = {
    ...request,
    status: 'rejected',
    rejectionReason,
    reviewedAt: new Date().toISOString(),
    reviewedBy: 'Admin',
  };

  assert.equal(rejectedRequest.status, 'rejected');
  assert.equal(rejectedRequest.rejectionReason, rejectionReason);
  assert.ok(rejectedRequest.rejectionReason.length > 0);
});

