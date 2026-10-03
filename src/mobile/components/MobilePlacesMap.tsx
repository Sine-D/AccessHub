import React, { useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { MapPin } from '../../core/types';

interface Props {
  onLocationChange?: (coordinate: Coordinate) => void;
  onSelectPlace: (place: MapPin) => void;
  places: MapPin[];
  selectedPlaceId?: string | null;
  theme: { card: string; text: string; subText: string; accent: string };
}

export type Coordinate = { latitude: number; longitude: number };

const defaultCoordinate: Coordinate = { latitude: 6.9271, longitude: 79.8612 };

export function MobilePlacesMap({ onLocationChange, onSelectPlace, places, selectedPlaceId, theme }: Props) {
  const mapRef = useRef<any>(null);
  const [userCoordinate, setUserCoordinate] = useState<Coordinate | null>(null);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [locationSettingsRequired, setLocationSettingsRequired] = useState(false);
  const [locating, setLocating] = useState(false);
  const center = useMemo<Coordinate>(() => {
    const selected = places.find((place) => place.id === selectedPlaceId);
    const place = selected ?? places[0];
    return place ? { latitude: place.lat, longitude: place.lng } : defaultCoordinate;
  }, [places, selectedPlaceId]);

  const moveToCurrentLocation = async () => {
    setLocationMessage(null);
    setLocationSettingsRequired(false);

    if (Platform.OS === 'web') {
      if (!navigator.geolocation) {
        setLocationMessage('Current location is unavailable in this browser.');
        return;
      }
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coordinate = { latitude: position.coords.latitude, longitude: position.coords.longitude };
          setUserCoordinate(coordinate);
          onLocationChange?.(coordinate);
          setLocationMessage('Map centred on your current location.');
          setLocating(false);
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            setLocationMessage('Location permission was denied. Allow location access in your browser settings, or search by address.');
          } else if (error.code === error.TIMEOUT) {
            setLocationMessage('Finding your location timed out. Check Location Services and try again.');
          } else {
            setLocationMessage('Your location is currently unavailable. Check Location Services and try again.');
          }
          setLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10_000 },
      );
      return;
    }

    setLocating(true);
    try {
      // Loaded only on native so Expo web remains independent of native modules.
      const Location = require('expo-location') as typeof import('expo-location');
      let permission = await Location.getForegroundPermissionsAsync();
      if (permission.status !== 'granted' && permission.canAskAgain) {
        permission = await Location.requestForegroundPermissionsAsync();
      }
      if (permission.status !== 'granted') {
        setLocationSettingsRequired(!permission.canAskAgain);
        setLocationMessage(
          permission.canAskAgain
            ? 'Location permission was not granted. Tap Use my location to try again.'
            : 'Location access is blocked. Open app settings and allow location access.',
        );
        return;
      }
      if (!(await Location.hasServicesEnabledAsync())) {
        setLocationMessage('Location Services are turned off. Enable them on your phone and try again.');
        return;
      }
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coordinate = { latitude: current.coords.latitude, longitude: current.coords.longitude };
      setUserCoordinate(coordinate);
      onLocationChange?.(coordinate);
      mapRef.current?.animateToRegion({ ...coordinate, latitudeDelta: 0.045, longitudeDelta: 0.045 }, 500);
      setLocationMessage('Map centred on your current location.');
      AccessibilityInfo.announceForAccessibility('Map centred on your current location.');
    } catch {
      setLocationMessage('Current location could not be loaded. Search by place or address instead.');
    } finally {
      setLocating(false);
    }
  };

  if (Platform.OS === 'web') {
    const focus = userCoordinate ?? center;
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${focus.latitude},${focus.longitude}`)}`;
    return (
      <View style={[styles.webMap, { backgroundColor: theme.card, borderColor: '#475569' }]} accessibilityLabel="Accessible places map preview">
        <Text style={styles.webIcon}>🗺️</Text>
        <Text style={[styles.webTitle, { color: theme.text }]}>Map and list are synchronized</Text>
        <Text style={{ color: theme.subText, textAlign: 'center' }}>{places.length} filtered {places.length === 1 ? 'place' : 'places'} shown in the list below.</Text>
        <View style={styles.webActions}>
          <TouchableOpacity accessibilityRole="button" onPress={moveToCurrentLocation} style={[styles.locationButton, { borderColor: theme.accent }]}>
            {locating ? <ActivityIndicator color={theme.accent} /> : <Text style={{ color: theme.accent, fontWeight: '900' }}>◎ My location</Text>}
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="link" onPress={() => Linking.openURL(mapUrl)} style={[styles.openButton, { backgroundColor: theme.accent }]}>
            <Text style={{ color: '#0f172a', fontWeight: '900' }}>Open map</Text>
          </TouchableOpacity>
        </View>
        {!!locationMessage && <Text accessibilityLiveRegion="polite" style={{ color: theme.subText, textAlign: 'center', marginTop: 8 }}>{locationMessage}</Text>}
      </View>
    );
  }

  const maps = require('react-native-maps') as typeof import('react-native-maps');
  const MapView = maps.default;
  const Marker = maps.Marker;
  return (
    <View>
      <View style={styles.nativeMapFrame} accessible={false}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={{ ...center, latitudeDelta: 0.08, longitudeDelta: 0.08 }}
          showsUserLocation={Boolean(userCoordinate)}
          accessibilityLabel={`Map showing ${places.length} accessible places`}
        >
          {places.map((place) => (
            <Marker
              key={place.id}
              coordinate={{ latitude: place.lat, longitude: place.lng }}
              title={place.title}
              description={place.address}
              pinColor={place.id === selectedPlaceId ? '#f59e0b' : '#2563eb'}
              onPress={() => onSelectPlace(place)}
              accessibilityLabel={`${place.title}, ${place.address}. ${place.badge ?? 'Accessibility information available'}`}
            />
          ))}
        </MapView>
      </View>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Use my current location"
        accessibilityHint="Requests location permission and centres the map"
        onPress={moveToCurrentLocation}
        style={[styles.nativeLocationButton, { backgroundColor: theme.card, borderColor: theme.accent }]}
      >
        {locating ? <ActivityIndicator color={theme.accent} /> : <Text style={{ color: theme.accent, fontWeight: '900' }}>◎ Use my location</Text>}
      </TouchableOpacity>
      {!!locationMessage && <Text accessibilityLiveRegion="polite" style={{ color: theme.subText, marginTop: 7 }}>{locationMessage}</Text>}
      {locationSettingsRequired && (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Open app settings to allow location"
          onPress={() => void Linking.openSettings()}
          style={[styles.settingsButton, { borderColor: theme.accent }]}
        >
          <Text style={{ color: theme.accent, fontWeight: '900' }}>Open app settings</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  nativeMapFrame: { height: 280, borderRadius: 18, overflow: 'hidden', marginBottom: 9 },
  nativeLocationButton: { minHeight: 46, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderRadius: 13 },
  settingsButton: { minHeight: 44, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderRadius: 13, marginTop: 8 },
  webMap: { minHeight: 210, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderRadius: 18, padding: 18, marginBottom: 12 },
  webIcon: { fontSize: 38 },
  webTitle: { fontSize: 17, fontWeight: '900', marginTop: 6, marginBottom: 5 },
  webActions: { flexDirection: 'row', gap: 9, marginTop: 14 },
  locationButton: { minHeight: 46, minWidth: 120, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 12 },
  openButton: { minHeight: 46, minWidth: 105, justifyContent: 'center', alignItems: 'center', borderRadius: 12, paddingHorizontal: 12 },
});
