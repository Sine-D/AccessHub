import type { SearchQuery } from './contracts.ts';
const normalize=(v:string)=>v.normalize('NFKC').toLowerCase();
export function matchesSearch(record:{title:string;description?:string;address?:string;location?:string;category?:string;price?:number;accessibilityFeatures?:string[]}, query:SearchQuery) {
 if(query.needsClarification) return false;
 const haystack=normalize([record.title,record.description,record.address,record.location,record.category].filter(Boolean).join(' '));
 if(query.location && !haystack.includes(normalize(query.location))) return false;
 if(query.category && !haystack.includes(normalize(query.category).replace('cafe','café')) && !haystack.includes(normalize(query.category))) return false;
 if(query.minPrice!==null && (record.price===undefined || record.price<query.minPrice)) return false;
 if(query.maxPrice!==null && (record.price===undefined || record.price>query.maxPrice)) return false;
 return query.keywords.split(/\s+/).filter(Boolean).every(word=>haystack.includes(normalize(word)));
}

