# AC-157 — Local API
Requires Node 22.18+ (built-in TypeScript stripping). Run from project root:
`node --env-file=server/.env server/index.mjs`
No npm package required. GET /health; POST /api/interpret accepts only {text, locale}.
This foundation returns 503 until AC-161 wires the interpreter. No paid calls are made.
API binds to loopback by default. Production hosting requires TLS and a trusted proxy;
do not expose this local development server directly to the internet.

