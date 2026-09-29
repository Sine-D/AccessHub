const PLACE_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;

export function validatePlaceId(value) {
  if (!PLACE_ID.test(value)) {
    throw Object.assign(new Error('Invalid place ID.'), { status: 400 });
  }
  return value;
}

export async function queryPlaceDetails(placeId, fetcher = fetch) {
  const id = validatePlaceId(placeId);
  const base = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!base || !key) throw new Error('Database not configured.');

  const url = new URL('/rest/v1/accesshub_places', base);
  url.searchParams.set(
    'select',
    'id,title,type,lat,lng,address,badge,category,accessibility_features,accessibility_rating,image,description,contact_phone,website,opening_hours,community_rating,community_review_count,verification_badge,last_verified_at',
  );
  url.searchParams.set('id', `eq.${id}`);
  url.searchParams.set('published', 'eq.true');
  url.searchParams.set('limit', '1');

  const response = await fetcher(url, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error('Place details query failed.');
  const rows = await response.json();
  if (!Array.isArray(rows)) throw new Error('Invalid place details response.');
  if (rows.length === 0) {
    throw Object.assign(new Error('Place not found.'), { status: 404 });
  }

  const row = rows[0];
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    lat: row.lat,
    lng: row.lng,
    address: row.address,
    badge: row.badge,
    accessibilityFeatures: row.accessibility_features,
    accessibilityRating: row.accessibility_rating,
    distance: 'Distance not calculated',
    image: row.image,
    description: row.description || 'No additional description is available.',
    contactPhone: row.contact_phone || null,
    website: row.website || null,
    openingHours: Array.isArray(row.opening_hours) ? row.opening_hours : [],
    verification:
      row.community_rating === null && !row.verification_badge && !row.last_verified_at
        ? null
        : {
            status: row.last_verified_at ? 'verified' : 'unverified',
            rating: typeof row.community_rating === 'number' ? row.community_rating : null,
            reviewCount: Number(row.community_review_count || 0),
            badge: row.verification_badge || null,
            lastVerifiedAt: row.last_verified_at || null,
          },
  };
}

