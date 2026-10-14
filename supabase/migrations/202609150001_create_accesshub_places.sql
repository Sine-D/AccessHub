-- Create the public accessible-places directory before the later detail-field migrations run.
begin;

create table if not exists public.accesshub_places (
  id text primary key,
  title text not null,
  type text not null check (type in ('seller', 'ngo', 'company', 'delivery', 'service', 'event')),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  address text not null,
  badge text,
  category text,
  accessibility_features text[] not null default '{}',
  accessibility_rating double precision not null default 0
    check (accessibility_rating between 0 and 5),
  image text not null default '',
  published boolean not null default false,
  description text not null default '',
  contact_phone text,
  website text,
  opening_hours text[] not null default '{}',
  community_rating double precision
    constraint accesshub_places_community_rating_range
    check (community_rating is null or community_rating between 0 and 5),
  community_review_count integer not null default 0
    constraint accesshub_places_review_count_nonnegative
    check (community_review_count >= 0),
  verification_badge text,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists accesshub_places_published_idx
  on public.accesshub_places (published);

create index if not exists accesshub_places_accessibility_features_idx
  on public.accesshub_places using gin (accessibility_features);

alter table public.accesshub_places enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'accesshub_places'
      and policyname = 'Published places are publicly readable'
  ) then
    create policy "Published places are publicly readable"
      on public.accesshub_places
      for select
      to anon, authenticated
      using (published = true);
  end if;
end
$$;

grant select on public.accesshub_places to anon, authenticated;

insert into public.accesshub_places (
  id,
  title,
  type,
  lat,
  lng,
  address,
  badge,
  category,
  accessibility_features,
  accessibility_rating,
  image,
  published,
  description,
  community_rating,
  community_review_count,
  verification_badge,
  last_verified_at
)
values
  (
    'mp1',
    'Kavindi Crafts Studio',
    'seller',
    6.9066,
    79.8673,
    'No 45, Flower Road, Colombo 07',
    'Wheelchair Accessible Entrance & Ramp',
    'studio',
    array['wheelchair_ramp', 'step_free', 'accessible_parking'],
    4.8,
    'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=300',
    true,
    'An inclusive craft studio with an accessible entrance and customer service area.',
    4.8,
    24,
    'Community verified',
    '2026-09-18T09:30:00.000Z'
  ),
  (
    'mp2',
    'Enable Lanka Foundation Center',
    'ngo',
    6.8956,
    79.8538,
    'Galle Road, Colombo 03',
    'Sign Language Staff & Braille Docs',
    'community_center',
    array['sign_language', 'braille', 'accessible_restroom'],
    4.6,
    'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=300',
    true,
    'A community support centre offering disability services and accessible information.',
    4.6,
    17,
    'Recently reviewed',
    '2026-09-12T06:00:00.000Z'
  ),
  (
    'mp3',
    'Virtusa Inclusive Innovation Hub',
    'company',
    6.8883,
    79.8566,
    'Bambalapitiya, Colombo 04',
    '100% Barrier-Free Campus',
    'technology',
    array['step_free', 'elevator', 'tactile_paving'],
    4.9,
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=300',
    true,
    'An inclusive technology workplace with step-free circulation and lift access.',
    null,
    0,
    null,
    null
  ),
  (
    'mp4',
    'Access Garden Restaurant',
    'service',
    6.9147,
    79.8771,
    'Cotta Road, Colombo 08',
    'Wheelchair Ramp & Accessible Restroom',
    'restaurant',
    array['wheelchair_ramp', 'step_free', 'accessible_restroom'],
    4.7,
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=300',
    true,
    'An accessible restaurant with a wheelchair ramp, step-free entrance and accessible restroom.',
    4.7,
    12,
    'Community verified',
    '2026-10-01T08:00:00.000Z'
  ),
  (
    'mp5',
    'Kandy Lake Accessible Cafe - Demo',
    'service',
    7.2906,
    80.6337,
    'Lake Round, Kandy',
    'Wheelchair Ramp, Braille Menu & Accessible Restroom',
    'cafe',
    array['wheelchair_ramp', 'braille', 'accessible_restroom'],
    4.5,
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=300',
    true,
    'A demo cafe record for testing accessible-place search in Kandy.',
    4.5,
    9,
    'Demo community verified',
    '2026-10-03T07:30:00.000Z'
  ),
  (
    'mp6',
    'Galle Inclusive Care Hospital - Demo',
    'service',
    6.0329,
    80.2168,
    'Wakwella Road, Galle',
    'Wheelchair Ramp, Elevator & Accessible Parking',
    'hospital',
    array['wheelchair_ramp', 'elevator', 'accessible_parking', 'accessible_restroom'],
    4.8,
    'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=300',
    true,
    'A demo hospital record with multiple mobility-accessibility features.',
    4.8,
    31,
    'Demo accessibility verified',
    '2026-10-05T10:15:00.000Z'
  ),
  (
    'mp7',
    'Jaffna Accessible Learning Library - Demo',
    'ngo',
    9.6615,
    80.0255,
    'Hospital Road, Jaffna',
    'Braille, Tactile Paving & Elevator',
    'library',
    array['braille', 'tactile_paving', 'elevator', 'step_free'],
    4.4,
    'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&q=80&w=300',
    true,
    'A demo learning centre record for Braille and tactile-access search testing.',
    4.4,
    14,
    'Demo recently reviewed',
    '2026-09-27T05:45:00.000Z'
  ),
  (
    'mp8',
    'Colombo Silent Hands Restaurant - Demo',
    'service',
    6.9271,
    79.8612,
    'Union Place, Colombo 02',
    'Sign-Language Staff & High-Contrast Menu',
    'restaurant',
    array['sign_language', 'high_contrast', 'accessible_restroom', 'step_free'],
    4.6,
    'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=300',
    true,
    'A demo restaurant record for sign-language and visual-accessibility searches.',
    4.6,
    20,
    'Demo community verified',
    '2026-10-07T12:00:00.000Z'
  ),
  (
    'mp9',
    'Negombo Step-Free Beach Restaurant - Demo',
    'service',
    7.2083,
    79.8358,
    'Lewis Place, Negombo',
    'Step-Free Entrance, Ramp & Accessible Parking',
    'restaurant',
    array['wheelchair_ramp', 'step_free', 'accessible_parking'],
    4.3,
    'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&q=80&w=300',
    true,
    'A demo coastal restaurant record for mobility-access search testing.',
    4.3,
    11,
    'Demo recently reviewed',
    '2026-09-30T09:00:00.000Z'
  ),
  (
    'mp10',
    'Kurunegala Mobility Support Centre - Demo',
    'ngo',
    7.4863,
    80.3623,
    'Colombo Road, Kurunegala',
    'Step-Free Access & Sign-Language Support',
    'community_center',
    array['step_free', 'sign_language', 'accessible_parking', 'accessible_restroom'],
    4.7,
    'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&q=80&w=300',
    true,
    'A demo support-centre record for accessible community-service searches.',
    4.7,
    18,
    'Demo community verified',
    '2026-10-02T04:30:00.000Z'
  ),
  (
    'mp11',
    'Matara Accessible Family Hospital - Demo',
    'service',
    5.9549,
    80.5550,
    'Akuressa Road, Matara',
    'Ramp, Elevator, Accessible Restroom & Parking',
    'hospital',
    array['wheelchair_ramp', 'elevator', 'accessible_restroom', 'accessible_parking'],
    4.6,
    'https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&q=80&w=300',
    true,
    'A demo healthcare record for accessible hospital search testing in Matara.',
    4.6,
    22,
    'Demo accessibility verified',
    '2026-10-06T06:20:00.000Z'
  ),
  (
    'mp12',
    'Anuradhapura Tactile Garden Cafe - Demo',
    'service',
    8.3114,
    80.4037,
    'New Town, Anuradhapura',
    'Tactile Paving, Braille Menu & Step-Free Entrance',
    'cafe',
    array['tactile_paving', 'braille', 'step_free'],
    4.2,
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=300',
    true,
    'A demo cafe record for tactile, Braille and step-free search testing.',
    null,
    0,
    null,
    null
  )
on conflict (id) do update set
  title = excluded.title,
  type = excluded.type,
  lat = excluded.lat,
  lng = excluded.lng,
  address = excluded.address,
  badge = excluded.badge,
  category = excluded.category,
  accessibility_features = excluded.accessibility_features,
  accessibility_rating = excluded.accessibility_rating,
  image = excluded.image,
  published = excluded.published,
  description = excluded.description,
  community_rating = excluded.community_rating,
  community_review_count = excluded.community_review_count,
  verification_badge = excluded.verification_badge,
  last_verified_at = excluded.last_verified_at,
  updated_at = now();

commit;
