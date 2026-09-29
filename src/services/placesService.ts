import { mockMapPins } from '../mock/data';
import { MapPin } from '../core/types/models';
import type { Feature } from '../core/search/contracts.ts';
import { filterPlaces } from '../features/map/utils/accessibilityFilters.ts';
import type { PlaceDetails } from '../features/map/types/placeDetails';

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
export const getAccessiblePlaces = async (signal?: AbortSignal, features: Feature[] = []): Promise<MapPin[]> => {
  if (!apiBaseUrl) {
    return filterPlaces(mockMapPins, features).map((place) => ({
      ...place,
      accessibilityFeatures: [...place.accessibilityFeatures],
    }));
  }

  const params = new URLSearchParams();
  features.forEach(feature => params.append('feature', feature));
  const response = await fetch(`${apiBaseUrl}/accessible-places?${params}`, {
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

  return filterPlaces(payload, features);
};

const isPlaceDetails = (value: unknown): value is PlaceDetails => {
  if (!isMapPin(value)) return false;
  const details = value as Partial<PlaceDetails>;
  return (
    typeof details.description === 'string' &&
    Array.isArray(details.openingHours) &&
    (details.contactPhone === null || typeof details.contactPhone === 'string') &&
    (details.website === null || typeof details.website === 'string')
  );
};

const mockDescriptions: Record<string, string> = {
  mp1: 'An inclusive craft studio with an accessible entrance and customer service area.',
  mp2: 'A community support centre offering disability services and accessible information.',
  mp3: 'An inclusive technology workplace with step-free circulation and lift access.',
};

export const getAccessiblePlaceDetails = async (
  placeId: string,
  signal?: AbortSignal,
): Promise<PlaceDetails> => {
  if (!apiBaseUrl) {
    const place = mockMapPins.find((item) => item.id === placeId);
    if (!place) throw new Error('Place not found.');
    return {
      ...place,
      accessibilityFeatures: [...place.accessibilityFeatures],
      description: mockDescriptions[place.id] || 'No additional description is available.',
      contactPhone: null,
      website: null,
      openingHours: [],
      verification: null,
    };
  }

  const response = await fetch(`${apiBaseUrl}/api/places/${encodeURIComponent(placeId)}`, {
    headers: { Accept: 'application/json' },
    signal,
  });
  if (response.status === 404) throw new Error('Place details are no longer available.');
  if (!response.ok) throw new Error('Place details could not be loaded.');
  const payload: unknown = await response.json();
  if (!isPlaceDetails(payload)) throw new Error('The place details response has an invalid format.');
  return payload;
};
