import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, findNodeHandle, Image, Linking, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { MapPin } from '../../core/types';
import type { PlaceDetails } from '../../features/map/types/placeDetails';
import { presentPlaceFeature } from '../../features/map/utils/placeFeaturePresentation';
import { formatVerifiedDate, verificationStatusLabel } from '../../features/map/utils/verificationPresentation';
import { getMobilePlaceDetails } from '../services/mobilePlacesService';

interface Props {
  onClose: () => void;
  place: MapPin | null;
  theme: { background: string; card: string; text: string; subText: string; accent: string };
}

export function MobilePlaceDetailsModal({ onClose, place, theme }: Props) {
  const [details, setDetails] = useState<PlaceDetails | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const headingRef = useRef<Text>(null);

  useEffect(() => {
    if (!place) return;
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setDetails(null);
    getMobilePlaceDetails(place.id, controller.signal)
      .then(setDetails)
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Place details could not be loaded.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [place, reloadKey]);

  if (!place) return null;
  const verification = details?.verification ?? null;
  const verificationMissing = !verification || verification.status === 'unavailable';

  const announceHeading = () => {
    const handle = findNodeHandle(headingRef.current);
    if (handle) AccessibilityInfo.setAccessibilityFocus(handle);
  };

  const openDirections = () => Linking.openURL(
    `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${place.lat},${place.lng}`)}`,
  );

  return (
    <Modal visible animationType="slide" onShow={announceHeading} onRequestClose={onClose} presentationStyle="pageSheet">
      <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={styles.content} accessibilityViewIsModal>
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.eyebrow, { color: theme.accent }]}>ACCESSIBLE PLACE DETAILS</Text>
            <Text ref={headingRef} accessibilityRole="header" style={[styles.title, { color: theme.text }]}>{place.title}</Text>
          </View>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Close details for ${place.title}`} onPress={onClose} style={styles.closeButton}>
            <Text style={{ color: theme.text, fontWeight: '900' }}>Close</Text>
          </TouchableOpacity>
        </View>

        <Image source={{ uri: place.image }} style={styles.hero} accessibilityIgnoresInvertColors />
        {loading && <View accessibilityLiveRegion="polite" style={styles.notice}><ActivityIndicator color={theme.accent} /><Text style={{ color: theme.text }}>Loading place details…</Text></View>}
        {!!error && <View accessibilityLiveRegion="assertive" style={[styles.notice, { borderColor: '#ef4444' }]}><Text style={{ color: '#fecaca' }}>{error}</Text><TouchableOpacity accessibilityRole="button" onPress={() => setReloadKey((value) => value + 1)} style={styles.retry}><Text style={{ color: '#fff', fontWeight: '900' }}>Try again</Text></TouchableOpacity></View>}

        {!!details && <Text style={[styles.body, { color: theme.text }]}>{details.description}</Text>}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Visit information</Text>
          <Text style={{ color: theme.subText }}>Address: {place.address}</Text>
          <Text style={{ color: theme.subText }}>Type: {place.type}</Text>
          <Text style={{ color: theme.subText }}>Distance: {place.distance}</Text>
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]} accessibilityLabel="Accessibility features">
          <Text accessibilityRole="header" style={[styles.sectionTitle, { color: theme.text }]}>Accessibility features</Text>
          {place.accessibilityFeatures.map((feature) => {
            const item = presentPlaceFeature(feature);
            return <View key={item.id} style={styles.feature}><Text style={{ color: theme.accent, fontWeight: '900' }}>✓ {item.label}</Text><Text style={{ color: theme.subText }}>{item.description}</Text></View>;
          })}
        </View>

        <TouchableOpacity accessibilityRole="link" accessibilityHint="Opens Google Maps. Confirm route accessibility before travelling." onPress={openDirections} style={[styles.directions, { backgroundColor: theme.accent }]}>
          <Text style={styles.directionsText}>Get accessible directions</Text>
        </TouchableOpacity>
        <Text style={{ color: theme.subText, marginTop: 6 }}>Confirm that the suggested route meets your accessibility needs before travelling.</Text>

        {!loading && !error && (
          <View style={[styles.section, { backgroundColor: theme.card }]} accessibilityLabel="Community verification">
            <Text accessibilityRole="header" style={[styles.sectionTitle, { color: theme.text }]}>Community verification</Text>
            <Text style={{ color: verificationMissing ? '#fbbf24' : '#34d399', fontWeight: '900' }}>{verificationStatusLabel(verification)}</Text>
            {verificationMissing ? (
              <Text style={{ color: theme.subText, marginTop: 6 }}>Use the published accessibility information and contact the venue before travelling.</Text>
            ) : (
              <View style={{ gap: 5, marginTop: 8 }}>
                <Text style={{ color: theme.text }}>Rating: {verification.rating === null ? 'Not yet rated' : `${verification.rating.toFixed(1)} out of 5 from ${verification.reviewCount} reviews`}</Text>
                <Text style={{ color: theme.text }}>Badge: {verification.badge || 'No badge awarded'}</Text>
                <Text style={{ color: theme.text }}>Last verified: {formatVerifiedDate(verification.lastVerifiedAt)}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 48 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  eyebrow: { fontSize: 11, fontWeight: '900' },
  title: { fontSize: 24, fontWeight: '900', marginTop: 4 },
  closeButton: { minHeight: 44, justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: '#64748b', paddingHorizontal: 14 },
  hero: { width: '100%', height: 210, borderRadius: 20, marginVertical: 16 },
  notice: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#475569', borderRadius: 14, padding: 12, marginBottom: 12 },
  retry: { minHeight: 44, justifyContent: 'center', borderRadius: 10, backgroundColor: '#dc2626', paddingHorizontal: 12 },
  body: { fontSize: 15, lineHeight: 22, marginBottom: 12 },
  section: { borderRadius: 18, padding: 14, marginTop: 12, borderWidth: 1, borderColor: '#334155' },
  sectionTitle: { fontSize: 16, fontWeight: '900', marginBottom: 8 },
  feature: { marginBottom: 10, gap: 2 },
  directions: { minHeight: 48, justifyContent: 'center', alignItems: 'center', borderRadius: 14, marginTop: 16 },
  directionsText: { color: '#0f172a', fontWeight: '900' },
});
