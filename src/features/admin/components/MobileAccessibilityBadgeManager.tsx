import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { AccessibilityBadgeRecord, CriteriaRatings } from '../../../types/accessibilityBadge';
import {
  fetchAccessibilityBadges,
  calculateAccessibilityScore,
  checkVerificationRules,
  awardAccessibilityBadge,
} from '../../../services/accessibilityBadgeService';

interface MobileAccessibilityBadgeManagerProps {
  highContrast?: boolean;
  onSpeak?: (text: string) => void;
}

export const MobileAccessibilityBadgeManager: React.FC<MobileAccessibilityBadgeManagerProps> = ({
  highContrast = false,
  onSpeak,
}) => {
  const [badges, setBadges] = useState<AccessibilityBadgeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [entityName, setEntityName] = useState('Colombo Metro Transit Hub');
  const [isVerified, setIsVerified] = useState(true);
  const [ratings, setRatings] = useState<CriteriaRatings>({
    wheelchairRamp: 5,
    brailleMenu: 4,
    audioSignal: 4,
    accessibleRestroom: 4,
  });

  const loadData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchAccessibilityBadges();
      setBadges(data);
    } catch (err) {
      setErrorMsg('Failed to load badges');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const currentScore = calculateAccessibilityScore(ratings);
  const eligibility = checkVerificationRules({
    entityId: 'mobile-loc-1',
    entityType: 'place',
    entityName,
    ratings,
    ratingCount: 3,
    isVerified,
  });

  const handleAward = async () => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const record = await awardAccessibilityBadge(
        {
          entityId: `m-badge-${Date.now()}`,
          entityType: 'place',
          entityName,
          ratings,
          ratingCount: 3,
          isVerified,
        },
        'Admin'
      );

      if (record.status === 'awarded') {
        const text = `Badge awarded: ${record.badgeType} (Score ${record.score}/5.0)`;
        setSuccessMsg(text);
        if (onSpeak) onSpeak(text);
      } else {
        const text = `Ineligible: ${record.reason}`;
        setErrorMsg(text);
        if (onSpeak) onSpeak(text);
      }
      await loadData();
    } catch (err) {
      setErrorMsg('Error awarding badge');
    } finally {
      setLoading(false);
    }
  };

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
          🏅 Accessibility Badge Manager
        </Text>
        <Text
          style={{
            fontSize: 11,
            color: highContrast ? '#000000' : '#e6fffa',
            marginTop: 4,
          }}
        >
          Evaluate accessibility score (AC-87), check rules (AC-88) & assign badge (AC-89).
        </Text>
      </View>

      {/* Alert Banners */}
      {!!successMsg && (
        <View style={{ backgroundColor: '#ccfbf1', padding: 12, borderRadius: 12, marginBottom: 12 }}>
          <Text style={{ color: '#0f766e', fontSize: 12, fontWeight: 'bold' }}>✓ {successMsg}</Text>
        </View>
      )}

      {!!errorMsg && (
        <View style={{ backgroundColor: '#ffe4e6', padding: 12, borderRadius: 12, marginBottom: 12 }}>
          <Text style={{ color: '#be123c', fontSize: 12, fontWeight: 'bold' }}>✕ {errorMsg}</Text>
        </View>
      )}

      {/* Score Calculator Form */}
      <View
        style={{
          backgroundColor: highContrast ? '#111111' : '#1e293b',
          padding: 16,
          borderRadius: 16,
          marginBottom: 16,
        }}
      >
        <Text style={{ fontSize: 14, fontWeight: 'bold', color: highContrast ? '#ffff00' : '#ffffff', marginBottom: 8 }}>
          Calculate Score & Award Badge
        </Text>

        <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#94a3b8', marginBottom: 4 }}>Entity Name</Text>
        <TextInput
          value={entityName}
          onChangeText={setEntityName}
          style={{
            backgroundColor: '#334155',
            color: '#ffffff',
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
            fontSize: 13,
            marginBottom: 12,
          }}
        />

        {/* Verification Check */}
        <TouchableOpacity
          onPress={() => setIsVerified(!isVerified)}
          style={{
            backgroundColor: isVerified ? '#047857' : '#be123c',
            paddingVertical: 10,
            borderRadius: 8,
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 12 }}>
            {isVerified ? '✓ Entity Status: Verified' : '✕ Entity Status: Unverified'}
          </Text>
        </TouchableOpacity>

        {/* Ratings Breakdown */}
        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#e2e8f0', marginBottom: 6 }}>
          Criteria Ratings (1 to 5 Stars):
        </Text>

        {[
          { label: 'Wheelchair Ramp', key: 'wheelchairRamp' as keyof CriteriaRatings },
          { label: 'Braille Menu / Signage', key: 'brailleMenu' as keyof CriteriaRatings },
          { label: 'Audio Signals', key: 'audioSignal' as keyof CriteriaRatings },
          { label: 'Accessible Restroom', key: 'accessibleRestroom' as keyof CriteriaRatings },
        ].map((item) => (
          <View key={item.key} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontSize: 11, color: '#94a3b8', flex: 1 }}>{item.label}</Text>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {[1, 2, 3, 4, 5].map((val) => (
                <TouchableOpacity
                  key={val}
                  onPress={() => setRatings((prev) => ({ ...prev, [item.key]: val }))}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 4,
                    backgroundColor: ratings[item.key] >= val ? '#f59e0b' : '#475569',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#ffffff' }}>{val}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Score Summary Box */}
        <View style={{ backgroundColor: '#0f172a', padding: 12, borderRadius: 12, marginTop: 8, marginBottom: 12 }}>
          <Text style={{ color: '#38bdf8', fontSize: 13, fontWeight: 'bold' }}>
            Overall Score: {currentScore.overallScore.toFixed(1)} / 5.0 ({currentScore.percentage}%)
          </Text>
          <Text style={{ color: eligibility.isEligible ? '#34d399' : '#f87171', fontSize: 11, fontWeight: 'bold', marginTop: 4 }}>
            {eligibility.isEligible ? '✓ Eligible for Accessibility Badge' : '✕ Ineligible'}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleAward}
          disabled={loading}
          style={{
            backgroundColor: highContrast ? '#ffff00' : '#0d9488',
            paddingVertical: 12,
            borderRadius: 12,
            alignItems: 'center',
          }}
        >
          {loading ? (
            <ActivityIndicator color={highContrast ? '#000000' : '#ffffff'} />
          ) : (
            <Text style={{ color: highContrast ? '#000000' : '#ffffff', fontWeight: 'bold', fontSize: 13 }}>
              🏅 Award Accessibility Badge (AC-89)
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Badges List (AC-90) */}
      <Text style={{ fontSize: 14, fontWeight: 'bold', color: highContrast ? '#ffff00' : '#ffffff', marginBottom: 8 }}>
        Awarded & Evaluated Badges ({badges.length})
      </Text>

      {badges.map((b) => (
        <View
          key={b.id}
          style={{
            backgroundColor: highContrast ? '#111111' : '#1e293b',
            padding: 12,
            borderRadius: 12,
            marginBottom: 8,
            borderLeftWidth: 4,
            borderLeftColor: b.status === 'awarded' ? '#10b981' : '#f43f5e',
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#ffffff' }}>♿ {b.badgeType}</Text>
            <Text style={{ fontSize: 10, fontWeight: 'bold', color: b.status === 'awarded' ? '#34d399' : '#f87171' }}>
              {b.status.toUpperCase()}
            </Text>
          </View>

          <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
            Entity: {b.entityName} • Score: {b.score.toFixed(1)}/5.0
          </Text>

          {!!b.reason && (
            <Text style={{ fontSize: 10, color: '#cbd5e1', marginTop: 4 }}>
              {b.reason}
            </Text>
          )}
        </View>
      ))}
    </ScrollView>
  );
};

