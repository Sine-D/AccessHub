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
import { Product, ListingModerationStatus } from '../../../core/types/models';
import {
  fetchMarketplaceListings,
  approveListing,
  rejectListing,
} from '../../../services/listingModerationService';

export const MobileListingModerationQueue: React.FC = () => {
  const [listings, setListings] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<'all' | ListingModerationStatus>('pending');
  const [search, setSearch] = useState<string>('');

  // Selected listing for AC-58 detail inspector modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // AC-60 & AC-61 Reject modal state
  const [rejectModalTarget, setRejectModalTarget] = useState<Product | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const loadListings = async () => {
    try {
      setLoading(true);
      const data = await fetchMarketplaceListings();
      setListings(data);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to load marketplace listings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, []);

  // AC-59: Approve Listing
  const handleApprove = (product: Product) => {
    Alert.alert(
      'Approve Listing (AC-59)',
      `Are you sure you want to approve "${product.title}"? It will become visible on the public marketplace.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            setActionLoading(true);
            try {
              await approveListing(product.id);
              Alert.alert('Listing Approved', `"${product.title}" is now approved for the marketplace!`);
              setSelectedProduct(null);
              await loadListings();
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to approve listing.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  // AC-60 & AC-61: Open Reject Modal
  const openRejectModal = (product: Product) => {
    setRejectModalTarget(product);
    setRejectionReason('');
  };

  // AC-60, AC-61 & AC-62: Confirm Rejection with Reason
  const handleConfirmReject = async () => {
    if (!rejectModalTarget) return;
    const finalReason = rejectionReason.trim() || 'Listing does not meet accessibility verification guidelines.';

    setActionLoading(true);
    try {
      await rejectListing(rejectModalTarget.id, finalReason);
      Alert.alert('Listing Rejected', `"${rejectModalTarget.title}" has been rejected.`);
      setRejectModalTarget(null);
      setSelectedProduct(null);
      setRejectionReason('');
      await loadListings();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to reject listing.');
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = listings.filter((p) => {
    const matchesFilter = filter === 'all' || (p.moderationStatus || 'pending') === filter;
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.sellerName.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.accessibilityFeatures || []).some((f) => f.toLowerCase().includes(q));
    return matchesFilter && matchesSearch;
  });

  const pendingCount = listings.filter((p) => (p.moderationStatus || 'pending') === 'pending').length;
  const approvedCount = listings.filter((p) => p.moderationStatus === 'approved').length;
  const rejectedCount = listings.filter((p) => p.moderationStatus === 'rejected').length;

  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>🛍️ Listing Moderation (AC-57)</Text>
          <Text style={styles.headerSubtitle}>
            Audit seller listings, alt-text quality & accessibility claims
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadListings}>
          <Text style={styles.refreshBtnText}>🔄 Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Metrics Row */}
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
          <Text style={styles.metricNumber}>{listings.length}</Text>
          <Text style={[styles.metricLabel, { color: '#38bdf8' }]}>Total</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search listings by title, seller, or tag..."
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
          <ActivityIndicator size="large" color="#38bdf8" />
          <Text style={styles.loadingText}>Loading marketplace listings...</Text>
        </View>
      ) : filtered.length === 0 ? (
        /* Empty State */
        <View style={styles.emptyContainer}>
          <Text style={{ fontSize: 32, marginBottom: 8 }}>📋</Text>
          <Text style={styles.emptyTitle}>No listings found</Text>
          <Text style={styles.emptySubtitle}>
            {search ? 'Try adjusting your search query.' : `No listings currently in "${filter}" status.`}
          </Text>
        </View>
      ) : (
        /* Listing Cards */
        <View style={{ gap: 12 }}>
          {filtered.map((item) => {
            const isPending = (item.moderationStatus || 'pending') === 'pending';
            const isApproved = item.moderationStatus === 'approved';
            const isRejected = item.moderationStatus === 'rejected';

            const badgeBg = isApproved
              ? 'rgba(16, 185, 129, 0.15)'
              : isRejected
              ? 'rgba(239, 68, 68, 0.15)'
              : 'rgba(245, 158, 11, 0.15)';
            const badgeBorder = isApproved ? '#10b981' : isRejected ? '#ef4444' : '#f59e0b';
            const badgeColor = isApproved ? '#34d399' : isRejected ? '#f87171' : '#fbbf24';

            return (
              <View key={item.id} style={styles.card}>
                {/* Header: Title + Status */}
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.productTitle}>{item.title}</Text>
                    <Text style={styles.productMeta}>
                      📁 {item.category} • LKR {item.price.toLocaleString()}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: badgeBg, borderColor: badgeBorder }]}>
                    <Text style={[styles.statusBadgeText, { color: badgeColor }]}>
                      {isApproved ? '✓ APPROVED' : isRejected ? '✕ REJECTED' : '⏳ PENDING'}
                    </Text>
                  </View>
                </View>

                {/* Thumbnail & Alt-Text Box */}
                <View style={styles.previewRow}>
                  <Image source={{ uri: item.image }} style={styles.thumbnail} />
                  <View style={{ flex: 1, gap: 4 }}>
                    {/* Alt-Text Indicator */}
                    <View
                      style={[
                        styles.altBadge,
                        {
                          backgroundColor: item.altText
                            ? 'rgba(16, 185, 129, 0.15)'
                            : 'rgba(239, 68, 68, 0.15)',
                          borderColor: item.altText ? '#10b981' : '#ef4444',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.altBadgeText,
                          { color: item.altText ? '#34d399' : '#f87171' },
                        ]}
                      >
                        {item.altText ? 'ALT-TEXT ✓ PRESENT' : '⚠️ NO ALT-TEXT'}
                      </Text>
                    </View>

                    {/* Seller Profile */}
                    <Text style={styles.sellerText}>
                      👤 {item.sellerName}
                      {item.disabilityBadge ? ` • ♿ ${item.disabilityBadge}` : ''}
                    </Text>

                    {/* In Stock */}
                    <Text style={{ fontSize: 10, color: item.inStock ? '#34d399' : '#f87171' }}>
                      {item.inStock ? '● In Stock' : '○ Out of Stock'}
                    </Text>
                  </View>
                </View>

                {/* Accessibility Features */}
                {item.accessibilityFeatures && item.accessibilityFeatures.length > 0 && (
                  <View style={styles.featuresRow}>
                    {item.accessibilityFeatures.map((f, i) => (
                      <View key={i} style={styles.featureChip}>
                        <Text style={styles.featureChipText}>✓ {f}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Rejection Feedback if any */}
                {item.rejectionReason && (
                  <View style={styles.rejectionNotice}>
                    <Text style={styles.rejectionNoticeTitle}>⚠️ Rejection Reason:</Text>
                    <Text style={styles.rejectionNoticeText}>{item.rejectionReason}</Text>
                  </View>
                )}

                {/* Actions */}
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.inspectBtn}
                    onPress={() => setSelectedProduct(item)}
                    accessibilityRole="button"
                    accessibilityLabel={`Inspect details for ${item.title}`}
                  >
                    <Text style={styles.inspectBtnText}>👁️ Inspect & Alt-Text (AC-58)</Text>
                  </TouchableOpacity>

                  {isPending && (
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <TouchableOpacity
                        style={styles.approveBtn}
                        onPress={() => handleApprove(item)}
                        accessibilityRole="button"
                        accessibilityLabel={`Approve ${item.title}`}
                      >
                        <Text style={styles.approveBtnText}>✓ Approve (AC-59)</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.rejectBtn}
                        onPress={() => openRejectModal(item)}
                        accessibilityRole="button"
                        accessibilityLabel={`Reject ${item.title}`}
                      >
                        <Text style={styles.rejectBtnText}>✕ Reject (AC-60)</Text>
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
      {/* AC-58: INSPECT LISTING MODAL                              */}
      {/* ========================================================= */}
      <Modal visible={!!selectedProduct} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedProduct && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>🛍️ Listing Inspector (AC-58)</Text>
                  <TouchableOpacity onPress={() => setSelectedProduct(null)} style={styles.closeBtn}>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Product Image */}
                <View style={styles.modalImageContainer}>
                  <Image
                    source={{ uri: selectedProduct.image }}
                    style={styles.modalImage}
                    resizeMode="cover"
                  />
                </View>

                {/* Alt-Text Audit Box */}
                <View style={styles.altAuditBox}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.altAuditTitle}>👁️ Screen-Reader Alt-Text</Text>
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: 'bold',
                        color: selectedProduct.altText ? '#34d399' : '#f87171',
                      }}
                    >
                      {selectedProduct.altText ? '✓ Provided' : '⚠️ Missing'}
                    </Text>
                  </View>
                  <Text style={styles.altAuditContent}>
                    "{selectedProduct.altText || 'No descriptive alt text provided by seller.'}"
                  </Text>
                </View>

                {/* Product Title & Pricing */}
                <Text style={styles.modalProductTitle}>{selectedProduct.title}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.modalPrice}>LKR {selectedProduct.price.toLocaleString()}</Text>
                  <Text style={styles.modalCategory}>📁 {selectedProduct.category}</Text>
                </View>

                {/* Seller Info */}
                <View style={styles.sellerCardBox}>
                  <Text style={{ color: '#f8fafc', fontWeight: 'bold', fontSize: 12 }}>
                    👤 Seller: {selectedProduct.sellerName}
                  </Text>
                  {selectedProduct.disabilityBadge ? (
                    <Text style={{ color: '#a855f7', fontSize: 11, marginTop: 2 }}>
                      ♿ Disability Badge: {selectedProduct.disabilityBadge}
                    </Text>
                  ) : null}
                  <Text style={{ color: '#94a3b8', fontSize: 11, marginTop: 2 }}>
                    ★ {selectedProduct.sellerRating} ({selectedProduct.reviewsCount} reviews) • Contact: {selectedProduct.sellerPhone || 'Verified'}
                  </Text>
                </View>

                {/* Accessibility Features */}
                <Text style={styles.sectionHeading}>Accessibility Features Declared</Text>
                <View style={styles.featuresRow}>
                  {selectedProduct.accessibilityFeatures && selectedProduct.accessibilityFeatures.length > 0 ? (
                    selectedProduct.accessibilityFeatures.map((f, i) => (
                      <View key={i} style={styles.featureChip}>
                        <Text style={styles.featureChipText}>✓ {f}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={{ color: '#94a3b8', fontSize: 11 }}>No accessibility features declared</Text>
                  )}
                </View>

                {/* Description */}
                <Text style={styles.sectionHeading}>Description</Text>
                <Text style={styles.descriptionText}>{selectedProduct.description}</Text>

                {/* Modal Actions */}
                {selectedProduct.moderationStatus === 'pending' ? (
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                    <TouchableOpacity
                      style={[styles.modalApproveBtn, { flex: 1 }]}
                      onPress={() => handleApprove(selectedProduct)}
                    >
                      <Text style={styles.modalApproveBtnText}>✓ Approve Listing (AC-59)</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.modalRejectBtn, { flex: 1 }]}
                      onPress={() => openRejectModal(selectedProduct)}
                    >
                      <Text style={styles.modalRejectBtnText}>✕ Reject (AC-60)</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.modalDoneBtn, { marginTop: 16 }]}
                    onPress={() => setSelectedProduct(null)}
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
      {/* AC-60 & AC-61: REJECTION FEEDBACK MODAL                   */}
      {/* ========================================================= */}
      <Modal visible={!!rejectModalTarget} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: 380 }]}>
            <Text style={styles.modalTitle}>⚠️ Reject Listing (AC-60)</Text>
            <Text style={{ color: '#94a3b8', fontSize: 11, marginTop: 4 }}>
              Provide constructive feedback to help the seller update their listing to meet accessibility standards (AC-61).
            </Text>

            <TextInput
              style={styles.reasonInput}
              placeholder="e.g. Missing image alt-text, unverified tactile features, or incomplete specifications..."
              placeholderTextColor="#64748b"
              multiline
              numberOfLines={4}
              value={rejectionReason}
              onChangeText={setRejectionReason}
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setRejectModalTarget(null)}>
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
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Confirm Rejection (AC-60)</Text>
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
    fontSize: 16,
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
    color: '#38bdf8',
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
    borderColor: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
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
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
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
    alignItems: 'flex-start',
  },
  productTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: 'bold',
  },
  productMeta: {
    color: '#38bdf8',
    fontSize: 11,
    marginTop: 2,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  previewRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#0f172a',
  },
  altBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  altBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  sellerText: {
    color: '#cbd5e1',
    fontSize: 11,
  },
  featuresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  featureChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: '#334155',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  featureChipText: {
    color: '#94a3b8',
    fontSize: 10,
  },
  rejectionNotice: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 8,
    borderRadius: 8,
    borderColor: '#ef4444',
    borderWidth: 1,
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
    paddingTop: 8,
    borderTopColor: '#334155',
    borderTopWidth: 1,
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
    marginBottom: 10,
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
  modalImageContainer: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
    borderColor: '#334155',
    borderWidth: 1,
    marginBottom: 10,
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  altAuditBox: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderColor: '#0284c7',
    borderWidth: 1,
    padding: 10,
    borderRadius: 12,
    marginBottom: 10,
  },
  altAuditTitle: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: 'bold',
  },
  altAuditContent: {
    color: '#cbd5e1',
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 4,
  },
  modalProductTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: 'bold',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  modalPrice: {
    color: '#38bdf8',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalCategory: {
    color: '#94a3b8',
    fontSize: 11,
  },
  sellerCardBox: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    padding: 10,
    borderRadius: 12,
    marginVertical: 8,
  },
  sectionHeading: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 4,
  },
  descriptionText: {
    color: '#cbd5e1',
    fontSize: 11,
    lineHeight: 16,
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
});

