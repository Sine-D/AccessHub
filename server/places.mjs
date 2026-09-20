import {parseFeatureParams} from '../src/features/map/utils/accessibilityFilters.ts';
export async function queryPlaces(params,fetcher=fetch) {
 let features;try{features=parseFeatureParams(params);}catch{throw Object.assign(new Error('Invalid filters'),{status:400});}
 const base=process.env.SUPABASE_URL;const key=process.env.SUPABASE_ANON_KEY;
 if(!base || !key)throw new Error('Database not configured.');
 const url=new URL('/rest/v1/accesshub_places',base);
 url.searchParams.set('select','id,title,type,lat,lng,address,badge,category,accessibility_features,accessibility_rating,image');
 url.searchParams.set('published','eq.true');
 url.searchParams.set('order','id.asc');
 if(features.length)url.searchParams.set('accessibility_features','cs.{'+features.join(',')+'}');
 // Paginate so filtering and count never silently stop at the first database page.
 const records=[];const pageSize=500;
 for(let offset=0;;offset+=pageSize){
  url.searchParams.set('offset',String(offset));url.searchParams.set('limit',String(pageSize));
  const r=await fetcher(url,{headers:{apikey:key,Authorization:'Bearer '+key},signal:AbortSignal.timeout(8000)});
  if(!r.ok)throw new Error('Place query failed.');
  const rows=await r.json();if(!Array.isArray(rows))throw new Error('Invalid rows.');
  records.push(...rows);if(rows.length<pageSize)break;
  if(records.length>=10000)throw new Error('Directory requires paginated UI; refine the query.');
 }
 return records.map(r=>({id:r.id,title:r.title,type:r.type,lat:r.lat,lng:r.lng,address:r.address,badge:r.badge,category:r.category,accessibilityFeatures:r.accessibility_features,accessibilityRating:r.accessibility_rating,image:r.image,distance:'Distance not calculated'}));
}

