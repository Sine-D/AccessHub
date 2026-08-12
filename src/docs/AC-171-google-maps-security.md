# AC-171 Google Maps API-Key Security

The Google Maps key must be stored in `.env.local`.

The key must have:

- Website HTTP-referrer restrictions
- `http://localhost:3000/*` for development
- Production-domain restriction before deployment
- Maps JavaScript API restriction

The real API key must never be committed to GitHub.