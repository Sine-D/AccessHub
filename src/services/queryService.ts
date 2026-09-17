import { isSearchQuery, validateInput } from '../core/search/contracts.ts';
import type { SearchResponse } from '../core/search/contracts.ts';
import { parseKeywords } from '../core/search/parser.ts';
import { supabase, isSupabaseConfigured } from '../core/supabase';
export async function interpretQuery(text:string,locale:string,signal?:AbortSignal):Promise<SearchResponse> {
 const input=validateInput({text,locale});
 const base=import.meta.env.VITE_SEARCH_API_URL?.replace(/\/$/,'');
 if(base) {
  const controller=new AbortController();
  const abort=()=>controller.abort();
  signal?.addEventListener('abort',abort,{once:true});
  if(signal?.aborted) controller.abort();
  const timeout=setTimeout(abort,12000);
  try {
   const token=isSupabaseConfigured ? (await supabase.auth.getSession()).data.session?.access_token : undefined;
   const r=await fetch(base+'/api/interpret',{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(input),signal:controller.signal});
   if(!r.ok) throw new Error('Search unavailable');
   const body=await r.json();
   if(!isSearchQuery(body.query) || !['keyword','openai'].includes(body.source)) throw new Error('Invalid response');
   return body;
  } catch(e) {if(signal?.aborted) throw e;} finally{clearTimeout(timeout);signal?.removeEventListener('abort',abort);}
 }
 return {query:parseKeywords(input.text,input.locale),source:'keyword'};
}

