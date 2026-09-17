export const allowedOrigins = () => (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000').split(',').map(s=>s.trim());
export async function readBody(req) {
  let raw = ''; let bytes = 0;
  for await (const chunk of req) { bytes += chunk.length; if (bytes > 4096) throw Object.assign(new Error('Request too large.'),{status:413}); raw += chunk; }
  try { return JSON.parse(raw); } catch { throw Object.assign(new Error('Invalid JSON.'),{status:400}); }
}
export function createLimiter(limit = 30) {
  const buckets = new Map();
  return key => {
    const now = Date.now();
    for (const [k,b] of buckets) if (b.until <= now) buckets.delete(k);
    const b = buckets.get(key) || {until: now+60000, count:0};
    if (!buckets.has(key) && buckets.size >= 10000) return false;
    b.count++; buckets.set(key,b); return b.count <= limit;
  };
}
export async function authenticate(req) {
  const header = req.headers.authorization;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!header?.startsWith('Bearer ') || !url || !key) return null;
  try {
    const r = await fetch(new URL('/auth/v1/user',url), {headers:{apikey:key,Authorization:header},signal:AbortSignal.timeout(5000)});
    if (!r.ok) return null;
    const u = await r.json(); return typeof u.id === 'string' ? u.id : null;
  } catch {return null;}
}

