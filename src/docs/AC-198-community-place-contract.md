# AC-198 — Shared place-ID and Community Hub contract

Technical contract implemented in this branch:

- The canonical join key is the existing AccessHub directory string ID, named `placeId` in integration payloads and `id` in `accesshub_places`.
- IDs must match `^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$`; external Google place IDs are not used as the internal join key.
- Endpoint: `GET {COMMUNITY_HUB_BASE_URL}/api/places/{url-encoded-placeId}/verification-summary`.
- Payload version is `1` with: `placeId`, `status`, `rating`, `reviewCount`, `badge`, `lastVerifiedAt`.
- Ratings are null or 0–5; review count is a non-negative integer; dates are ISO-8601 strings.
- A mismatched place ID, invalid values or malformed JSON is treated as unavailable and never displayed as verified.
- The server sends an optional secret only from `COMMUNITY_HUB_API_KEY`; no integration key is exposed to the browser.

Coordination evidence still required: Avishka/team representative ___ confirmed contract version ___ on date ___ in ___.
