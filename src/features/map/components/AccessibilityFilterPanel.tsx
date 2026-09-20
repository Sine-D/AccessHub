import React from 'react';
import type {Feature} from '../../../core/search/contracts.ts';
import {FEATURES,featureLabels} from '../utils/accessibilityFilters.ts';
export function AccessibilityFilterPanel({value,onChange}:{value:Feature[];onChange:(next:Feature[])=>void}) {
 return <fieldset className="rounded-xl border border-slate-300 bg-white p-3 text-slate-900 dark:bg-slate-900 dark:text-white">
 <legend className="font-bold">Required accessibility features</legend>
 <p className="mb-2 text-sm">Places must match every selected feature.</p>
 <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">{FEATURES.map(f=><label key={f} className="flex min-h-11 cursor-pointer items-center gap-2">
 <input className="h-5 w-5 focus:ring-2 focus:ring-blue-600" type="checkbox" checked={value.includes(f)} onChange={e=>onChange(e.target.checked?[...value,f]:value.filter(x=>x!==f))}/>
 {featureLabels[f]}</label>)}</div>
 <button type="button" disabled={!value.length} className="min-h-11 rounded-lg border px-3 disabled:opacity-50" onClick={()=>onChange([])}>Clear feature filters</button>
 </fieldset>;
}

