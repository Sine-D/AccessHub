import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { fetchAccessibilityBadges } from '../../../services/accessibilityBadgeService';
import { fetchMarketplaceListings } from '../../../services/listingModerationService';
import { AccessibilityBadgeRecord } from '../../../types/accessibilityBadge';
import { Product } from '../../../core/types/models';

interface MobileAccessibilityComplianceDashboardProps {
  highContrast?: boolean;
  onSpeak?: (text: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export const MobileAccessibilityComplianceDashboard: React.FC<MobileAccessibilityComplianceDashboardProps> = ({
  highContrast = false,
  onSpeak,
  onNavigateTab,
}) => {
  const [badges, setBadges] = useState<AccessibilityBadgeRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [badgeData, productData] = await Promise.all([
        fetchAccessibilityBadges(),
        fetchMarketplaceListings(),
      ]);
      setBadges(badgeData);
      setProducts(productData);
      if (onSpeak) {
        onSpeak(`Loaded accessibility compliance dashboard. Overall WCAG compliance score calculated.`);
      }
    } catch (err: any) {
      setErrorMsg('Failed to load accessibility compliance data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalAudited = badges.length + products.length;
  const compliantBadges = badges.filter((b) => b.status === 'awarded');
  const nonCompliantListings = products.filter((l) => !l.accessibilityFeatures || l.accessibilityFeatures.length === 0);
  
  const overallScorePercent = totalAudited > 0 ? Math.round(((compliantBadges.length + (products.length - nonCompliantListings.length)) / totalAudited) * 100) : 100;

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      {/* Header Banner */}
      <View
        style={{
          backgroundColor: highContrast ? '#ffff00' : '#0d9488',
          padding: 16,
          borderRadius: 16,
          marginBottom: 16,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: highContrast ? '#000000' : '#ffffff',
          }}
        >
          ✅ Accessibility Compliance Monitoring (AC-68–71)
        </Text>
        <Text
          style={{
            fontSize: 11,
            color: highContrast ? '#000000' : '#ccfbf1',
            marginTop: 4,
          }}
        >
          Monitor platform WCAG AA/AAA compliance scorecards, audit missing image alt-text, inspect accessibility feature tags, and enforce compliance guidelines.
        </Text>
      </View>

      {/* Error Feedback */}
      {!!errorMsg && (
        <View style={{ backgroundColor: '#ffe4e6', padding: 12, borderRadius: 12, marginBottom: 12 }}>
          <Text style={{ color: '#be123c', fontSize: 12, fontWeight: 'bold' }}>✕ {errorMsg}</Text>
          <TouchableOpacity onPress={loadData} style={{ marginTop: 6 }}>
            <Text style={{ color: '#9f1239', fontSize: 11, fontWeight: 'bold', textDecorationLine: 'underline' }}>
              Retry Audit
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Metric Cards Summary Grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {/* Compliance Rating Card */}
        <View
          style={{
            flex: 1,
            minWidth: '45%',
            backgroundColor: highContrast ? '#111111' : '#1e293b',
            padding: 12,
            borderRadius: 12,
            borderLeftWidth: 4,
            borderLeftColor: '#10b981',
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>
            Overall WCAG Score
          </Text>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: highContrast ? '#ffff00' : '#34d399', marginTop: 4 }}>
            {overallScorePercent}% Compliant
          </Text>
          <Text style={{ fontSize: 9, color: '#34d399', marginTop: 2, fontWeight: 'bold' }}>
            ● WCAG AA / AAA Standard
          </Text>
        </View>

        {/* Certified Badges Card */}
        <View
          style={{
            flex: 1,
            minWidth: '45%',
            backgroundColor: highContrast ? '#111111' : '#1e293b',
            padding: 12,
            borderRadius: 12,
            borderLeftWidth: 4,
            borderLeftColor: '#38bdf8',
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>
            Certified Badges
          </Text>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: highContrast ? '#ffff00' : '#38bdf8', marginTop: 4 }}>
            {compliantBadges.length} Active
          </Text>
          <Text style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>Verified Places & Vendors</Text>
        </View>

        {/* Missing Alt-Text Audits Card */}
        <View
          style={{
            flex: 1,
            minWidth: '45%',
            backgroundColor: highContrast ? '#111111' : '#1e293b',
            padding: 12,
            borderRadius: 12,
            borderLeftWidth: 4,
            borderLeftColor: '#f59e0b',
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>
            Alt-Text Audits
          </Text>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: highContrast ? '#ffff00' : '#fbbf24', marginTop: 4 }}>
            {nonCompliantListings.length} Flags
          </Text>
          <Text style={{ fontSize: 9, color: '#fbbf24', marginTop: 2 }}>Requires Image Descriptions</Text>
        </View>

        {/* Audited Records Card */}
        <View
          style={{
            flex: 1,
            minWidth: '45%',
            backgroundColor: highContrast ? '#111111' : '#1e293b',
            padding: 12,
            borderRadius: 12,
            borderLeftWidth: 4,
            borderLeftColor: '#a855f7',
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>
            Audited Records
          </Text>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: highContrast ? '#ffff00' : '#c084fc', marginTop: 4 }}>
            {totalAudited} Items
          </Text>
          <Text style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>Continuous Monitoring</Text>
        </View>
      </View>

      {/* Audit Action Refresh Button */}
      <TouchableOpacity
        onPress={loadData}
        disabled={loading}
        style={{
          backgroundColor: highContrast ? '#ffff00' : '#0d9488',
          paddingVertical: 12,
          borderRadius: 12,
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        {loading ? (
          <ActivityIndicator color={highContrast ? '#000000' : '#ffffff'} />
        ) : (
          <Text style={{ color: highContrast ? '#000000' : '#ffffff', fontWeight: 'bold', fontSize: 13 }}>
            🔄 Re-Audit Compliance Scorecards
          </Text>
        )}
      </TouchableOpacity>

      {/* Compliance Audit Records List */}
      <View
        style={{
          backgroundColor: highContrast ? '#111111' : '#1e293b',
          padding: 14,
          borderRadius: 16,
          marginBottom: 16,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 14, fontWeight: 'bold', color: highContrast ? '#ffff00' : '#ffffff' }}>
            Compliance Audit Records ({badges.length})
          </Text>
          {onNavigateTab && (
            <TouchableOpacity onPress={() => onNavigateTab('badges')}>
              <Text style={{ fontSize: 11, color: '#38bdf8', fontWeight: 'bold' }}>Manage Badges →</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <ActivityIndicator color="#38bdf8" style={{ paddingVertical: 20 }} />
        ) : badges.length === 0 ? (
          <Text style={{ color: '#94a3b8', fontSize: 11, textAlign: 'center', paddingVertical: 16 }}>
            No accessibility compliance audit records found.
          </Text>
        ) : (
          <View style={{ gap: 10 }}>
            {badges.map((b) => (
              <View
                key={b.id}
                style={{
                  backgroundColor: '#0f172a',
                  padding: 12,
                  borderRadius: 12,
                  borderLeftWidth: 4,
                  borderLeftColor: b.status === 'awarded' ? '#10b981' : '#f43f5e',
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#ffffff' }}>{b.entityName}</Text>
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: 'bold',
                      color: b.status === 'awarded' ? '#34d399' : '#f87171',
                      backgroundColor: b.status === 'awarded' ? '#064e3b' : '#881337',
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 6,
                    }}
                  >
                    {b.badgeType}
                  </Text>
                </View>

                <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                  WCAG Score: <Text style={{ color: '#ffffff', fontWeight: 'bold' }}>{b.score.toFixed(1)} / 5.0</Text> • Status:{' '}
                  <Text style={{ color: '#ffffff', fontWeight: 'bold' }}>{b.isVerified ? 'Verified' : 'Unverified'}</Text>
                </Text>

                {!!b.reason && (
                  <Text style={{ fontSize: 10, color: '#cbd5e1', marginTop: 4, fontStyle: 'italic' }}>
                    Audit Notes: "{b.reason}"
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

