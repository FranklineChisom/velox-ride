'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { BookingWithRide, Coordinates } from '@/types';
import { Loader2, Phone, MessageSquare, ShieldCheck, MapPin, Navigation, Share2, AlertTriangle, ArrowLeft, Clock } from 'lucide-react'; // Added Clock
import { APP_CONFIG } from '@/lib/constants';
import { format, addMinutes } from 'date-fns';
import dynamic from 'next/dynamic';
import { getRoute } from '@/lib/osm';
import { useToast } from '@/components/ui/ToastProvider';

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
  
  const [booking, setBooking] = useState<BookingWithRide | null>(null);
  const [loading, setLoading] = useState(true);
  const [route, setRoute] = useState<[number, number][] | undefined>(undefined);
  const [coords, setCoords] = useState<{ pickup?: Coordinates; dropoff?: Coordinates; driver?: Coordinates }>({});
  const [eta, setEta] = useState<number>(15); // minutes
  const [status, setStatus] = useState('Finding route...');

  // Poll for booking updates (Real-time simulation)
  useEffect(() => {
    if (!bookingId) {
        router.push('/passenger/trips');
        return;
    }

    const fetchBooking = async () => {
      try {
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
          .eq('id', bookingId)
          .single();

        if (error) throw error;
        if (data) {
            setBooking(data as unknown as BookingWithRide);
            
            // In a real app, these coords would come from the DB columns
            // For now, I'm mocking coordinates based on Abuja/Lagos centers + random offset
            // You should add lat/lng columns to your 'rides' table for real data
            const mockPickup = { lat: 9.0765, lng: 7.3986 }; // Abuja Center
            const mockDropoff = { lat: 9.0565, lng: 7.4986 };
            // Simulate driver moving closer
            const mockDriver = { lat: 9.0700 + (Math.random() * 0.005), lng: 7.3900 + (Math.random() * 0.005) }; 

            setCoords({
                pickup: mockPickup,
                dropoff: mockDropoff,
                driver: mockDriver
            });

            // Get route path
            const path = await getRoute(mockPickup, mockDropoff);
            if (path) setRoute(path);
            
            setStatus('Driver is on the way');
        }
      } catch (e) {
        console.error(e);
        addToast('Error loading ride details', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
    // In production, use Supabase Realtime subscription here
    const interval = setInterval(fetchBooking, 30000); 
    return () => clearInterval(interval);
  }, [bookingId, supabase, router, addToast]);

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-white"><Loader2 className="w-8 h-8 animate-spin text-black"/></div>;
  if (!booking || !booking.rides) return null;

  const driver = (booking.rides as any).profiles;

  return (
    <div className="h-screen w-full relative flex flex-col md:flex-row bg-slate-50">
      
      {/* Map Layer (Mobile: Top, Desktop: Right) */}
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

      {/* Info Panel (Mobile: Bottom Sheet, Desktop: Left Sidebar) */}
      <div className="order-2 md:order-1 w-full md:w-[450px] bg-white shadow-2xl z-10 flex flex-col h-[50vh] md:h-screen animate-slide-up md:animate-none relative">
         {/* Desktop Header */}
         <div className="hidden md:flex p-6 border-b border-slate-100 items-center justify-between">
            <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-slate-50 text-slate-500 hover:text-black transition">
                <ArrowLeft className="w-5 h-5"/>
            </button>
            <h1 className="font-bold text-slate-900">Ride in Progress</h1>
            <div className="w-9"></div>
         </div>

         <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {/* Status Card */}
            <div className="bg-black text-white p-6 rounded-3xl relative overflow-hidden shadow-xl">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
               <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                     <div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Status</p>
                        <h2 className="text-2xl font-bold">{status}</h2>
                     </div>
                     <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2">
                        <Clock className="w-4 h-4"/>
                        <span className="font-bold text-sm">{eta} min</span>
                     </div>
                  </div>
                  <div className="w-full bg-white/20 h-1 rounded-full overflow-hidden">
                     <div className="bg-white h-full w-[45%] animate-pulse"></div>
                  </div>
                  <p className="text-right text-xs text-slate-400 mt-2">Arriving by {format(addMinutes(new Date(), eta), 'h:mm a')}</p>
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
                     {driver?.is_verified && (
                        <div className="absolute bottom-0 right-0 bg-white p-0.5 rounded-full">
                           <ShieldCheck className="w-4 h-4 text-green-500 fill-current"/>
                        </div>
                     )}
                  </div>
                  <div className="flex-1">
                     <h4 className="font-bold text-slate-900 text-lg">{driver?.full_name}</h4>
                     <p className="text-sm text-slate-500 font-medium">{driver?.vehicle_model} • {driver?.vehicle_plate}</p>
                  </div>
                  <div className="flex gap-2">
                     <button className="p-3 bg-white border border-slate-200 rounded-full hover:bg-slate-100 transition shadow-sm text-slate-900">
                        <MessageSquare className="w-5 h-5"/>
                     </button>
                     <button className="p-3 bg-black text-white rounded-full hover:bg-slate-800 transition shadow-lg">
                        <Phone className="w-5 h-5"/>
                     </button>
                  </div>
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
               <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition border border-slate-100">
                  <Share2 className="w-6 h-6 text-slate-900"/>
                  <span className="text-xs font-bold text-slate-600">Share Trip</span>
               </button>
               <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-red-50 hover:bg-red-100 transition border border-red-100">
                  <AlertTriangle className="w-6 h-6 text-red-600"/>
                  <span className="text-xs font-bold text-red-600">Emergency</span>
               </button>
            </div>

         </div>
      </div>
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