import React, { useState } from 'react';
import { useAppState } from '../../hooks/useAppState';
import { useAccessibility } from '../../hooks/useAccessibility';
import { mockMapPins } from '../../services/mockData';
import { TopHeader } from '../../components/layout/TopHeader';
import { BottomNav } from '../../components/layout/BottomNav';
import { 
  MapPin, 
  Navigation, 
  ShieldCheck, 
  MessageSquare 
} from 'lucide-react';

export const MapScreen: React.FC = () => {
  const { setActiveScreen } = useAppState();
  const { speakText } = useAccessibility();
  const [selectedPin, setSelectedPin] = useState(mockMapPins[0]);
  const [filterType, setFilterType] = useState<'all' | 'seller' | 'ngo' | 'company'>('all');

  const filteredPins = mockMapPins.filter(p => filterType === 'all' || p.type === filterType);

  return (
    <div className="w-full h-full min-h-[800px] bg-slate-900 text-white flex flex-col justify-between overflow-hidden relative">
      
      <TopHeader title="Accessible Local Maps 🗺️" />

      {/* Simulated Interactive Map Canvas */}
      <div className="relative flex-1 bg-slate-950 overflow-hidden flex items-center justify-center">
        
        {/* Map Grid Pattern background */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        {/* Simulated Map Route Line */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <path 
            d="M 100 250 Q 200 180 300 350" 
            fill="none" 
            stroke="#2563EB" 
            strokeWidth="4" 
            strokeDasharray="6 6"
            className="animate-pulse"
          />
        </svg>

        {/* Floating Map Pins */}
        {filteredPins.map((pin, index) => {
          const isSelected = selectedPin.id === pin.id;
          const positions = [
            { top: '30%', left: '25%' },
            { top: '55%', left: '60%' },
            { top: '40%', left: '75%' },
          ];
          const pos = positions[index % positions.length];

          return (
            <button
              key={pin.id}
              onClick={() => {
                setSelectedPin(pin);
                speakText(`Selected map pin ${pin.title}. ${pin.badge}`);
              }}
              style={{ top: pos.top, left: pos.left }}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 group z-20 ${
                isSelected ? 'scale-125' : 'hover:scale-110'
              }`}
            >
              <div className="relative flex flex-col items-center">
                <div className={`p-2.5 rounded-full shadow-2xl flex items-center justify-center border-2 border-white ${
                  pin.type === 'seller' ? 'bg-blue-600' : pin.type === 'ngo' ? 'bg-teal-500' : 'bg-amber-500'
                }`}>
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                
                {/* Pin Label Banner */}
                <div className="mt-1 px-2.5 py-1 rounded-full bg-slate-900/90 text-[10px] font-extrabold whitespace-nowrap border border-slate-700 shadow-md">
                  {pin.title}
                </div>
              </div>
            </button>
          );
        })}

        {/* Filter Overlay Controls */}
        <div className="absolute top-4 left-4 right-4 z-30 flex items-center space-x-1.5 overflow-x-auto bg-slate-900/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800">
          {(['all', 'seller', 'ngo', 'company'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold capitalize transition-all ${
                filterType === type 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Accessible Route Badge */}
        <div className="absolute top-16 left-4 z-30 bg-teal-500 text-slate-950 px-3 py-1 rounded-full text-[10px] font-extrabold flex items-center space-x-1 shadow-md">
          <Navigation className="w-3 h-3 fill-slate-950" />
          <span>Wheelchair Accessible Route Active</span>
        </div>

      </div>

      {/* Bottom Sheet Details Drawer */}
      <div className="bg-slate-900 border-t border-slate-800 p-4 space-y-3 z-40 rounded-t-3xl shadow-2xl">
        <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-1"></div>
        
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <img src={selectedPin.image} alt={selectedPin.title} className="w-12 h-12 rounded-2xl object-cover" />
            <div>
              <h3 className="font-extrabold text-sm text-white">{selectedPin.title}</h3>
              <span className="text-[11px] text-slate-400 block">{selectedPin.address}</span>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
            {selectedPin.distance}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-teal-950/60 border border-teal-800 text-teal-300 text-xs font-bold flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
          <span>♿ {selectedPin.badge}</span>
        </div>

        <div className="flex items-center space-x-2 pt-1">
          <button
            onClick={() => setActiveScreen('chat')}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-200 font-extrabold text-xs flex items-center justify-center space-x-1 hover:bg-slate-700"
          >
            <MessageSquare className="w-4 h-4 text-blue-400" />
            <span>Chat</span>
          </button>
          <button
            onClick={() => speakText(`Starting turn by turn accessible navigation to ${selectedPin.title}`)}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center justify-center space-x-1 shadow-md"
          >
            <Navigation className="w-4 h-4" />
            <span>Start Navigation</span>
          </button>
        </div>
      </div>

      <BottomNav />

    </div>
  );
};
