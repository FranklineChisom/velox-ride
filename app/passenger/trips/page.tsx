'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { BookingWithRide } from '@/types';
import { format } from 'date-fns';
import { APP_CONFIG } from '@/lib/constants';
import { Calendar, Users, ChevronRight, Loader2, Navigation, Clock, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import { useRouter } from 'next/navigation';
import Modal from '@/components/ui/Modal';

export default function PassengerTripsPage() {
  const supabase = createClient();
  const router = useRouter();
  const { addToast } = useToast();
  
  const [bookings, setBookings] = useState<BookingWithRide[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'upcoming' | 'history'>('upcoming');
  
  // Modal for Cancel
  const [cancelModal, setCancelModal] = useState<BookingWithRide | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [userId, setUserId] = useState('');

  const fetchBookings = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const { data } = await supabase
      .from('bookings')
      .select(`
        *,
        rides (
          *,
          profiles (full_name, avatar_url, phone_number)
        )
      `)
      .eq('passenger_id', user.id)
      .order('created_at', { ascending: false });

    if (data) setBookings(data as unknown as BookingWithRide[]);
    setLoading(false);
  };

  useEffect(() => { fetchBookings(); }, []);

  const handleCancel = async () => {
    if (!cancelModal) return;
    setCancelling(true);
    
    const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', cancelModal.id);
    
    if (error) {
        addToast('Failed to cancel trip', 'error');
    } else {
        addToast('Trip cancelled successfully', 'success');
        // Optimistic update
        setBookings(bookings.map(b => b.id === cancelModal.id ? { ...b, status: 'cancelled' } : b));
        setCancelModal(null);
    }
    setCancelling(false);
  };

  const filtered = bookings.filter(b => {
    if (filter === 'upcoming') return b.status === 'confirmed' && new Date(b.rides?.departure_time || '') > new Date();
    return b.status === 'completed' || b.status === 'cancelled' || (b.status === 'confirmed' && new Date(b.rides?.departure_time || '') <= new Date());
  });

  return (
    <div className="space-y-8 pt-32 pb-20 px-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-900">My Trips</h1>
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
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-[2rem] p-16 text-center">
           <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <Calendar className="w-8 h-8"/>
           </div>
           <p className="text-slate-500 font-medium">No {filter} trips found.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(b => (
            <div 
              key={b.id} 
              className="bg-white p-6 rounded-2xl border border-slate-100 hover:border-slate-300 hover:shadow-md transition group relative"
            >
              {filter === 'upcoming' && b.status === 'confirmed' && (
                 <div className="absolute top-6 right-6 flex gap-2">
                    <button 
                        onClick={() => router.push(`/passenger/track?booking_id=${b.id}`)}
                        className="bg-black text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 transition"
                    >
                        Track
                    </button>
                    <button 
                        onClick={() => setCancelModal(b)}
                        className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-100 transition"
                    >
                        Cancel
                    </button>
                 </div>
              )}

              <div className="flex flex-col md:flex-row md:items-center gap-6">
                 <div className={`p-4 rounded-xl text-center min-w-[80px] bg-slate-50 text-slate-900`}>
                    <span className="block text-xs font-bold opacity-60 uppercase">{b.rides ? format(new Date(b.rides.departure_time), 'MMM') : '-'}</span>
                    <span className="block text-2xl font-bold">{b.rides ? format(new Date(b.rides.departure_time), 'dd') : '-'}</span>
                 </div>

                 <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                       <span className="flex items-center gap-1"><Clock className="w-4 h-4"/> {b.rides ? format(new Date(b.rides.departure_time), 'h:mm a') : '-'}</span>
                       <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                       <span className="flex items-center gap-1"><Users className="w-4 h-4"/> {b.seats_booked} Seats</span>
                    </div>
                    <div className="flex items-center gap-3 text-lg font-bold text-slate-900">
                       <span className="truncate max-w-[150px]">{b.rides?.origin}</span>
                       <span className="text-slate-300">→</span>
                       <span className="truncate max-w-[150px]">{b.rides?.destination}</span>
                    </div>
                 </div>

                 {filter === 'history' && (
                    <div className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide self-start md:self-center ${
                       b.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                       {b.status}
                    </div>
                 )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={!!cancelModal} onClose={() => setCancelModal(null)} title="Cancel Trip">
         <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-600">
               <AlertCircle className="w-8 h-8"/>
            </div>
            <p className="text-slate-600">Are you sure you want to cancel this trip? Cancellation fees may apply.</p>
            <div className="flex gap-4">
               <button onClick={() => setCancelModal(null)} className="flex-1 py-3 border rounded-xl font-bold hover:bg-slate-50">Keep Trip</button>
               <button onClick={handleCancel} disabled={cancelling} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 flex justify-center items-center gap-2">
                  {cancelling && <Loader2 className="w-4 h-4 animate-spin"/>} Yes, Cancel
               </button>
            </div>
         </div>
      </Modal>
    </div>
  );
}