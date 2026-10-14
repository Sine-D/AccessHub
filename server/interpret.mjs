import { parseKeywords } from '../src/core/search/parser.ts';
import { interpretOpenAI } from './openai.mjs';
import { interpretGemini } from './gemini.mjs';
import { createLimiter } from './security.mjs';
const userLimit=createLimiter(10);
let day='',used=0;
export async function interpret(input,{userId,clientId}={}) {
 const current=new Date().toISOString().slice(0,10);
 if(day!==current){day=current;used=0;}
 const allowDemoAI=process.env.ALLOW_UNAUTHENTICATED_AI==='true';
 const requester=userId || (allowDemoAI ? `demo:${clientId || 'local'}` : null);
 if(process.env.ENABLE_GEMINI==='true' && process.env.GEMINI_API_KEY && process.env.GEMINI_MODEL && requester && used<100 && userLimit(requester)) {
  used++;
  try{return {query:await interpretGemini(input),source:'gemini'};}catch(error){
   if(process.env.AI_DEBUG==='true') console.warn('[AI] Gemini fallback:',error instanceof Error ? error.message : String(error));
   /* Fall back without leaking provider errors to the client. */
  }
 }
 if(process.env.ENABLE_OPENAI==='true' && process.env.OPENAI_API_KEY && process.env.OPENAI_MODEL && requester && used<100 && userLimit(requester)) {
  used++;
  try{return {query:await interpretOpenAI(input),source:'openai'};}catch(error){
   if(process.env.AI_DEBUG==='true') console.warn('[AI] OpenAI fallback:',error instanceof Error ? error.message : String(error));
   /* Fall back without leaking provider errors to the client. */
  }
 }
 return {query:parseKeywords(input.text,input.locale),source:'keyword'};
}

