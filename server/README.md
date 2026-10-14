# AC-157 — Local API
Run from the project root with the repository's TypeScript loader (supports the project's Node 20 setup):
`npm run server`
Copy `server/.env.example` to `server/.env`, set `ENABLE_GEMINI=true`, and add a Gemini API key from Google AI Studio. For a local demo without real login sessions, set `ALLOW_UNAUTHENTICATED_AI=true`; keep it `false` in production. The configured model may have usage limits. Do not submit sensitive information.

Set `AI_DEBUG=true` only during local development to print the provider status when Gemini or OpenAI falls back to keyword search. Provider errors are not returned to the browser.

Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` from the Supabase project so authenticated requests can use Gemini. Without an enabled provider, a valid session, or the explicit demo flag, searches use the local keyword interpreter. GET /health; POST /api/interpret accepts only {text, locale}.
API binds to loopback by default. Production hosting requires TLS and a trusted proxy;
do not expose this local development server directly to the internet.

