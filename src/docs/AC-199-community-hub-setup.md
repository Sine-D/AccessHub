# AC-199 — Community Hub verification retrieval

The AccessHub server retrieves verification data; the browser never calls Community Hub directly.

1. Set `COMMUNITY_HUB_BASE_URL` in the server environment.
2. If Community Hub requires authentication, set `COMMUNITY_HUB_API_KEY` as a server-only secret.
3. Start the AccessHub API and request `GET /api/places/{placeId}`.
4. Confirm the response contains `verification` matching contract version 1.

Safety behaviour:

- HTTPS is required, except for localhost development.
- Requests time out after six seconds.
- Wrong IDs, malformed payloads, HTTP errors and network failures use the saved directory summary.
- If neither Community Hub nor the directory has a summary, `verification` is `null`.
