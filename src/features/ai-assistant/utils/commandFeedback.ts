export function commandHaptic(success:boolean):boolean {
 try {return typeof navigator!=='undefined' && typeof navigator.vibrate==='function' ? navigator.vibrate(success?40:[30,40,30]) : false;}catch{return false;}
}

