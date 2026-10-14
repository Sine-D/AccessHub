# AC-157 — Local API
Requires Node 22.18+ (built-in TypeScript stripping). Run from project root:
`node --env-file=server/.env server/index.mjs`
Copy `server/.env.example` to `server/.env`, set `ENABLE_GEMINI=true`, and add a Gemini API key from Google AI Studio. The default `gemini-3.8-flash` model currently has a free tier with usage limits. Free-tier prompts may be used by Google to improve its products; do not submit sensitive information.

Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` from the Supabase project so authenticated requests can use Gemini. Without an enabled provider or valid session, searches use the local keyword interpreter. GET /health; POST /api/interpret accepts only {text, locale}.
API binds to loopback by default. Production hosting requires TLS and a trusted proxy;
do not expose this local development server directly to the internet.

