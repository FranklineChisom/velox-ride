'use client';
import { useState, useEffect } from 'react';
import { Calendar, Clock, ArrowUpRight, AlertCircle, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { Booking } from '@/types';
import { format } from 'date-fns';
import { APP_CONFIG } from '@/lib/constants';

export default function TripsPage() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>('completed');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch bookings with ride details
    const { data, error } = await supabase
      .from('bookings')
      .select('*, rides(*)')
      .eq('passenger_id', user.id)
      .order('created_at', { ascending: false });

    if (error) console.error(error);
    if (data) setBookings(data as any); // Type assertion for joined query
    setLoading(false);
  };

  const getFilteredTrips = () => {
    const now = new Date();
    return bookings.filter((b: any) => {
      if (!b.rides) return false;
      const rideDate = new Date(b.rides.departure_time);
      
      if (b.status === 'cancelled') return activeTab === 'cancelled';
      if (activeTab === 'upcoming') return rideDate > now && b.status === 'confirmed';
      if (activeTab === 'completed') return rideDate <= now && b.status === 'confirmed';
      return false;
    });
  };

  const filteredTrips = getFilteredTrips();

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto pt-32">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">My Trips</h1>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-100 rounded-xl w-fit mb-8">
        {['upcoming', 'completed', 'cancelled'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold capitalize transition-all ${
              activeTab === tab 
                ? 'bg-white text-black shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-300"/></div>
        ) : filteredTrips.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-3xl">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <Calendar className="w-8 h-8" />
            </div>
            <h3 className="text-slate-900 font-bold mb-1">No {activeTab} trips</h3>
            <p className="text-slate-500 text-sm">Your trip history will appear here.</p>
          </div>
        ) : (
          filteredTrips.map((b: any) => (
            <div key={b.id} className="bg-white border border-slate-100 rounded-2xl p-6 hover:border-black/10 hover:shadow-lg transition group cursor-pointer">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                
                {/* Time & Date */}
                <div className="flex items-start gap-4 min-w-[140px]">
                  <div className="bg-slate-50 p-3 rounded-xl text-slate-600">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{format(new Date(b.rides.departure_time), 'MMM dd, yyyy')}</div>
                    <div className="text-xs text-slate-500 font-medium">{format(new Date(b.rides.departure_time), 'h:mm a')}</div>
                  </div>
                </div>

                {/* Route */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 bg-black rounded-full"></div>
                    <span className="text-sm font-semibold text-slate-700">{b.rides.origin}</span>
                  </div>
                  <div className="pl-[3px] border-l-2 border-slate-100 h-4 ml-[3px] mb-1"></div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-slate-400 rounded-sm"></div>
                    <span className="text-sm font-semibold text-slate-900">{b.rides.destination}</span>
                  </div>
                </div>

                {/* Price & Status */}
                <div className="text-right">
                  <div className="text-lg font-bold text-slate-900 mb-1">{APP_CONFIG.currency}{b.rides.price_per_seat * b.seats_booked}</div>
                  <div className={`text-xs font-bold px-2 py-1 rounded-md inline-flex items-center gap-1 ${
                    b.status === 'confirmed' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {b.status === 'cancelled' && <AlertCircle className="w-3 h-3" />}
                    {b.status.toUpperCase()}
                  </div>
                </div>

              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}