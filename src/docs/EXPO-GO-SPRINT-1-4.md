# Expo Go — Sprint 1 to Sprint 4 integration

`index.js` continues to load the React Native `AppMobile` entry point. Existing mobile onboarding, authentication, marketplace, services, jobs, checkout, reviews, profiles and admin workflows are preserved.

Barana's Sprint 1–4 mobile additions:

- AI Voice Hub includes English, Sinhala and Tamil language controls, an editable transcript, live Web Speech capture on Expo web, and an Expo Go keyboard-dictation fallback.
- Voice/typed queries use the same validated natural-language contract and keyword fallback as the Vite app.
- Product and job results show the interpreted filters without re-entry.
- Place queries route to the accessible directory and apply location/feature filters.
- Expo Go uses `react-native-maps` markers and `expo-location`; Expo web shows the synchronized accessible list with a Google Maps link.
- Map cards open a native accessible place-details modal.
- Details show readable accessibility feature labels, directions guidance, rating, badge and last-verified date.
- Missing community verification remains clearly unavailable and never appears verified.
- Supabase/public API data is used when configured; safe mock records keep the classroom demo usable offline.
- Existing mobile onboarding, marketplace, services, jobs, checkout, reviews, profiles and admin code is unchanged apart from the two integration points in `AppMobile.tsx`.

## One-time local environment setup

Copy `.env.example` to `.env.local` and put the existing values in both the Vite and Expo names:

```env
VITE_SUPABASE_URL=YOUR_URL
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
EXPO_PUBLIC_SUPABASE_URL=YOUR_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

The optional AI/place API must use the Mac's Wi-Fi IP on a physical phone, not `localhost`. For example:

```env
EXPO_PUBLIC_SEARCH_API_URL=http://192.168.1.100:8787
EXPO_PUBLIC_ACCESSIBLE_PLACES_API_URL=http://192.168.1.100:8787
```

Run the server with `HOST=0.0.0.0` only on a trusted local network. API secrets remain in `server/.env` and must never use an `EXPO_PUBLIC_` prefix.

Run in Expo Go:

1. Install once with `npm install`.
2. Start with `npx expo start --clear`.
3. Scan the QR code using Expo Go on the same network.
4. Open AI Voice Hub. On Expo Go, tap **Speak**, then tap the phone keyboard microphone; on Expo web use the green in-app mic button.
5. Search `show home goods under 7000` and check the result filters.
6. Search `wheelchair ramp places in Colombo`; confirm one synchronized marker/list result.
7. Tap **Use my location**, allow foreground permission, and confirm the map recentres.
8. Open a place, check feature labels and community verification, then close it.

The Vite web build remains available separately with `npm run dev` on port 3000.
