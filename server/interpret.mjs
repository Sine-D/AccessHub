import { parseKeywords } from '../src/core/search/parser.ts';
import { interpretOpenAI } from './openai.mjs';
import { createLimiter } from './security.mjs';
const userLimit=createLimiter(10);
let day='',used=0;
export async function interpret(input,{userId}={}) {
 const current=new Date().toISOString().slice(0,10);
 if(day!==current){day=current;used=0;}
 if(process.env.ENABLE_OPENAI==='true' && process.env.OPENAI_API_KEY && process.env.OPENAI_MODEL && userId && used<100 && userLimit(userId)) {
  used++;
  try{return {query:await interpretOpenAI(input),source:'openai'};}catch{/* Fall back without leaking provider errors. */}
 }
 return {query:parseKeywords(input.text,input.locale),source:'keyword'};
}

