# AC-160 — Credentials and submitted data
Copy server/.env.example to server/.env. Leave ENABLE_OPENAI=false for no-cost keyword mode.
Never prefix OPENAI_API_KEY with VITE_ or EXPO_PUBLIC_. Do not put server/.env in public/.
Only text (1–500 characters) and locale are accepted. Profile/GPS/audio/history fields are rejected.
Only an authenticated Supabase user may trigger a paid provider call; local keyword fallback requires no account.
Provider input is only the submitted query and locale; store:false; no raw-query server logs.
Per-IP limit: 30 requests/minute. Per-user AI limit: 10/minute; per-process AI cap: 100/day.
One-process limits are for the classroom deployment. Distributed deployment needs shared limits.
No keys or production data are included in these packs. No API billing was enabled.
For live AI: team supplies server-side credentials and a structured-output capable model, then explicitly enables it.

