import React from 'react';
import {useAppState} from '../../../core/hooks/useAppState';
import {TopHeader} from '../../../core/navigation/TopHeader';
import {BottomNav} from '../../../core/navigation/BottomNav';
export function CartScreen(){
 const {cart,removeFromCart,setActiveScreen}=useAppState();
 const total=cart.reduce((n,item)=>n+item.product.price*item.quantity,0);
 return <div className="h-full overflow-auto bg-white p-4 text-slate-900 dark:bg-slate-900 dark:text-white">
 <TopHeader title="Your cart"/><h1 tabIndex={-1} className="text-xl font-bold">Your cart</h1>
 <p role="status">{cart.length?cart.length+' products in your cart':'Your cart is empty.'}</p>
 <ul>{cart.map(item=><li key={item.product.id} className="my-2 rounded-xl border p-3"><h2>{item.product.title}</h2><p>Quantity: {item.quantity} · LKR {(item.product.price*item.quantity).toLocaleString()}</p>
 <button className="min-h-11 underline" onClick={()=>removeFromCart(item.product.id)}>Remove {item.product.title}</button></li>)}</ul>
 <p>Total: LKR {total.toLocaleString()}</p>
 <button className="min-h-11 underline" onClick={()=>setActiveScreen('marketplace')}>Continue shopping</button><BottomNav/></div>;
}

