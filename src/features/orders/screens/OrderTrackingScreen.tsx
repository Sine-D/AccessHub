import React from 'react';
import { useAccessibility } from '../../../core/hooks/useAccessibility';
import { TopHeader } from '../../../core/navigation/TopHeader';
import { BottomNav } from '../../../core/navigation/BottomNav';
import { 
  Truck, 
  Phone, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';

export const OrderTrackingScreen: React.FC = () => {
  const { speakText } = useAccessibility();

  const steps = [
    { title: 'Order Placed', time: '10:00 AM', done: true },
    { title: 'Packed by Seller', time: '10:30 AM', done: true },
    { title: 'Picked Up by Courier', time: '11:15 AM', done: true },
    { title: 'On The Way', time: 'Estimated 11:45 AM', done: true, current: true },
    { title: 'Delivered', time: 'Pending', done: false },
  ];

  return (
    <div className="w-full h-full min-h-[800px] bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white flex flex-col justify-between overflow-y-auto">
      
      <TopHeader title="Live Order Tracking 🚚" />

      <div className="p-4 space-y-4 pb-8">
        
        {/* Estimated Time Card */}
        <div className="p-4 rounded-3xl bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-100 uppercase tracking-wider">Estimated Delivery</span>
            <span className="px-2.5 py-1 rounded-full bg-white/20 text-xs font-extrabold flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5" />
              <span>In 25 Mins</span>
            </span>
          </div>

          <h2 className="text-xl font-extrabold">Today, 11:45 AM</h2>
          <span className="text-xs text-teal-100 block">Wheelchair Accessible Courier Assigned</span>
        </div>

        {/* Live Route Map Simulation */}
        <div className="relative w-full h-44 bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 flex items-center justify-center">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:14px_14px]"></div>
          
          {/* Animated Courier Pin */}
          <div className="relative flex flex-col items-center animate-bounce">
            <div className="p-3 rounded-full bg-teal-500 text-slate-950 shadow-2xl">
              <Truck className="w-6 h-6" />
            </div>
            <span className="mt-1 px-2.5 py-0.5 rounded-full bg-slate-900 text-[10px] font-extrabold text-teal-400 border border-teal-500">
              Courier 1.2 km away
            </span>
          </div>
        </div>

        {/* Delivery Driver Info */}
        <div className="p-3.5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-3">
            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300" alt="driver" className="w-12 h-12 rounded-full object-cover" />
            <div>
              <h4 className="font-bold text-xs text-slate-900 dark:text-white">Nuwan Senanayake</h4>
              <span className="text-[10px] text-teal-600 dark:text-teal-400 font-extrabold">♿ Accessible Courier Partner</span>
              <span className="text-[10px] text-slate-400 block">Vehicle: Hero Scooter (Plate: WP BI-4521)</span>
            </div>
          </div>

          <button
            onClick={() => speakText('Calling delivery courier Nuwan')}
            className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 shadow-xs"
          >
            <Phone className="w-4 h-4" />
          </button>
        </div>

        {/* Timeline */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 space-y-4 shadow-xs">
          <h3 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">Tracking Timeline</h3>

          <div className="space-y-4 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
            {steps.map((step, idx) => (
              <div key={idx} className="relative flex items-center space-x-3 pl-8">
                <div className={`absolute left-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold z-10 ${
                  step.current
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-950 animate-pulse'
                    : step.done 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                }`}>
                  {step.done ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                </div>

                <div className="flex-1 flex items-center justify-between">
                  <div>
                    <h4 className={`text-xs font-bold ${step.current ? 'text-blue-600 dark:text-blue-400 font-extrabold' : 'text-slate-900 dark:text-white'}`}>
                      {step.title}
                    </h4>
                    <span className="text-[10px] text-slate-400">{step.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      <BottomNav />

    </div>
  );
};
