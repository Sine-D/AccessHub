import { mockMapPins } from './mockData';
import { MapPin } from '../types/models';

const apiBaseUrl = import.meta.env.VITE_ACCESSIBLE_PLACES_API_URL?.replace(/\/$/, '');

const isMapPin = (value: unknown): value is MapPin => {
  if (!value || typeof value !== 'object') return false;

  const place = value as Partial<MapPin>;
  return (
    typeof place.id === 'string' &&
    typeof place.title === 'string' &&
    typeof place.lat === 'number' &&
    typeof place.lng === 'number' &&
    typeof place.address === 'string' &&
    Array.isArray(place.accessibilityFeatures)
  );
};

/**
 * Retrieves the accessible-place directory from the configured backend.
 * The checked-in mock data keeps local development and classroom demos usable
 * until the shared backend URL is available.
 */
export const getAccessiblePlaces = async (signal?: AbortSignal): Promise<MapPin[]> => {
  if (!apiBaseUrl) {
    return mockMapPins.map((place) => ({
      ...place,
      accessibilityFeatures: [...place.accessibilityFeatures],
    }));
  }

  const response = await fetch(`${apiBaseUrl}/accessible-places`, {
    headers: { Accept: 'application/json' },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Accessible places request failed with status ${response.status}.`);
  }

  const payload: unknown = await response.json();
  if (!Array.isArray(payload) || !payload.every(isMapPin)) {
    throw new Error('The accessible places response has an invalid format.');
  }

  return payload;
};
