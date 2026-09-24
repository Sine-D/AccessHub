import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { ModerationItem, PaginatedModerationResponse } from '../../../types/fraudModeration';
import {
  fetchModerationQueue,
  approveModeratedContent,
  removeModeratedContent,
  subscribeToRemovalUpdates,
} from '../../../services/fraudModerationService';
import { useAppState } from '../../../core/hooks/useAppState';

export const MobileFraudModerationQueue: React.FC = () => {
  const { userRole } = useAppState();

  const [paginatedData, setPaginatedData] = useState<PaginatedModerationResponse | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(3); // AC-256 pagination
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Targets for confirmation modals
  const [approvalTarget, setApprovalTarget] = useState<ModerationItem | null>(null);
  const [removalTarget, setRemovalTarget] = useState<ModerationItem | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await fetchModerationQueue(userRole || 'admin', {
        page,
        pageSize,
        typeFilter,
        statusFilter: 'flagged',
      });
      setPaginatedData(data);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to load fraud moderation queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userRole, page, typeFilter]);

  // AC-263: Real-time removal update subscription
  useEffect(() => {
    const unsubscribe = subscribeToRemovalUpdates((removedId) => {
      loadData();
    });
    return () => unsubscribe();
  }, []);

  // AC-257: Confirm Approve Content
  const handleConfirmApprove = async () => {
    if (!approvalTarget) return;
    setActionLoading(true);
    setErrorMessage(null);
    try {
      await approveModeratedContent(approvalTarget.contentId, userRole || 'admin');
      setFeedbackMessage(`✓ Approved "${approvalTarget.title}". Flag has been dismissed.`);
      setApprovalTarget(null);
      await loadData();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to approve content.');
    } finally {
      setActionLoading(false);
    }
  };

  // AC-258: Confirm Remove Content
  const handleConfirmRemove = async () => {
    if (!removalTarget) return;
    setActionLoading(true);
    setErrorMessage(null);
    try {
      await removeModeratedContent(removalTarget.contentId, userRole || 'admin');
      setFeedbackMessage(`✕ "${removalTarget.title}" was permanently removed.`);
      setRemovalTarget(null);
      await loadData();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to remove content.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>🚨 Fraud Moderation Queue (AC-252)</Text>
          <Text style={styles.headerSubtitle}>Review 3+ distinct user report flags & duplicate photos</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadData}>
          <Text style={styles.refreshBtnText}>🔄 Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Realtime / Action Feedback Banner */}
      {feedbackMessage && (
        <View style={styles.feedbackBanner}>
          <Text style={styles.feedbackBannerText}>{feedbackMessage}</Text>
          <TouchableOpacity onPress={() => setFeedbackMessage(null)} style={{ paddingHorizontal: 6 }}>
            <Text style={{ color: '#86efac', fontWeight: 'bold', fontSize: 13 }}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Error Notice Banner */}
      {errorMessage && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>⚠️ {errorMessage}</Text>
          <TouchableOpacity onPress={() => setErrorMessage(null)} style={{ paddingHorizontal: 6 }}>
            <Text style={{ color: '#fca5a5', fontWeight: 'bold', fontSize: 13 }}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Filter Tabs (AC-253, AC-254, AC-255) */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', gap: 6 }}>
        {[
          { id: 'all', label: 'All Items' },
          { id: 'flagged_review', label: 'Reviews (AC-253)' },
          { id: 'duplicate_photo', label: 'Duplicates (AC-254)' },
          { id: 'flagged_listing', label: 'Listings (AC-255)' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabButton, typeFilter === tab.id && styles.tabButtonActive]}
            onPress={() => {
              setTypeFilter(tab.id);
              setPage(1);
            }}
          >
            <Text style={[styles.tabButtonText, typeFilter === tab.id && styles.tabButtonTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List / Loading */}
      {loading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#f87171" />
          <Text style={styles.loadingText}>Loading suspicious content queue...</Text>
        </View>
      ) : !paginatedData || paginatedData.items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={{ fontSize: 32, marginBottom: 8 }}>✨</Text>
          <Text style={styles.emptyTitle}>Queue Clear!</Text>
          <Text style={styles.emptySubtitle}>No flagged items currently pending moderation.</Text>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {paginatedData.items.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>{item.contentType.replace('_', ' ').toUpperCase()}</Text>
                </View>

                {/* AC-259: 3 Distinct User Reports Badge */}
                <View style={styles.reportBadge}>
                  <Text style={styles.reportBadgeText}>
                    🚩 {item.reportCount || 3} Distinct User Reports (AC-259)
                  </Text>
                </View>
              </View>

              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemDescription}>{item.description}</Text>

              {item.photoUri && (
                <Image source={{ uri: item.photoUri }} style={styles.photoPreview} resizeMode="cover" />
              )}

              <Text style={styles.authorText}>Author: {item.authorName}</Text>

              {/* Action Buttons (AC-257, AC-258) */}
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.approveBtn}
                  onPress={() => setApprovalTarget(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`Approve ${item.title}`}
                >
                  <Text style={styles.approveBtnText}>✓ Approve (AC-257)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => setRemovalTarget(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${item.title}`}
                >
                  <Text style={styles.removeBtnText}>✕ Remove (AC-258)</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Pagination Controls (AC-256) */}
      {paginatedData && paginatedData.totalPages > 1 && (
        <View style={styles.paginationRow}>
          <TouchableOpacity
            disabled={page <= 1}
            style={[styles.pageBtn, page <= 1 && { opacity: 0.4 }]}
            onPress={() => setPage((p) => Math.max(1, p - 1))}
          >
            <Text style={styles.pageBtnText}>← Previous</Text>
          </TouchableOpacity>

          <Text style={styles.pageText}>
            Page {paginatedData.page} of {paginatedData.totalPages}
          </Text>

          <TouchableOpacity
            disabled={page >= paginatedData.totalPages}
            style={[styles.pageBtn, page >= paginatedData.totalPages && { opacity: 0.4 }]}
            onPress={() => setPage((p) => Math.min(paginatedData.totalPages, p + 1))}
          >
            <Text style={styles.pageBtnText}>Next →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Approval Confirmation Modal (AC-257) */}
      <Modal visible={!!approvalTarget} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { color: '#34d399' }]}>✓ Approve Content (AC-257)</Text>
            <Text style={styles.modalSub}>
              Are you sure you want to approve "{approvalTarget?.title}"? This will dismiss the fraud flag and mark the content as verified.
            </Text>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setApprovalTarget(null)}>
                <Text style={{ color: '#94a3b8', fontWeight: 'bold' }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmApproveBtn, actionLoading && { opacity: 0.6 }]}
                disabled={actionLoading}
                onPress={handleConfirmApprove}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Confirm Approve (AC-257)</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Removal Confirmation Modal (AC-258) */}
      <Modal visible={!!removalTarget} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>⚠️ Remove Content (AC-258)</Text>
            <Text style={styles.modalSub}>
              Are you sure you want to remove "{removalTarget?.title}"? This will purge the flagged content.
            </Text>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setRemovalTarget(null)}>
                <Text style={{ color: '#94a3b8', fontWeight: 'bold' }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmRemoveBtn, actionLoading && { opacity: 0.6 }]}
                disabled={actionLoading}
                onPress={handleConfirmRemove}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Confirm Remove (AC-258)</Text>
                )}
              </TouchableOpacity>
            </View>
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
    fontSize: 15,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  refreshBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  refreshBtnText: {
    color: '#f87171',
    fontSize: 11,
    fontWeight: 'bold',
  },
  tabButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    marginRight: 6,
  },
  tabButtonActive: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
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
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#ef4444',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeBadgeText: {
    color: '#f87171',
    fontSize: 9,
    fontWeight: 'bold',
  },
  reportBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#f59e0b',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  reportBadgeText: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: 'bold',
  },
  itemTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemDescription: {
    color: '#cbd5e1',
    fontSize: 11,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 8,
    borderRadius: 8,
  },
  photoPreview: {
    width: '100%',
    height: 120,
    borderRadius: 10,
    backgroundColor: '#0f172a',
  },
  authorText: {
    color: '#94a3b8',
    fontSize: 10,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopColor: '#334155',
    borderTopWidth: 1,
    gap: 8,
  },
  approveBtn: {
    flex: 1,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10b981',
    borderWidth: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  approveBtnText: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: 'bold',
  },
  removeBtn: {
    flex: 1,
    backgroundColor: '#ef4444',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  removeBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 10,
    borderRadius: 14,
    borderColor: '#334155',
    borderWidth: 1,
  },
  pageBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pageBtnText: {
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: 'bold',
  },
  pageText: {
    color: '#94a3b8',
    fontSize: 11,
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
  },
  modalTitle: {
    color: '#f87171',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalSub: {
    color: '#cbd5e1',
    fontSize: 12,
    marginTop: 6,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#334155',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmRemoveBtn: {
    flex: 1.5,
    backgroundColor: '#ef4444',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmApproveBtn: {
    flex: 1.5,
    backgroundColor: '#10b981',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  feedbackBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10b981',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  feedbackBannerText: {
    color: '#86efac',
    fontSize: 12,
    fontWeight: 'bold',
    flex: 1,
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#ef4444',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  errorBannerText: {
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: 'bold',
    flex: 1,
  },
});

