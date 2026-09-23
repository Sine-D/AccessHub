import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { VendorVerificationRequest, VerificationStatus, VendorBusinessType, VerificationDocumentType } from '../../../types/vendorVerification';
import {
  fetchVendorVerifications,
  approveVendorVerification,
  rejectVendorVerification,
  submitVendorVerification,
} from '../../../services/vendorVerificationService';

export const MobileVendorVerificationQueue: React.FC = () => {
  const [requests, setRequests] = useState<VendorVerificationRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [filter, setFilter] = useState<'all' | VerificationStatus>('all');
  const [search, setSearch] = useState<string>('');

  // Selected request for AC-53 document viewer modal
  const [selectedRequest, setSelectedRequest] = useState<VendorVerificationRequest | null>(null);

  // AC-55 Reject modal state
  const [rejectModalTarget, setRejectModalTarget] = useState<VendorVerificationRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // AC-52 Create Verification Request modal state
  const [createModalVisible, setCreateModalVisible] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');
  const [newPhone, setNewPhone] = useState<string>('');
  const [newDistrict, setNewDistrict] = useState<string>('Colombo');
  const [newBusinessType, setNewBusinessType] = useState<VendorBusinessType>('artisan');
  const [newDocType, setNewDocType] = useState<VerificationDocumentType>('disability_certificate');
  const [newDocNumber, setNewDocNumber] = useState<string>('');
  const [newBadge, setNewBadge] = useState<string>('Verified Disabled Artisan');

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await fetchVendorVerifications();
      setRequests(data);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to load verification requests.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  // AC-54: Approve Verification
  const handleApprove = async (req: VendorVerificationRequest) => {
    Alert.alert(
      'Approve Verification (AC-54)',
      `Are you sure you want to approve "${req.vendorName}"? This assigns the badge "${req.disabilityBadge || 'Verified Disabled Artisan'}".`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            setActionLoading(true);
            try {
              await approveVendorVerification(req.id, req.userId, req.disabilityBadge || 'Verified Disabled Artisan');
              Alert.alert('Success', `Vendor "${req.vendorName}" has been successfully approved!`);
              setSelectedRequest(null);
              await loadRequests();
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to approve vendor verification.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  // AC-55: Open Rejection Modal
  const openRejectModal = (req: VendorVerificationRequest) => {
    setRejectModalTarget(req);
    setRejectionReason('');
  };

  // AC-55: Confirm Rejection with Reason
  const handleConfirmReject = async () => {
    if (!rejectModalTarget) return;
    if (!rejectionReason.trim()) {
      Alert.alert('Rejection Reason Required', 'Please provide a clear reason for rejecting this verification request.');
      return;
    }

    setActionLoading(true);
    try {
      await rejectVendorVerification(rejectModalTarget.id, rejectionReason.trim());
      Alert.alert('Rejected', `Verification for "${rejectModalTarget.vendorName}" has been rejected.`);
      setRejectModalTarget(null);
      setSelectedRequest(null);
      setRejectionReason('');
      await loadRequests();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to reject verification request.');
    } finally {
      setActionLoading(false);
    }
  };

  // AC-52: Create New Verification Request
  const handleCreateRequest = async () => {
    if (!newName.trim()) {
      Alert.alert('Validation Error', 'Vendor name is required.');
      return;
    }
    if (!newDocNumber.trim()) {
      Alert.alert('Validation Error', 'Document number is required.');
      return;
    }

    setActionLoading(true);
    try {
      await submitVendorVerification({
        userId: 'vendor-auto-' + Date.now().toString().slice(-4),
        vendorName: newName.trim(),
        email: newEmail.trim() || 'vendor@accesshub.lk',
        phone: newPhone.trim() || '+94 77 123 4567',
        district: newDistrict,
        businessType: newBusinessType,
        documentType: newDocType,
        documentNumber: newDocNumber.trim(),
        documentUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=600',
        disabilityBadge: newBadge,
      });

      Alert.alert('Request Submitted (AC-52)', 'New vendor verification request added to the queue.');
      setCreateModalVisible(false);
      setNewName('');
      setNewDocNumber('');
      setNewEmail('');
      setNewPhone('');
      await loadRequests();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to submit verification request.');
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = requests.filter((r) => {
    const matchesFilter = filter === 'all' || r.status === filter;
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      r.vendorName.toLowerCase().includes(q) ||
      r.documentNumber.toLowerCase().includes(q) ||
      r.district.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const approvedCount = requests.filter((r) => r.status === 'approved').length;
  const rejectedCount = requests.filter((r) => r.status === 'rejected').length;

  return (
    <View style={styles.container}>
      {/* Header Info */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>🏢 Vendor Verification (AC-51)</Text>
          <Text style={styles.headerSubtitle}>Review disability credentials & medical documents</Text>
        </View>
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => setCreateModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Submit new vendor verification request"
        >
          <Text style={styles.newBtnText}>➕ New (AC-52)</Text>
        </TouchableOpacity>
      </View>

      {/* Metric Counters */}
      <View style={styles.metricsRow}>
        <TouchableOpacity
          style={[styles.metricCard, filter === 'pending' && styles.metricCardActive]}
          onPress={() => setFilter(filter === 'pending' ? 'all' : 'pending')}
        >
          <Text style={styles.metricNumber}>{pendingCount}</Text>
          <Text style={[styles.metricLabel, { color: '#fbbf24' }]}>⏳ Pending</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.metricCard, filter === 'approved' && styles.metricCardActive]}
          onPress={() => setFilter(filter === 'approved' ? 'all' : 'approved')}
        >
          <Text style={styles.metricNumber}>{approvedCount}</Text>
          <Text style={[styles.metricLabel, { color: '#34d399' }]}>✓ Approved</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.metricCard, filter === 'rejected' && styles.metricCardActive]}
          onPress={() => setFilter(filter === 'rejected' ? 'all' : 'rejected')}
        >
          <Text style={styles.metricNumber}>{rejectedCount}</Text>
          <Text style={[styles.metricLabel, { color: '#f87171' }]}>✕ Rejected</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.metricCard, filter === 'all' && styles.metricCardActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={styles.metricNumber}>{requests.length}</Text>
          <Text style={[styles.metricLabel, { color: '#38bdf8' }]}>Total</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by vendor, doc # or district..."
          placeholderTextColor="#64748b"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={{ color: '#94a3b8', fontSize: 13, paddingHorizontal: 6 }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsRow}>
        {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, filter === tab && styles.tabButtonActive]}
            onPress={() => setFilter(tab)}
          >
            <Text style={[styles.tabButtonText, filter === tab && styles.tabButtonTextActive]}>
              {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'pending' && pendingCount > 0 ? ` (${pendingCount})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Loading state */}
      {loading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading verification requests...</Text>
        </View>
      ) : filtered.length === 0 ? (
        /* Empty State */
        <View style={styles.emptyContainer}>
          <Text style={{ fontSize: 32, marginBottom: 8 }}>📋</Text>
          <Text style={styles.emptyTitle}>No verification requests found</Text>
          <Text style={styles.emptySubtitle}>
            {search ? 'Try adjusting your search criteria.' : 'There are currently no requests in this filter category.'}
          </Text>
        </View>
      ) : (
        /* Request Cards List */
        <View style={{ gap: 12 }}>
          {filtered.map((req) => {
            const isPending = req.status === 'pending';
            const isApproved = req.status === 'approved';
            const isRejected = req.status === 'rejected';

            const badgeBg = isApproved ? 'rgba(16, 185, 129, 0.15)' : isRejected ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)';
            const badgeBorder = isApproved ? '#10b981' : isRejected ? '#ef4444' : '#f59e0b';
            const badgeColor = isApproved ? '#34d399' : isRejected ? '#f87171' : '#fbbf24';

            return (
              <View key={req.id} style={styles.card}>
                {/* Card Header */}
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.vendorName}>{req.vendorName}</Text>
                    <Text style={styles.vendorSubtitle}>
                      📍 {req.district} District • {req.businessType.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: badgeBg, borderColor: badgeBorder }]}>
                    <Text style={[styles.statusBadgeText, { color: badgeColor }]}>
                      {isApproved ? '✓ APPROVED' : isRejected ? '✕ REJECTED' : '⏳ PENDING'}
                    </Text>
                  </View>
                </View>

                {/* Document Information (AC-53 Preview) */}
                <View style={styles.docInfoBox}>
                  <View style={styles.docInfoRow}>
                    <Text style={styles.docInfoLabel}>📄 Document:</Text>
                    <Text style={styles.docInfoValue}>{req.documentType.replace(/_/g, ' ')}</Text>
                  </View>
                  <View style={styles.docInfoRow}>
                    <Text style={styles.docInfoLabel}>🔢 Doc Number:</Text>
                    <Text style={[styles.docInfoValue, { fontFamily: 'monospace', color: '#38bdf8' }]}>
                      {req.documentNumber}
                    </Text>
                  </View>
                  <View style={styles.docInfoRow}>
                    <Text style={styles.docInfoLabel}>🎖️ Target Badge:</Text>
                    <Text style={[styles.docInfoValue, { color: '#a855f7', fontWeight: 'bold' }]}>
                      {req.disabilityBadge || 'Verified Disabled Artisan'}
                    </Text>
                  </View>
                  {req.rejectionReason && (
                    <View style={styles.rejectionNotice}>
                      <Text style={styles.rejectionNoticeTitle}>⚠️ Rejection Reason:</Text>
                      <Text style={styles.rejectionNoticeText}>{req.rejectionReason}</Text>
                    </View>
                  )}
                </View>

                {/* Card Actions */}
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.inspectBtn}
                    onPress={() => setSelectedRequest(req)}
                    accessibilityRole="button"
                    accessibilityLabel={`Inspect documents for ${req.vendorName}`}
                  >
                    <Text style={styles.inspectBtnText}>👁️ Inspect Docs (AC-53)</Text>
                  </TouchableOpacity>

                  {isPending && (
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <TouchableOpacity
                        style={styles.approveBtn}
                        onPress={() => handleApprove(req)}
                        accessibilityRole="button"
                        accessibilityLabel={`Approve ${req.vendorName}`}
                      >
                        <Text style={styles.approveBtnText}>✓ Approve (AC-54)</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.rejectBtn}
                        onPress={() => openRejectModal(req)}
                        accessibilityRole="button"
                        accessibilityLabel={`Reject ${req.vendorName}`}
                      >
                        <Text style={styles.rejectBtnText}>✕ Reject (AC-55)</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* ========================================================= */}
      {/* AC-53: INSPECT DOCUMENTS MODAL                            */}
      {/* ========================================================= */}
      <Modal visible={!!selectedRequest} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedRequest && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>📄 Document Inspector (AC-53)</Text>
                  <TouchableOpacity onPress={() => setSelectedRequest(null)} style={styles.closeBtn}>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>✕</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalVendorName}>{selectedRequest.vendorName}</Text>
                <Text style={styles.modalVendorMeta}>
                  {selectedRequest.email} • {selectedRequest.phone}
                </Text>

                {/* Document Details Box */}
                <View style={styles.modalDetailBox}>
                  <Text style={styles.modalDetailTitle}>📋 Verification Credentials</Text>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Business Type:</Text>
                    <Text style={styles.modalDetailVal}>{selectedRequest.businessType.toUpperCase()}</Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Document Type:</Text>
                    <Text style={styles.modalDetailVal}>{selectedRequest.documentType.replace(/_/g, ' ')}</Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Registration ID:</Text>
                    <Text style={[styles.modalDetailVal, { color: '#38bdf8', fontWeight: 'bold' }]}>
                      {selectedRequest.documentNumber}
                    </Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>District:</Text>
                    <Text style={styles.modalDetailVal}>{selectedRequest.district} District</Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Badge to Grant:</Text>
                    <Text style={[styles.modalDetailVal, { color: '#a855f7', fontWeight: 'bold' }]}>
                      {selectedRequest.disabilityBadge}
                    </Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Status:</Text>
                    <Text style={[styles.modalDetailVal, { fontWeight: 'bold' }]}>
                      {selectedRequest.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Document Image Preview */}
                <Text style={styles.modalSectionLabel}>🖼️ Uploaded Certificate Proof</Text>
                {selectedRequest.documentUrl ? (
                  <View style={styles.docImageContainer}>
                    <Image
                      source={{ uri: selectedRequest.documentUrl }}
                      style={styles.docImage}
                      resizeMode="cover"
                    />
                  </View>
                ) : (
                  <View style={[styles.docImageContainer, { justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ color: '#94a3b8', fontSize: 12 }}>No document photo attached</Text>
                  </View>
                )}

                {/* Modal Actions */}
                {selectedRequest.status === 'pending' ? (
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                    <TouchableOpacity
                      style={[styles.modalApproveBtn, { flex: 1 }]}
                      onPress={() => handleApprove(selectedRequest)}
                    >
                      <Text style={styles.modalApproveBtnText}>✓ Approve Verification</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalRejectBtn, { flex: 1 }]}
                      onPress={() => openRejectModal(selectedRequest)}
                    >
                      <Text style={styles.modalRejectBtnText}>✕ Reject Request</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.modalDoneBtn, { marginTop: 16 }]}
                    onPress={() => setSelectedRequest(null)}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Close Inspector</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* AC-55: REJECTION FEEDBACK MODAL                           */}
      {/* ========================================================= */}
      <Modal visible={!!rejectModalTarget} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: 380 }]}>
            <Text style={styles.modalTitle}>⚠️ Reject Verification (AC-55)</Text>
            <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>
              Provide clear feedback explaining why {rejectModalTarget?.vendorName}'s application cannot be verified.
            </Text>

            <TextInput
              style={styles.reasonInput}
              placeholder="e.g. Document is expired, blur photo, or registration number is invalid..."
              placeholderTextColor="#64748b"
              multiline
              numberOfLines={4}
              value={rejectionReason}
              onChangeText={setRejectionReason}
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setRejectModalTarget(null)}
              >
                <Text style={{ color: '#94a3b8', fontWeight: 'bold' }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmRejectBtn, actionLoading && { opacity: 0.6 }]}
                disabled={actionLoading}
                onPress={handleConfirmReject}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Confirm Rejection (AC-55)</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* AC-52: CREATE VERIFICATION REQUEST MODAL                  */}
      {/* ========================================================= */}
      <Modal visible={createModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>➕ New Verification Request (AC-52)</Text>
                <TouchableOpacity onPress={() => setCreateModalVisible(false)} style={styles.closeBtn}>
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Vendor Full Name *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Priyantha Jayasuriya"
                placeholderTextColor="#64748b"
                value={newName}
                onChangeText={setNewName}
              />

              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.formInput}
                placeholder="vendor@accesshub.lk"
                placeholderTextColor="#64748b"
                keyboardType="email-address"
                value={newEmail}
                onChangeText={setNewEmail}
              />

              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.formInput}
                placeholder="+94 77 123 4567"
                placeholderTextColor="#64748b"
                keyboardType="phone-pad"
                value={newPhone}
                onChangeText={setNewPhone}
              />

              <Text style={styles.inputLabel}>Document Number *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. SL-DIS-88492"
                placeholderTextColor="#64748b"
                value={newDocNumber}
                onChangeText={setNewDocNumber}
              />

              <Text style={styles.inputLabel}>District</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Colombo, Kandy, Galle..."
                placeholderTextColor="#64748b"
                value={newDistrict}
                onChangeText={setNewDistrict}
              />

              <Text style={styles.inputLabel}>Disability Badge to Award</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Verified Disabled Artisan"
                placeholderTextColor="#64748b"
                value={newBadge}
                onChangeText={setNewBadge}
              />

              <TouchableOpacity
                style={[styles.submitFormBtn, actionLoading && { opacity: 0.6 }]}
                disabled={actionLoading}
                onPress={handleCreateRequest}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitFormBtnText}>Submit Verification Request (AC-52)</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  newBtn: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  newBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    padding: 10,
    borderRadius: 14,
    borderColor: '#334155',
    borderWidth: 1,
    alignItems: 'center',
  },
  metricCardActive: {
    borderColor: '#6366f1',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  metricNumber: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: 'bold',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderColor: '#334155',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  searchIcon: {
    marginRight: 6,
    fontSize: 14,
  },
  searchInput: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 12,
    padding: 0,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    borderColor: '#334155',
    borderWidth: 1,
  },
  tabButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  tabButtonText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: 'bold',
  },
  tabButtonTextActive: {
    color: '#ffffff',
  },
  card: {
    backgroundColor: '#1e293b',
    padding: 14,
    borderRadius: 16,
    borderColor: '#334155',
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  vendorName: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: 'bold',
  },
  vendorSubtitle: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  docInfoBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    padding: 10,
    borderRadius: 10,
    marginVertical: 6,
    gap: 4,
  },
  docInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  docInfoLabel: {
    color: '#94a3b8',
    fontSize: 11,
  },
  docInfoValue: {
    color: '#f8fafc',
    fontSize: 11,
  },
  rejectionNotice: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 8,
    borderRadius: 8,
    borderColor: '#ef4444',
    borderWidth: 1,
    marginTop: 6,
  },
  rejectionNoticeTitle: {
    color: '#f87171',
    fontSize: 10,
    fontWeight: 'bold',
  },
  rejectionNoticeText: {
    color: '#fca5a5',
    fontSize: 11,
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  inspectBtn: {
    flex: 1,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38bdf8',
    borderWidth: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  inspectBtnText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: 'bold',
  },
  approveBtn: {
    backgroundColor: '#10b981',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  approveBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  rejectBtn: {
    backgroundColor: '#7f1d1d',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  rejectBtnText: {
    color: '#fca5a5',
    fontSize: 11,
    fontWeight: 'bold',
  },
  emptyContainer: {
    backgroundColor: '#1e293b',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderColor: '#334155',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 8,
  },
  emptyTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptySubtitle: {
    color: '#94a3b8',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 18,
    borderColor: '#334155',
    borderWidth: 1,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeBtn: {
    backgroundColor: '#334155',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalVendorName: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: 'bold',
  },
  modalVendorMeta: {
    color: '#38bdf8',
    fontSize: 12,
    marginBottom: 12,
  },
  modalDetailBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    padding: 12,
    borderRadius: 12,
    gap: 6,
    marginBottom: 14,
  },
  modalDetailTitle: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalDetailLabel: {
    color: '#94a3b8',
    fontSize: 11,
  },
  modalDetailVal: {
    color: '#f8fafc',
    fontSize: 11,
  },
  modalSectionLabel: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  docImageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    overflow: 'hidden',
    borderColor: '#334155',
    borderWidth: 1,
  },
  docImage: {
    width: '100%',
    height: '100%',
  },
  modalApproveBtn: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalApproveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  modalRejectBtn: {
    backgroundColor: '#dc2626',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalRejectBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  modalDoneBtn: {
    backgroundColor: '#334155',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  reasonInput: {
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 12,
    marginTop: 12,
    textAlignVertical: 'top',
    height: 90,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#334155',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmRejectBtn: {
    flex: 2,
    backgroundColor: '#dc2626',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  inputLabel: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 4,
  },
  formInput: {
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
  },
  submitFormBtn: {
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 10,
  },
  submitFormBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
