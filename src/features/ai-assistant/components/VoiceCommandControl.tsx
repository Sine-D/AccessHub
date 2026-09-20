import React,{useEffect,useRef,useState} from 'react';
import {useAccessibility} from '../../../core/hooks/useAccessibility';
import {useSpeechRecognition} from '../../../core/hooks/useSpeechRecognition';
import {parseVoiceIntent} from '../utils/voiceIntent.ts';
import {useVoiceActions} from '../hooks/useVoiceActions';
import {commandHaptic} from '../utils/commandFeedback.ts';
import {recordIntent} from '../utils/voiceAnalytics.ts';
import {SpeechLanguageSelector} from './SpeechLanguageSelector';
import {DEFAULT_SPEECH_LOCALE} from '../../../core/constants/speechLanguages';
import type {SpeechLocale} from '../../../core/constants/speechLanguages';
export function VoiceCommandControl(){
 const {run,pending}=useVoiceActions();
 const {aiModalOpen,settings,speakText}=useAccessibility();
 const [sequence,setSequence]=useState(0);
 const [language,setLanguage]=useState<SpeechLocale>(DEFAULT_SPEECH_LOCALE);
 const speech=useSpeechRecognition({language,fallbackLanguage:DEFAULT_SPEECH_LOCALE,onLanguageFallback:()=>setLanguage(DEFAULT_SPEECH_LOCALE)});
 const [expanded,setExpanded]=useState(false);
 const [message,setMessage]=useState('Say “Open Cart”, “Find Ramps” or “Call Seller”.');
 const armed=useRef(false);const wasListening=useRef(false);
 const submit=(text:string)=>{const command=parseVoiceIntent(text);const result=run(command);recordIntent(command.intent,result.success);setMessage(result.message);setSequence(n=>n+1);commandHaptic(result.success);if(settings.screenReader)speakText(result.message);};
 const submitRef=useRef(submit);submitRef.current=submit;
 useEffect(()=>{
  if(speech.isListening)wasListening.current=true;
  if(!speech.isListening && wasListening.current && armed.current){
   armed.current=false;wasListening.current=false;
   if(!speech.error && speech.transcript.trim())submitRef.current(speech.transcript);
  }
 },[speech.isListening,speech.transcript,speech.error]);
 useEffect(()=>{if(aiModalOpen){armed.current=false;speech.stopListening();}},[aiModalOpen,speech.stopListening]);
 if(aiModalOpen)return null;
 const start=()=>{speech.resetTranscript();armed.current=true;wasListening.current=false;speech.startListening();};
 return <aside aria-label="Voice quick commands" className="fixed bottom-3 right-3 z-40 max-w-[calc(100vw-24px)] rounded-2xl border bg-white p-3 text-slate-900 shadow-xl dark:bg-slate-900 dark:text-white">
 <button type="button" aria-expanded={expanded} className="min-h-11 rounded-lg bg-blue-600 px-3 text-white" onClick={()=>setExpanded(v=>!v)}>Voice commands</button>
 {expanded&&<div className="w-72 max-w-full space-y-2">
 <SpeechLanguageSelector value={language} onChange={setLanguage} disabled={speech.isListening}/>
 <button aria-pressed={speech.isListening} disabled={!speech.isSupported} className="min-h-11 rounded-lg border px-3" onClick={()=>speech.isListening?speech.stopListening():start()}>{speech.isListening?'Stop listening':'Start command microphone'}</button>
 <label className="block">Command<input className="block min-h-11 w-full rounded border p-2 text-slate-900" maxLength={500} value={speech.transcript} onChange={e=>speech.setTranscript(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!speech.isListening){e.preventDefault();submit(speech.transcript);}}}/></label>
 <button className="min-h-11 rounded-lg border px-3" disabled={!speech.transcript.trim()||speech.isListening} onClick={()=>submit(speech.transcript)}>Run command</button>
 {!speech.isSupported&&<p>Microphone recognition is unavailable. Type a command instead.</p>}
 {speech.error&&<p role="alert">{speech.error}</p>}
 <p role="status" aria-live="polite" aria-atomic="true">{message}<span className="sr-only"> Command response {sequence}.</span></p>
 {pending&&<div><button className="min-h-11 rounded border px-2" onClick={()=>submit('confirm call')}>Confirm call to {pending.name}</button><button className="min-h-11 rounded border px-2" onClick={()=>submit('cancel')}>Cancel</button></div>}
 </div>}
 </aside>;
}
