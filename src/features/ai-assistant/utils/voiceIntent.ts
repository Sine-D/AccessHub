export type VoiceIntent = 'open_cart'|'find_ramps'|'call_seller'|'confirm_call'|'cancel'|'marketplace'|'jobs'|'map'|'home'|'settings'|'clear_filters'|'category'|'unknown';
export interface VoiceCommand {intent:VoiceIntent;category?:string;}
export function parseVoiceIntent(raw:string):VoiceCommand {
 if(typeof raw!=='string'||raw.length>500)return {intent:'unknown'};
 const s=raw.normalize('NFKC').toLowerCase().replace(/[.!?]+$/u,'').trim().replace(/^please\s+/,'').replace(/\s+/g,' ');
 const rules:[VoiceIntent,RegExp][]=[
 ['open_cart',/^(?:open|show)(?: my| the)? (?:cart|basket)$|^කරත්තය විවෘත කරන්න$|^கூடையைத் திற$/u],
 ['find_ramps',/^(?:find|show)(?: me)? (?:ramps|wheelchair accessible places)$|^රෝද පුටු ප්‍රවේශ ස්ථාන පෙන්වන්න$/u],
 ['call_seller',/^(?:call|phone)(?: the)? seller$|^විකුණුම්කරු අමතන්න$|^விற்பனையாளரை அழை$/u],
 ['confirm_call',/^(?:confirm call|yes call)$/],['cancel',/^(?:cancel|cancel call|no)$/],
 ['marketplace',/^open (?:the )?marketplace$|^වෙළඳපොළ විවෘත කරන්න$|^சந்தையைத் திற$/u],
 ['jobs',/^(?:open|show) jobs$|^රැකියා පෙන්වන්න$|^வேலைகளைக் காட்டு$/u],
 ['map',/^open (?:the )?(?:map|places)$/],['home',/^(?:go|open)(?: to)? home$/],
 ['settings',/^open (?:accessibility|accessibility settings|settings)$/],
 ['clear_filters',/^clear (?:all |accessibility )?filters$/]
 ];
 const matching=rules.filter(([,re])=>re.test(s));
 if(matching.length===1)return {intent:matching[0][0]};
 const categories:Record<string,string>={'crafts':'Crafts & Decor','crafts and decor':'Crafts & Decor','home goods':'Home Goods','food':'Food & Organic','food and organic':'Food & Organic','apparel':'Apparel & Adaptive','adaptive clothing':'Apparel & Adaptive'};
 const m=s.match(/^(?:show|open|find) (.+?)(?: products)?$/);
 if(m && categories[m[1]])return {intent:'category',category:categories[m[1]]};
 return {intent:'unknown'};
}
export function validSellerPhone(value:unknown):string|null {
 if(typeof value!=='string')return null;
 const phone=value.replace(/[ ()-]/g,'');
 return /^\+?[0-9]{7,15}$/.test(phone)?phone:null;
}

