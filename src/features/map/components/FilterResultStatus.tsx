import React,{useEffect,useState} from 'react';
export function FilterResultStatus({count,loading,error}:{count:number;loading:boolean;error:string}) {
 const [message,setMessage]=useState('');
 useEffect(()=>{const id=setTimeout(()=>setMessage(error?'Place results unavailable.':loading?'Updating results…':count+' matching '+(count===1?'place':'places')+'.'),250);return()=>clearTimeout(id);},[count,loading,error]);
 return <p role="status" aria-live="polite" aria-atomic="true">{message}</p>;
}

