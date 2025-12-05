'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { RideWithBookings } from '@/types';
import { format } from 'date-fns';
import { APP_CONFIG } from '@/lib/constants';
import { Calendar, Users, ChevronRight, Loader2, MapPin, Clock } from 'lucide-react';
import RideManagerModal from '@/components/driver/RideManagerModal';

export default function DriverTripsPage() {
  const supabase = createClient();
  const [rides, setRides] = useState<RideWithBookings[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'upcoming' | 'history'>('upcoming');
  const [selectedRide, setSelectedRide] = useState<RideWithBookings | null>(null);

  const fetchRides = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('rides')
      .select(`*, bookings(*, profiles(*))`)
      .eq('driver_id', user.id)
      .order('departure_time', { ascending: false });

    if (data) setRides(data as unknown as RideWithBookings[]);
    setLoading(false);
  };

  useEffect(() => { fetchRides(); }, []);

  const filteredRides = rides.filter(ride => {
    if (filter === 'upcoming') return ride.status === 'scheduled' || ride.status === 'active';
    return ride.status === 'completed' || ride.status === 'cancelled';
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Trip History</h1>
        <div className="bg-slate-100 p-1 rounded-xl flex">
           {['upcoming', 'history'].map((f) => (
             <button
               key={f}
               onClick={() => setFilter(f as any)}
               className={`px-6 py-2 rounded-lg text-sm font-bold capitalize transition-all ${filter === f ? 'bg-white text-black shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
               {f}
             </button>
           ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-slate-300"/></div>
      ) : filteredRides.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-[2rem] p-16 text-center">
           <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <Calendar className="w-8 h-8"/>
           </div>
           <p className="text-slate-500 font-medium">No {filter} trips found.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredRides.map(ride => (
            <div 
              key={ride.id} 
              onClick={() => setSelectedRide(ride)}
              className="bg-white p-6 rounded-2xl border border-slate-100 hover:border-slate-300 hover:shadow-md transition cursor-pointer group"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                 {/* Date Badge */}
                 <div className={`p-4 rounded-xl text-center min-w-[80px] ${ride.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-900'}`}>
                    <span className="block text-xs font-bold opacity-60 uppercase">{format(new Date(ride.departure_time), 'MMM')}</span>
                    <span className="block text-2xl font-bold">{format(new Date(ride.departure_time), 'dd')}</span>
                 </div>

                 {/* Info */}
                 <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                       <span className="flex items-center gap-1"><Clock className="w-4 h-4"/> {format(new Date(ride.departure_time), 'h:mm a')}</span>
                       <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                       <span className="flex items-center gap-1"><Users className="w-4 h-4"/> {ride.bookings.length} / {ride.total_seats} Seats</span>
                    </div>
                    <div className="flex items-center gap-3 text-lg font-bold text-slate-900">
                       <span className="truncate max-w-[150px]">{ride.origin}</span>
                       <span className="text-slate-300">→</span>
                       <span className="truncate max-w-[150px]">{ride.destination}</span>
                    </div>
                 </div>

                 {/* Price & Status */}
                 <div className="flex items-center gap-6 justify-between md:justify-end border-t md:border-t-0 border-slate-50 pt-4 md:pt-0">
                    <div className="text-right">
                       <p className="text-xs font-bold text-slate-400 uppercase mb-1">Total Earned</p>
                       <p className="text-xl font-bold text-slate-900">{APP_CONFIG.currency}{(ride.price_per_seat * ride.bookings.length).toLocaleString()}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide ${
                       ride.status === 'completed' ? 'bg-slate-100 text-slate-500' :
                       ride.status === 'active' ? 'bg-green-100 text-green-700' :
                       'bg-blue-50 text-blue-700'
                    }`}>
                       {ride.status}
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-black hidden md:block"/>
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedRide && (
        <RideManagerModal 
          ride={selectedRide} 
          bookings={selectedRide.bookings} 
          onClose={() => setSelectedRide(null)} 
          onUpdate={fetchRides} 
        />
      )}
    </div>
  );
}