'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { BookingWithRide, Coordinates, Ride, Message } from '@/types';
import { Loader2, Phone, MessageSquare, ShieldCheck, MapPin, Navigation, Share2, AlertTriangle, ArrowLeft, Clock, User, X, CheckCircle } from 'lucide-react';
import { APP_CONFIG } from '@/lib/constants';
import { format, addMinutes } from 'date-fns';
import dynamic from 'next/dynamic';
import { getRoute, searchLocation } from '@/lib/osm';
import { useToast } from '@/components/ui/ToastProvider';
import ChatModal from '@/components/ChatModal';
import Modal from '@/components/ui/Modal';
import ReviewModal from '@/components/ReviewModal';

interface ExtendedRide extends Ride {
  origin_lat?: number;
  origin_lng?: number;
  destination_lat?: number;
  destination_lng?: number;
  current_lat?: number;
  current_lng?: number;
  driver_arrived?: boolean;
}

interface ExtendedBooking extends Omit<BookingWithRide, 'rides'> {
  rides: (ExtendedRide & { profiles: any }) | null;
}

const LeafletMap = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-50 animate-pulse flex items-center justify-center">Loading Map...</div>
});

function TrackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();
  const { addToast } = useToast();
  
  const bookingId = searchParams.get('booking_id');
  
  const [booking, setBooking] = useState<ExtendedBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [route, setRoute] = useState<[number, number][] | undefined>(undefined);
  const [coords, setCoords] = useState<{ pickup?: Coordinates; dropoff?: Coordinates; driver?: Coordinates }>({});
  const [eta, setEta] = useState<number | null>(null);
  const [status, setStatus] = useState('Locating ride...');
  
  // Interaction State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!bookingId) {
        router.push('/passenger/trips');
        return;
    }

    let realtimeChannel: any;
    let chatChannel: any;

    const fetchBookingAndSetupRealtime = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if(user) {
            setCurrentUser(user);
            const { count } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('booking_id', bookingId)
                .eq('is_read', false)
                .neq('sender_id', user.id);
            if (count) setUnreadCount(count);
        }

        const { data, error } = await supabase
          .from('bookings')
          .select(`
            *,
            rides (
              *,
              profiles (
                id,
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
          .eq('id', bookingId)
          .single();

        if (error) throw error;
        
        if (data && data.rides) {
            const bookingData = data as unknown as ExtendedBooking;
            const ride = bookingData.rides;
            setBooking(bookingData);

            // --- Geolocation Logic ---
            let pickupCoords: Coordinates | null = null;
            let dropoffCoords: Coordinates | null = null;

            if (ride?.origin_lat && ride?.origin_lng) {
                pickupCoords = { lat: ride.origin_lat, lng: ride.origin_lng };
            } else if (ride?.origin) {
                pickupCoords = await searchLocation(ride.origin);
            }

            if (ride?.destination_lat && ride?.destination_lng) {
                dropoffCoords = { lat: ride.destination_lat, lng: ride.destination_lng };
            } else if (ride?.destination) {
                dropoffCoords = await searchLocation(ride.destination);
            }

            const driverCoords = (ride?.current_lat && ride?.current_lng) 
                ? { lat: ride.current_lat, lng: ride.current_lng } 
                : undefined;

            setCoords({
                pickup: pickupCoords || undefined,
                dropoff: dropoffCoords || undefined,
                driver: driverCoords
            });

            if (pickupCoords && dropoffCoords) {
                const path = await getRoute(pickupCoords, dropoffCoords);
                if (path) setRoute(path);
            }

            // --- Initial Status ---
            updateStatusText(ride);

            // Check if already completed
            if (ride.status === 'completed') {
                setReviewModalOpen(true);
            }

            // --- Realtime Subscription ---
            if (ride?.id) {
                realtimeChannel = supabase.channel(`ride-tracking-${ride.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'rides',
                        filter: `id=eq.${ride.id}`
                    },
                    (payload: any) => {
                        const newRide = payload.new as ExtendedRide;
                        
                        // Update Location
                        if (newRide.current_lat && newRide.current_lng) {
                            setCoords(prev => ({
                                ...prev,
                                driver: { lat: newRide.current_lat!, lng: newRide.current_lng! }
                            }));
                        }

                        // Handle Status Changes
                        updateStatusText(newRide);
                        
                        // Check for completion
                        if (newRide.status === 'completed') {
                            // Update local booking state to reflect completion
                            setBooking(prev => prev ? {
                                ...prev,
                                rides: prev.rides ? { ...prev.rides, status: 'completed' } : null
                            } : null);
                            
                            addToast('Trip completed!', 'success');
                            setReviewModalOpen(true);
                        }
                    }
                )
                .subscribe();
            }

            chatChannel = supabase.channel(`chat-listener-${bookingId}`)
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'messages', filter: `booking_id=eq.${bookingId}` },
                    (payload) => {
                        const newMsg = payload.new as Message;
                        if (currentUser && newMsg.sender_id !== currentUser.id && !isChatOpen) {
                            setUnreadCount(prev => prev + 1);
                            addToast('New message from driver', 'info');
                        }
                    }
                )
                .subscribe();
        }
      } catch (e) {
        console.error(e);
        addToast('Error loading ride details', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchBookingAndSetupRealtime();

    return () => {
        if (realtimeChannel) supabase.removeChannel(realtimeChannel);
        if (chatChannel) supabase.removeChannel(chatChannel);
    };
  }, [bookingId, supabase, router, addToast, isChatOpen, currentUser]); // Added dependencies

  useEffect(() => {
    if (isChatOpen) setUnreadCount(0);
  }, [isChatOpen]);

  // Helper to update status UI
  const updateStatusText = (ride: ExtendedRide) => {
      if (ride.status === 'completed') setStatus('Trip Completed');
      else if (ride.status === 'active') setStatus('Trip in Progress');
      else if (ride.driver_arrived) {
          setStatus('Driver Arrived');
          addToast('Driver has arrived at pickup location', 'success');
      }
      else if (ride.status === 'scheduled') setStatus('Ride Scheduled');
      else setStatus(ride.status || 'Unknown');
  };

  const handleCall = () => {
    const phone = booking?.rides?.profiles?.phone_number;
    if (phone) window.open(`tel:${phone}`, '_self');
    else addToast('Driver phone number not available', 'error');
  };

  const handleShare = async () => {
    const shareData = {
        title: 'Track my Veluxeride',
        text: `I'm on my way from ${booking?.rides?.origin} to ${booking?.rides?.destination}.`,
        url: window.location.href,
    };
    if (navigator.share) {
        try { await navigator.share(shareData); } catch (err) {}
    } else {
        navigator.clipboard.writeText(window.location.href);
        addToast('Link copied to clipboard', 'info');
    }
  };

  const handleEmergency = () => {
    addToast('SOS Alert Sent!', 'error');
    window.open('tel:112', '_self');
    setSosModalOpen(false);
  };

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-white"><Loader2 className="w-8 h-8 animate-spin text-black"/></div>;
  if (!booking || !booking.rides) return null;

  const driver = (booking.rides as any).profiles;

  return (
    <div className="h-screen w-full relative flex flex-col md:flex-row bg-slate-50">
      
      {/* Map Layer */}
      <div className="flex-1 relative order-1 md:order-2 h-[50vh] md:h-auto">
         <div className="absolute top-6 left-6 z-[1000] md:hidden">
            <button onClick={() => router.back()} className="bg-white p-3 rounded-full shadow-lg text-slate-900 hover:scale-105 transition">
                <ArrowLeft className="w-5 h-5"/>
            </button>
         </div>
         <LeafletMap 
            pickup={coords.pickup}
            dropoff={coords.dropoff}
            driverLocation={coords.driver}
            routeCoordinates={route}
         />
      </div>

      {/* Info Panel */}
      <div className="order-2 md:order-1 w-full md:w-[450px] bg-white shadow-2xl z-10 flex flex-col h-[50vh] md:h-screen animate-slide-up md:animate-none relative">
         <div className="hidden md:flex p-6 border-b border-slate-100 items-center justify-between">
            <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-slate-50 text-slate-500 hover:text-black transition">
                <ArrowLeft className="w-5 h-5"/>
            </button>
            <h1 className="font-bold text-slate-900">Ride Tracking</h1>
            <div className="w-9"></div>
         </div>

         <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {/* Status Card */}
            <div className="bg-black text-white p-6 rounded-3xl relative overflow-hidden shadow-xl">
               <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                     <div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Status</p>
                        <h2 className="text-2xl font-bold">{status}</h2>
                     </div>
                     <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2">
                        <Clock className="w-4 h-4"/>
                        <span className="font-bold text-sm">{eta ? `${eta} min` : '--'}</span>
                     </div>
                  </div>
                  <div className="w-full bg-white/20 h-1 rounded-full overflow-hidden">
                     <div className="bg-white h-full w-[45%] animate-pulse"></div>
                  </div>
               </div>
            </div>

            {/* Driver Card */}
            <div>
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Your Driver</h3>
               <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="w-14 h-14 rounded-full bg-slate-200 overflow-hidden relative">
                     {driver?.avatar_url ? (
                        <img src={driver.avatar_url} className="w-full h-full object-cover" alt={driver.full_name} />
                     ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400"><User className="w-6 h-6"/></div>
                     )}
                  </div>
                  <div className="flex-1">
                     <h4 className="font-bold text-slate-900 text-lg">{driver?.full_name || 'Unassigned'}</h4>
                     <p className="text-sm text-slate-500 font-medium">
                        {driver ? `${driver.vehicle_model} • ${driver.vehicle_plate}` : 'Searching for driver...'}
                     </p>
                  </div>
                  {driver && (
                      <div className="flex gap-2">
                         <button 
                           onClick={() => setIsChatOpen(true)}
                           className="relative p-3 bg-white border border-slate-200 rounded-full hover:bg-slate-100 transition shadow-sm text-slate-900"
                         >
                            <MessageSquare className="w-5 h-5"/>
                            {unreadCount > 0 && (
                                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-bounce">
                                    {unreadCount}
                                </div>
                            )}
                         </button>
                         <button onClick={handleCall} className="p-3 bg-black text-white rounded-full hover:bg-slate-800 transition shadow-lg">
                            <Phone className="w-5 h-5"/>
                         </button>
                      </div>
                  )}
               </div>
            </div>

            {/* Trip Details */}
            <div className="space-y-6 relative pl-4">
                <div className="absolute left-[19px] top-2 bottom-4 w-0.5 bg-slate-200"></div>
                <div className="relative z-10 flex gap-4 items-start">
                   <div className="w-3 h-3 bg-black rounded-full ring-4 ring-white shadow-sm mt-1.5 shrink-0"></div>
                   <div>
                      <p className="text-xs font-bold text-slate-400 uppercase mb-0.5">Pickup</p>
                      <p className="font-bold text-slate-900">{booking.rides.origin}</p>
                   </div>
                </div>
                <div className="relative z-10 flex gap-4 items-start">
                   <div className="w-3 h-3 bg-slate-900 rounded-sm ring-4 ring-white shadow-sm mt-1.5 shrink-0"></div>
                   <div>
                      <p className="text-xs font-bold text-slate-400 uppercase mb-0.5">Dropoff</p>
                      <p className="font-bold text-slate-900">{booking.rides.destination}</p>
                   </div>
                </div>
            </div>

            {/* Safety Actions */}
            <div className="grid grid-cols-2 gap-4">
               <button onClick={handleShare} className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition border border-slate-100">
                  <Share2 className="w-6 h-6 text-slate-900"/>
                  <span className="text-xs font-bold text-slate-600">Share Trip</span>
               </button>
               <button onClick={() => setSosModalOpen(true)} className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-red-50 hover:bg-red-100 transition border border-red-100">
                  <AlertTriangle className="w-6 h-6 text-red-600"/>
                  <span className="text-xs font-bold text-red-600">Emergency</span>
               </button>
            </div>
         </div>
      </div>

      {/* Modals */}
      {isChatOpen && currentUser && bookingId && (
        <ChatModal bookingId={bookingId} driverName={driver?.full_name || 'Driver'} currentUserId={currentUser.id} onClose={() => setIsChatOpen(false)} />
      )}

      {reviewModalOpen && bookingId && driver && (
        <ReviewModal rideId={booking.rides.id} driverId={driver.id} driverName={driver.full_name} driverAvatar={driver.avatar_url} onClose={() => setReviewModalOpen(false)} />
      )}

      <Modal isOpen={sosModalOpen} onClose={() => setSosModalOpen(false)} title="Emergency SOS">
        <div className="space-y-6 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Are you in danger?</h3>
            <p className="text-slate-600 text-sm">This will trigger an SOS alert and open the dialer for emergency services.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setSosModalOpen(false)} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition">Cancel</button>
            <button onClick={handleEmergency} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition">CALL SOS</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-white"><Loader2 className="animate-spin w-8 h-8 text-black"/></div>}>
      <TrackContent />
    </Suspense>
  );
}