import { mockMapPins } from '../../mock/data';
import type { MapPin } from '../../core/types';
import type { PlaceDetails } from '../../features/map/types/placeDetails';
import { isCommunityVerificationSummary } from '../../features/map/types/placeDetails';
import { isSupabaseConfigured, supabase } from '../../core/supabase';

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

const apiBase = () => process.env.EXPO_PUBLIC_ACCESSIBLE_PLACES_API_URL?.trim().replace(/\/$/, '');

const toMapPin = (row: Record<string, any>): MapPin => ({
  id: String(row.id),
  title: String(row.title),
  type: row.type as MapPin['type'],
  lat: Number(row.lat),
  lng: Number(row.lng),
  address: String(row.address),
  badge: row.badge ? String(row.badge) : undefined,
  accessibilityFeatures: Array.isArray(row.accessibility_features)
    ? row.accessibility_features.map(String)
    : Array.isArray(row.accessibilityFeatures)
      ? row.accessibilityFeatures.map(String)
      : [],
  accessibilityRating: Number(row.accessibility_rating ?? row.accessibilityRating ?? 0),
  distance: String(row.distance ?? 'Distance not calculated'),
  image: String(row.image ?? ''),
});

export async function listMobilePlaces(signal?: AbortSignal): Promise<MapPin[]> {
  const base = apiBase();
  if (base) {
    try {
      const response = await fetch(`${base}/accessible-places`, { headers: { Accept: 'application/json' }, signal });
      if (!response.ok) throw new Error('The accessible places directory could not be loaded.');
      const body = await response.json();
      if (!Array.isArray(body)) throw new Error('The places service returned invalid data.');
      return body.map(toMapPin);
    } catch (error) {
      if (signal?.aborted) throw error;
      // A local development API may be offline or unreachable from the phone.
      // Continue to Supabase or the bundled directory instead of blanking the map.
    }
  }

  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('accesshub_places')
      .select('id,title,type,lat,lng,address,badge,accessibility_features,accessibility_rating,image')
      .eq('published', true)
      .order('id');
    if (!error && data?.length) return data.map(toMapPin);
  }

  return mockMapPins.map((place) => ({ ...place, accessibilityFeatures: [...place.accessibilityFeatures] }));
}

export async function getMobilePlaceDetails(placeId: string, signal?: AbortSignal): Promise<PlaceDetails> {
  const base = apiBase();
  if (base) {
    try {
      const response = await fetch(`${base}/api/places/${encodeURIComponent(placeId)}`, {
        headers: { Accept: 'application/json' },
        signal,
      });
      if (!response.ok) throw new Error('Place details could not be loaded.');
      return response.json() as Promise<PlaceDetails>;
    } catch (error) {
      if (signal?.aborted) throw error;
      // Fall through to Supabase or bundled place details when the local API
      // cannot be reached from a physical device.
    }
  }

  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('accesshub_places')
      .select('id,title,type,lat,lng,address,badge,accessibility_features,accessibility_rating,image,description,contact_phone,website,opening_hours,community_rating,community_review_count,verification_badge,last_verified_at')
      .eq('id', placeId)
      .eq('published', true)
      .maybeSingle();
    if (!error && data) {
      const pin = toMapPin(data);
      const candidateVerification = data.community_rating === null && !data.verification_badge && !data.last_verified_at
        ? null
        : {
            status: data.last_verified_at ? 'verified' : 'unverified',
            rating: typeof data.community_rating === 'number' ? data.community_rating : null,
            reviewCount: Number(data.community_review_count ?? 0),
            badge: data.verification_badge ? String(data.verification_badge) : null,
            lastVerifiedAt: data.last_verified_at ? String(data.last_verified_at) : null,
          };
      return {
        ...pin,
        description: String(data.description ?? 'No additional description is available.'),
        contactPhone: data.contact_phone ? String(data.contact_phone) : null,
        website: data.website ? String(data.website) : null,
        openingHours: Array.isArray(data.opening_hours) ? data.opening_hours.map(String) : [],
        verification: candidateVerification && isCommunityVerificationSummary(candidateVerification)
          ? candidateVerification
          : null,
      };
    }
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
