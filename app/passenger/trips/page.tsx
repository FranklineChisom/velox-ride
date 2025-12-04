'use client';
import { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, AlertCircle, Loader2, XCircle, User, Phone, ShieldCheck, CreditCard, Navigation, Ticket } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { BookingWithRide } from '@/types';
import { format } from 'date-fns';
import { APP_CONFIG } from '@/lib/constants';
import { useToast } from '@/components/ui/ToastProvider';
import Modal from '@/components/ui/Modal';
import { useRouter } from 'next/navigation';

export default function TripsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');
  const [bookings, setBookings] = useState<BookingWithRide[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithRide | null>(null);
  const [cancelling, setCancelling] = useState(false);
  
  const supabase = createClient();
  const { addToast } = useToast();

  const fetchTrips = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          rides (
            *,
            profiles (
              full_name,
              phone_number,
              is_verified,
              vehicle_model,
              vehicle_plate,
              vehicle_year,
              avatar_url
            )
          )
        `)
        .eq('passenger_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setBookings(data as unknown as BookingWithRide[]);
    } catch (err: any) {
      addToast('Failed to load trips', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [supabase, addToast]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const handleCancelBooking = async () => {
    if (!selectedBooking) return;
    setCancelling(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', selectedBooking.id);

      if (error) throw error;

      addToast('Trip cancelled successfully', 'success');
      setBookings(prev => prev.map(b => b.id === selectedBooking.id ? { ...b, status: 'cancelled' } : b));
      setCancelModalOpen(false);
      setDetailsModalOpen(false);
    } catch (err: any) {
      addToast(err.message || 'Failed to cancel trip', 'error');
    } finally {
      setCancelling(false);
      setSelectedBooking(null);
    }
  };

  const openCancelModal = (booking: BookingWithRide, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedBooking(booking);
    setCancelModalOpen(true);
  };

  const handleTripClick = (booking: BookingWithRide) => {
    // If upcoming/active, go to tracking page
    if (activeTab === 'upcoming' && booking.status === 'confirmed') {
        router.push(`/passenger/track?booking_id=${booking.id}`);
    } else {
        // Otherwise show details modal
        setSelectedBooking(booking);
        setDetailsModalOpen(true);
    }
  };

  const getFilteredTrips = () => {
    const now = new Date();
    return bookings.filter((b) => {
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
        {(['upcoming', 'completed', 'cancelled'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
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
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-300 w-8 h-8"/></div>
        ) : filteredTrips.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-3xl">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <Calendar className="w-8 h-8" />
            </div>
            <h3 className="text-slate-900 font-bold mb-1">No {activeTab} trips</h3>
            <p className="text-slate-500 text-sm">Your trip history will appear here.</p>
          </div>
        ) : (
          filteredTrips.map((b) => (
            <div 
              key={b.id} 
              onClick={() => handleTripClick(b)}
              className="bg-white border border-slate-100 rounded-2xl p-6 hover:border-black/10 hover:shadow-lg transition group cursor-pointer relative"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                
                {/* Time & Date */}
                <div className="flex items-start gap-4 min-w-[140px]">
                  <div className={`p-3 rounded-xl ${activeTab === 'upcoming' ? 'bg-black text-white' : 'bg-slate-50 text-slate-600'}`}>
                    {activeTab === 'upcoming' ? <Navigation className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                  </div>
                  <div>
                    {b.rides && (
                        <>
                            <div className="font-bold text-slate-900">{format(new Date(b.rides.departure_time), 'MMM dd, yyyy')}</div>
                            <div className="text-xs text-slate-500 font-medium">{format(new Date(b.rides.departure_time), 'h:mm a')}</div>
                        </>
                    )}
                  </div>
                </div>

                {/* Route */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 bg-black rounded-full shadow-[0_0_0_2px_white]"></div>
                    <span className="text-sm font-semibold text-slate-700">{b.rides?.origin}</span>
                  </div>
                  <div className="pl-[3px] border-l-2 border-slate-100 h-4 ml-[3px] mb-1"></div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-slate-400 rounded-sm shadow-[0_0_0_2px_white]"></div>
                    <span className="text-sm font-semibold text-slate-900">{b.rides?.destination}</span>
                  </div>
                </div>

                {/* Price & Actions */}
                <div className="flex flex-col items-end gap-2">
                  <div className="text-lg font-bold text-slate-900">{APP_CONFIG.currency}{b.rides ? (b.rides.price_per_seat * b.seats_booked).toLocaleString() : 0}</div>
                  
                  {activeTab === 'upcoming' ? (
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={(e) => openCancelModal(b, e)}
                            className="text-xs font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition flex items-center gap-1 z-10"
                        >
                            <XCircle className="w-3 h-3"/> Cancel
                        </button>
                        <span className="text-xs font-bold text-white bg-black px-3 py-1.5 rounded-lg flex items-center gap-1">
                            <Navigation className="w-3 h-3"/> Track
                        </span>
                    </div>
                  ) : (
                    <div className={`text-xs font-bold px-2 py-1 rounded-md inline-flex items-center gap-1 ${
                      b.status === 'confirmed' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {b.status === 'cancelled' && <AlertCircle className="w-3 h-3" />}
                      {b.status.toUpperCase()}
                    </div>
                  )}
                </div>

              </div>
            </div>
          ))
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      <Modal isOpen={cancelModalOpen} onClose={() => setCancelModalOpen(false)} title="Cancel Trip">
        <div className="space-y-4">
          <p className="text-slate-600">
            Are you sure you want to cancel this trip? Cancellation fees may apply if the trip is less than an hour away.
          </p>
          <div className="flex gap-3 pt-4">
            <button 
              onClick={() => setCancelModalOpen(false)} 
              className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition"
            >
              Keep Trip
            </button>
            <button 
              onClick={handleCancelBooking} 
              disabled={cancelling}
              className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition flex items-center justify-center gap-2"
            >
              {cancelling ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Yes, Cancel'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Full Trip Details Modal (For Completed Trips) */}
      <Modal isOpen={detailsModalOpen} onClose={() => setDetailsModalOpen(false)} title="Trip Receipt" maxWidth="max-w-xl">
        {selectedBooking && selectedBooking.rides && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Header: Status & Ref */}
            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
               <div>
                  <p className="text-xs text-slate-500 uppercase font-bold mb-1">Booking Reference</p>
                  <p className="font-mono font-bold text-slate-900">{selectedBooking.id.slice(0, 8).toUpperCase()}</p>
               </div>
               <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  selectedBooking.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
               }`}>
                  {selectedBooking.status}
               </div>
            </div>

            {/* Route */}
            <div className="flex gap-6 relative">
               <div className="flex flex-col items-center pt-2">
                  <div className="w-3 h-3 bg-black rounded-full shadow-[0_0_0_4px_white] z-10"></div>
                  <div className="w-0.5 bg-slate-200 h-full -my-2"></div>
                  <div className="w-3 h-3 bg-slate-500 rounded-sm shadow-[0_0_0_4px_white] z-10"></div>
               </div>
               <div className="flex-1 space-y-8">
                  <div>
                     <p className="text-xs text-slate-500 uppercase font-bold mb-1">Pickup • {format(new Date(selectedBooking.rides.departure_time), 'h:mm a')}</p>
                     <p className="font-bold text-lg text-slate-900">{selectedBooking.rides.origin}</p>
                     <p className="text-sm text-slate-500 mt-1">{format(new Date(selectedBooking.rides.departure_time), 'EEEE, MMMM do, yyyy')}</p>
                  </div>
                  <div>
                     <p className="text-xs text-slate-500 uppercase font-bold mb-1">Dropoff</p>
                     <p className="font-bold text-lg text-slate-900">{selectedBooking.rides.destination}</p>
                  </div>
               </div>
            </div>

            <div className="h-px bg-slate-100 w-full" />

            {/* Driver Info */}
            <div>
               <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><User className="w-4 h-4"/> Driver Details</h4>
               {(selectedBooking.rides as any).profiles ? (
                 <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-slate-100 rounded-full overflow-hidden flex items-center justify-center text-slate-400">
                       {(selectedBooking.rides as any).profiles.avatar_url ? (
                         <img src={(selectedBooking.rides as any).profiles.avatar_url} className="w-full h-full object-cover" alt="Driver" />
                       ) : <User className="w-6 h-6"/>}
                    </div>
                    <div>
                       <div className="flex items-center gap-2">
                          <p className="font-bold text-lg text-slate-900">{(selectedBooking.rides as any).profiles.full_name}</p>
                          {(selectedBooking.rides as any).profiles.is_verified && <ShieldCheck className="w-4 h-4 text-green-500" />}
                       </div>
                       <p className="text-sm text-slate-600 font-medium">
                          {(selectedBooking.rides as any).profiles.vehicle_model} • {(selectedBooking.rides as any).profiles.vehicle_plate}
                       </p>
                    </div>
                 </div>
               ) : (
                 <p className="text-sm text-slate-400 italic">Driver information unavailable</p>
               )}
            </div>

            <div className="h-px bg-slate-100 w-full" />

            {/* Payment Summary */}
            <div>
               <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><CreditCard className="w-4 h-4"/> Payment</h4>
               <div className="bg-slate-50 p-5 rounded-2xl space-y-3">
                  <div className="flex justify-between text-sm">
                     <span className="text-slate-500">Seat Price</span>
                     <span className="font-medium">{APP_CONFIG.currency}{(selectedBooking.rides.price_per_seat).toLocaleString()} x {selectedBooking.seats_booked}</span>
                  </div>
                  <div className="h-px bg-slate-200 my-2" />
                  <div className="flex justify-between items-center">
                     <span className="font-bold text-slate-900">Total Paid</span>
                     <span className="font-bold text-xl text-slate-900">{APP_CONFIG.currency}{(selectedBooking.rides.price_per_seat * selectedBooking.seats_booked).toLocaleString()}</span>
                  </div>
               </div>
            </div>

            <button onClick={() => setDetailsModalOpen(false)} className="w-full py-3 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition">
                Close Receipt
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}