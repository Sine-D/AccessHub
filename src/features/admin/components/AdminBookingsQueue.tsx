import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../../core/supabase';
import { createClient } from '@supabase/supabase-js';
import { CheckCircle2, XCircle } from 'lucide-react';
import { AdminEmptyState } from './AdminStates';
import { useAccessibility } from '../../../core/hooks/useAccessibility';
import { useAppState } from '../../../core/hooks/useAppState';

export const AdminBookingsQueue: React.FC = () => {
  const { bookingRequests, approveBookingEscrow, rejectBookingEscrow } = useAppState();
  const [dbBookings, setDbBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { speakText } = useAccessibility();

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? 'https://placeholder.supabase.co';
      const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? 'supabase-anon-key-not-configured';

      const res = await fetch(`${supabaseUrl}/rest/v1/service_bookings?select=*&order=created_at.desc`, {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`
        }
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch bookings');
      }
      
      const data = await res.json();
      
      if (data) {
        setDbBookings(data);
      }
    } catch (err) {
      console.warn('Supabase fetch failed (local mode):', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Combine Context local bookings with DB bookings for UI
  const allBookings = [
    ...bookingRequests.map(b => ({
      id: b.id,
      service_title: b.serviceTitle,
      provider_name: b.providerName,
      total_budget: b.totalBudget,
      status: b.status === 'in_progress' ? 'accepted' : b.status,
      created_at: b.createdAt
    })),
    ...dbBookings
  ];

  const bookings = allBookings.filter((v,i,a)=>a.findIndex(t=>(t.id === v.id))===i);

  const handleUpdateStatus = async (id: string, status: string) => {
    // Try Context first
    if (bookingRequests.find(b => b.id === id)) {
      if (status === 'accepted') {
        approveBookingEscrow(id);
      } else if (status === 'canceled') {
        rejectBookingEscrow(id); // Using reject to handle cancel logic in Context
      }
      speakText(`Booking marked as ${status}`);
      return;
    }

    try {
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? 'https://placeholder.supabase.co';
      const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? 'supabase-anon-key-not-configured';

      const res = await fetch(`${supabaseUrl}/rest/v1/service_bookings?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ status })
      });
      
      if (!res.ok) {
        throw new Error('Failed to update booking');
      }
      
      setDbBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
      speakText(`Booking marked as ${status}`);
    } catch (err) {
      console.error('Error updating booking status', err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">
          Client Orders Dispatched to Freelancers ({bookings.length})
        </h3>
        <button
          onClick={fetchBookings}
          className="text-[10px] font-extrabold px-2.5 py-1 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30"
        >
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <div className="p-4 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-3 shadow-md flex items-center justify-center">
          <p className="text-sm text-slate-400">Loading bookings...</p>
        </div>
      ) : bookings.length === 0 ? (
        <AdminEmptyState
          title="No Orders Sent to Freelancers"
          message="When a client books a freelancer through the form, the order details will appear here for freelancer acceptance."
          icon={CheckCircle2}
        />
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <div key={booking.id} className="p-4 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-3 shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{booking.service_title}</h4>
                  <span className="text-xs text-teal-600 dark:text-teal-400 font-bold block mt-0.5">
                    Provider: {booking.provider_name}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 block">
                    LKR {Number(booking.total_budget || 0).toLocaleString()}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${
                    booking.status === 'accepted' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                    booking.status === 'canceled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  }`}>
                    {booking.status?.toUpperCase() || 'PENDING'}
                  </span>
                </div>
              </div>

              {booking.status === 'pending' && (
                <div className="flex items-center space-x-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                  <button
                    onClick={() => handleUpdateStatus(booking.id, 'accepted')}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center space-x-1.5 shadow-md"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve Booking</span>
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(booking.id, 'canceled')}
                    className="flex-1 py-2.5 rounded-xl bg-red-100 hover:bg-red-200 dark:bg-red-950 dark:hover:bg-red-900 text-red-600 dark:text-red-400 font-extrabold text-xs flex items-center justify-center space-x-1.5 shadow-md"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Cancel / Reject</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
