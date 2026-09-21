import {useEffect} from 'react';
import {useAppState} from '../hooks/useAppState';
export function RouteFocus(){
 const {activeScreen}=useAppState();
 useEffect(()=>{const id=requestAnimationFrame(()=>{
 const screen=document.getElementById('application-screen');
 const heading=screen?.querySelector<HTMLElement>('h1,h2') || screen;
 if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}
 });return()=>cancelAnimationFrame(id);},[activeScreen]);
 return null;
}

