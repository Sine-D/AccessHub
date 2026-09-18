import React,{useEffect,useMemo,useState} from 'react';
import {useAppState} from '../../../core/hooks/useAppState';
import {TopHeader} from '../../../core/navigation/TopHeader';
import {BottomNav} from '../../../core/navigation/BottomNav';
import {mockProducts,mockJobs} from '../../../mock/data';
import {getAccessiblePlaces} from '../../../services/placesService';
import type {MapPin} from '../../../core/types/models';
import {matchesSearch} from '../../../core/search/matchSearch.ts';
import {matchesFeatures} from '../../../core/search/parser.ts';
export const SearchResultsScreen:React.FC=()=>{
 const {searchQuery,setActiveScreen,setSelectedProduct}=useAppState();
 const [places,setPlaces]=useState<MapPin[]>([]);
 const [loading,setLoading]=useState(false);const [error,setError]=useState('');
 useEffect(()=>{if(searchQuery?.intent!=='places')return; const c=new AbortController();setLoading(true);setError('');
 getAccessiblePlaces(c.signal).then(p=>{if(!c.signal.aborted)setPlaces(p);}).catch(()=>{if(!c.signal.aborted)setError('Places could not load. Please try again.');}).finally(()=>{if(!c.signal.aborted)setLoading(false);});return()=>c.abort();
 },[searchQuery]);
 const results=useMemo(()=>{
 if(!searchQuery)return [];
 const records=searchQuery.intent==='places'?places:searchQuery.intent==='products'?mockProducts:mockJobs.map(j=>({...j,accessibilityFeatures:j.accessibilityBadges}));
 return records.filter(r=>matchesSearch(r,searchQuery)&&matchesFeatures(r.accessibilityFeatures || [],searchQuery.features));
 },[searchQuery,places]);
 return <div className="h-full overflow-auto bg-white p-4 text-slate-900 dark:bg-slate-900 dark:text-white">
 <TopHeader title="Search results"/>
 <h1 tabIndex={-1} className="text-xl font-bold">Your interpreted search</h1>
 {searchQuery && <p>{[searchQuery.intent,searchQuery.category,searchQuery.location,searchQuery.keywords,...searchQuery.features,searchQuery.minPrice!==null?'Minimum LKR '+searchQuery.minPrice:null,searchQuery.maxPrice!==null?'Maximum LKR '+searchQuery.maxPrice:null].filter(Boolean).join(' · ')}</p>}
 <p role="status">{loading?'Loading results…':error || results.length+' matching results'}</p>
 {!loading&&!error&&results.length===0&&<p>No records match all these requirements. Try a different location or fewer requirements.</p>}
 <ul>{results.map(r=><li key={r.id} className="my-3 rounded-xl border p-3">
 <h2 className="font-bold">{r.title}</h2>
 {'address' in r && <p>{String(r.address)}</p>}
 {'price' in r && <p>LKR {Number(r.price).toLocaleString()}</p>}
 <p>{r.accessibilityFeatures?.join(', ')}</p>
 <button className="min-h-11 text-blue-600 underline" onClick={()=>{
 if(searchQuery?.intent==='products'){const p=mockProducts.find(p=>p.id===r.id);if(p)setSelectedProduct(p);setActiveScreen('product_detail');}
 else setActiveScreen(searchQuery?.intent==='places'?'map':'jobs');
 }}>Open {searchQuery?.intent==='places'?'filtered directory':'details'}</button>
 </li>)}</ul><BottomNav/></div>;
};

