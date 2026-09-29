# Expo Go — Sprint 1 to Sprint 4 integration

`index.js` continues to load the React Native `AppMobile` entry point. Existing mobile onboarding, authentication, marketplace, services, jobs, checkout, reviews, profiles and admin workflows are preserved.

Sprint 4 mobile additions:

- Voice/typed queries use the shared natural-language parser.
- Product and job results show the interpreted filters without re-entry.
- Place queries route to the accessible directory and apply location/feature filters.
- Map cards open a native accessible place-details modal.
- Details show readable accessibility feature labels, directions guidance, rating, badge and last-verified date.
- Missing community verification remains clearly unavailable and never appears verified.
- Android Metro export and TypeScript checks validate the native dependency graph.

Run in Expo Go:

1. Start with `npm start`.
2. Scan the QR code using Expo Go on the same network.
3. Open AI Voice Hub and enter `show home goods under 7000`.
4. Enter `wheelchair ramp places in Colombo` and confirm the map filters.
5. Open a place, check feature labels and community verification, then close it.

The Vite web build remains available separately with `npm run dev` on port 3000.
