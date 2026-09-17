import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { validateInput } from '../src/core/search/contracts.ts';
import { allowedOrigins, readBody, createLimiter, authenticate } from './security.mjs';
import { interpret } from './interpret.mjs';
import { queryPlaces } from './places.mjs';
export function createApi({interpret = async () => {throw Object.assign(new Error('Interpreter unavailable.'),{status:503});}, places = null} = {}) {
 const limit = createLimiter();
 return createServer(async (req,res) => {
  const send=(status,body)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(body));};
  const origin=req.headers.origin;
  if (origin && !allowedOrigins().includes(origin)) return send(403,{error:'Origin not allowed.'});
  if(origin) {res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');}
  res.setHeader('Access-Control-Allow-Headers','Content-Type,Authorization');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
  if(req.method==='OPTIONS') {res.writeHead(204);res.end();return;}
  if(!limit(req.socket.remoteAddress || 'unknown')) return send(429,{error:'Too many requests. Try again shortly.'});
  const url=new URL(req.url || '/', 'http://localhost');
  try {
   if(req.method==='GET' && url.pathname==='/health') return send(200,{ok:true});
   if(req.method==='GET' && url.pathname==='/accessible-places' && places) return send(200,await places(url.searchParams));
   if(req.method!=='POST' || url.pathname!=='/api/interpret') return send(404,{error:'Not found.'});
   if(!req.headers['content-type']?.startsWith('application/json')) return send(415,{error:'Use application/json.'});
   let input; try {input=validateInput(await readBody(req));} catch(e) {return send(e.status || 400,{error:e.message});}
   const userId=await authenticate(req);
   // OpenAI processing requires a real validated Supabase session. Local keyword mode is public.
   return send(200,await interpret(input,{userId}));
  } catch(e) {send(e.status || 503,{error:'Service temporarily unavailable. Use keyword search.'});}
 });
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
 createApi({interpret,places:queryPlaces}).listen(Number(process.env.PORT || 8787), '127.0.0.1',()=>console.log('AccessHub API: http://127.0.0.1:8787'));
}
