import {useEffect,useRef,useState} from 'react';
import {useAppState} from '../../../core/hooks/useAppState';
import {emptyQuery} from '../../../core/search/contracts.ts';
import {validSellerPhone} from '../utils/voiceIntent.ts';
import type {VoiceCommand} from '../utils/voiceIntent.ts';
export function useVoiceActions(){
 const {setActiveScreen,activeScreen,selectedProduct,setSearchQuery,setMarketplaceCategory}=useAppState();
 const [pending,setPending]=useState<{phone:string;name:string;productId:string;until:number}|null>(null);
 const pendingRef=useRef(pending);pendingRef.current=pending;
 useEffect(()=>{setPending(null);},[activeScreen,selectedProduct?.id]);
 useEffect(()=>{if(!pending)return;const id=setTimeout(()=>setPending(null),Math.max(0,pending.until-Date.now()));return()=>clearTimeout(id);},[pending]);
 const run=(command:VoiceCommand):{message:string;success:boolean}=>{
 const go=(screen:Parameters<typeof setActiveScreen>[0],message:string)=>{setPending(null);setActiveScreen(screen);return {message,success:true};};
 if(command.intent==='cancel'){setPending(null);return {message:'Cancelled.',success:true};}
 if(command.intent==='confirm_call'){
  const p=pendingRef.current;setPending(null);
  if(!p || p.until<Date.now() || activeScreen!=='product_detail' || p.productId!==selectedProduct?.id)return {message:'No current seller call to confirm. Open a product and say Call Seller.',success:false};
  window.location.assign('tel:'+p.phone);
  return {message:'Opening your phone app for '+p.name+'.',success:true};
 }
 setPending(null);
 switch(command.intent){
 case 'open_cart':return go('cart','Your cart is open.');
 case 'find_ramps':setSearchQuery({...emptyQuery(),intent:'places',features:['wheelchair_ramp'],needsClarification:false,clarification:null});return go('map','Showing places with wheelchair ramps.');
 case 'clear_filters':setSearchQuery(null);setMarketplaceCategory('All');return go('map','Search and accessibility requirements cleared.');
 case 'call_seller':{
  if(activeScreen!=='product_detail'||!selectedProduct)return {message:'Open a product first to choose the seller.',success:false};
  const phone=validSellerPhone(selectedProduct.sellerPhone);
  if(!phone)return {message:'This seller has not provided a phone number. Use the product contact option.',success:false};
  setPending({phone,name:selectedProduct.sellerName,productId:selectedProduct.id,until:Date.now()+30000});
  return {message:'Call '+selectedProduct.sellerName+'? Say Confirm Call or Cancel within 30 seconds.',success:true};
 }
 case 'category':setMarketplaceCategory(command.category || 'All');return go('marketplace','Showing '+command.category+'.');
 case 'marketplace':return go('marketplace','Marketplace open.');
 case 'jobs':return go('jobs','Jobs open.');
 case 'map':return go('map','Places directory open.');
 case 'home':return go('home','Home open.');
 case 'settings':return go('a11y_settings','Accessibility settings open.');
 default:return {message:'Command not recognized. Try Open Cart, Find Ramps or Open Marketplace.',success:false};
 }
 };
 return {run,pending};
}

