import type {VoiceIntent} from './voiceIntent.ts';
export interface IntentEvent {intent:VoiceIntent;success:boolean;time:string;}
export const ANALYTICS_KEY='accesshub_voice_intents_v1';
export function recordIntent(intent:VoiceIntent,success:boolean,storage:Pick<Storage,'getItem'|'setItem'>=sessionStorage):void {
 try{
 const previous:unknown=JSON.parse(storage.getItem(ANALYTICS_KEY)||'[]');
 const safe=Array.isArray(previous)?previous.filter(e=>e&&typeof e.intent==='string'&&typeof e.success==='boolean'&&typeof e.time==='string').map(e=>({intent:e.intent,success:e.success,time:e.time})):[];
 const event:IntentEvent={intent,success,time:new Date().toISOString()};
 storage.setItem(ANALYTICS_KEY,JSON.stringify([...safe.slice(-99),event]));
 }catch{/* Storage may be blocked; command execution must still work. */}
}

