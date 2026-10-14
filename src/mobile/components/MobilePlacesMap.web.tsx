import React, { useEffect, useMemo, useState } from 'react';
import { APIProvider, Map as GoogleMap, Marker, useMap } from '@vis.gl/react-google-maps';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

function FitPlaces({ places }: { places: MapPin[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map || places.length === 0) return;
    if (places.length === 1) {
      map.panTo({ lat: places[0].lat, lng: places[0].lng });
      map.setZoom(14);
      return;
    }
    const bounds = new google.maps.LatLngBounds();
    places.forEach((place) => bounds.extend({ lat: place.lat, lng: place.lng }));
    map.fitBounds(bounds, 54);
  }, [map, places]);

  return null;
}

export function MobilePlacesMap({
  onLocationChange,
  onSelectPlace,
  places,
  selectedPlaceId,
  theme,
}: Props) {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() || '';
  const [userCoordinate, setUserCoordinate] = useState<Coordinate | null>(null);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const center = useMemo(() => {
    const selected = places.find((place) => place.id === selectedPlaceId) ?? places[0];
    return selected ? { lat: selected.lat, lng: selected.lng } : { lat: defaultCoordinate.latitude, lng: defaultCoordinate.longitude };
  }, [places, selectedPlaceId]);

  const moveToCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationMessage('Current location is unavailable in this browser.');
      return;
    }
    setLocating(true);
    setLocationMessage(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coordinate = { latitude: position.coords.latitude, longitude: position.coords.longitude };
        setUserCoordinate(coordinate);
        onLocationChange?.(coordinate);
        setLocationMessage('Map centred on your current location.');
        setLocating(false);
      },
      () => {
        setLocationMessage('Current location could not be loaded. Check browser permissions and try again.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  if (!apiKey) {
    return (
      <View style={[styles.notice, { backgroundColor: theme.card, borderColor: '#f59e0b' }]}>
        <Text style={[styles.title, { color: theme.text }]}>Google Maps key is missing</Text>
        <Text style={{ color: theme.subText, textAlign: 'center' }}>
          Add EXPO_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local and restart Expo.
        </Text>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.mapFrame} accessibilityLabel={`Map showing ${places.length} accessible places`}>
        <APIProvider apiKey={apiKey}>
          <GoogleMap
            defaultCenter={center}
            defaultZoom={11}
            disableDefaultUI
            gestureHandling="cooperative"
            reuseMaps
            style={{ width: '100%', height: '100%' }}
            zoomControl
          >
            <FitPlaces places={places} />
            {places.map((place) => (
              <Marker
                key={place.id}
                position={{ lat: place.lat, lng: place.lng }}
                title={`${place.title} — ${place.address}`}
                onClick={() => onSelectPlace(place)}
                opacity={place.id === selectedPlaceId ? 1 : 0.86}
              />
            ))}
            {userCoordinate && (
              <Marker
                position={{ lat: userCoordinate.latitude, lng: userCoordinate.longitude }}
                title="Your location"
              />
            )}
          </GoogleMap>
        </APIProvider>
      </View>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Use my current location"
        onPress={moveToCurrentLocation}
        style={[styles.locationButton, { backgroundColor: theme.card, borderColor: theme.accent }]}
      >
        {locating
          ? <ActivityIndicator color={theme.accent} />
          : <Text style={{ color: theme.accent, fontWeight: '900' }}>◎ My location</Text>}
      </TouchableOpacity>
      {!!locationMessage && (
        <Text accessibilityLiveRegion="polite" style={{ color: theme.subText, marginTop: 7, textAlign: 'center' }}>
          {locationMessage}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mapFrame: { height: 360, borderRadius: 18, overflow: 'hidden', marginBottom: 9 },
  locationButton: { minHeight: 46, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderRadius: 13 },
  notice: { minHeight: 210, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderRadius: 18, padding: 18, marginBottom: 12 },
  title: { fontSize: 17, fontWeight: '900', marginBottom: 6 },
});
