import { mockMapPins } from '../../mock/data';
import type { PlaceDetails } from '../../features/map/types/placeDetails';

const descriptions: Record<string, string> = {
  mp1: 'An inclusive craft studio with an accessible entrance and customer service area.',
  mp2: 'A community support centre offering disability services and accessible information.',
  mp3: 'An inclusive technology workplace with step-free circulation and lift access.',
};

const verification: Record<string, PlaceDetails['verification']> = {
  mp1: { status: 'verified', rating: 4.8, reviewCount: 24, badge: 'Community verified', lastVerifiedAt: '2026-09-18T09:30:00.000Z' },
  mp2: { status: 'verified', rating: 4.6, reviewCount: 17, badge: 'Recently reviewed', lastVerifiedAt: '2026-09-12T06:00:00.000Z' },
  mp3: null,
};

export async function getMobilePlaceDetails(placeId: string, signal?: AbortSignal): Promise<PlaceDetails> {
  const apiBase = process.env.EXPO_PUBLIC_ACCESSIBLE_PLACES_API_URL?.replace(/\/$/, '');
  if (apiBase) {
    const response = await fetch(`${apiBase}/api/places/${encodeURIComponent(placeId)}`, {
      headers: { Accept: 'application/json' },
      signal,
    });
    if (!response.ok) throw new Error('Place details could not be loaded.');
    return response.json() as Promise<PlaceDetails>;
  }

  const place = mockMapPins.find((item) => item.id === placeId);
  if (!place) throw new Error('Place not found.');
  return {
    ...place,
    accessibilityFeatures: [...place.accessibilityFeatures],
    description: descriptions[place.id] ?? 'No additional description is available.',
    contactPhone: null,
    website: null,
    openingHours: [],
    verification: verification[place.id] ?? null,
  };
}
