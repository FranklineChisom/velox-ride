'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Coordinates, Message } from '@/types';
import { Loader2, Phone, MessageSquare, AlertTriangle, ArrowLeft, Clock, User, Share2, Shield, AlertOctagon, Lock } from 'lucide-react';
import dynamic from 'next/dynamic';
import { getRoute } from '@/lib/osm';
import { useToast } from '@/components/ui/ToastProvider';
import ChatModal from '@/components/ChatModal';
import Modal from '@/components/ui/Modal';

// Dynamically load map
const LeafletMap = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-100 animate-pulse flex items-center justify-center">Loading Map...</div>
});

function TrackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();
  const { addToast } = useToast();
  
  const bookingId = searchParams.get('booking_id');
  const [booking, setBooking] = useState<any>(null);
  const [coords, setCoords] = useState<{ pickup?: Coordinates; dropoff?: Coordinates; driver?: Coordinates }>({});
  const [route, setRoute] = useState<[number, number][] | undefined>(undefined);
  const [eta, setEta] = useState<string>('--');
  const [status, setStatus] = useState('Loading...');
  
  // OTP State (Simulated for this demo, usually from DB)
  const [otp, setOtp] = useState<string>('');

  // Modals
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    if (!bookingId) {
        router.push('/passenger/trips');
        return;
    }

    // Generate random 4-digit OTP if not exists (Safety Feature)
    setOtp(Math.floor(1000 + Math.random() * 9000).toString());

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if(user) setCurrentUser(user);

        const { data, error } = await supabase
            .from('bookings')
            .select(`*, rides(*, profiles(*))`)
            .eq('id', bookingId)
            .single();

        if (error || !data) {
            addToast('Could not load booking', 'error');
            return;
        }

        const ride = data.rides;
        setBooking(data);
        setStatus(ride.status === 'completed' ? 'Arrived' : ride.status === 'active' ? 'On Trip' : 'Driver En Route');

        if (ride) {
            const p = { lat: ride.origin_lat, lng: ride.origin_lng };
            const d = { lat: ride.destination_lat, lng: ride.destination_lng };
            const dr = (ride.current_lat && ride.current_lng) ? { lat: ride.current_lat, lng: ride.current_lng } : undefined;
            
            setCoords({ pickup: p, dropoff: d, driver: dr });
            const path = await getRoute(p, d);
            if(path) setRoute(path);
        }

        // Realtime
        const channel = supabase.channel(`tracking-${ride.id}`)
            .on(
                'postgres_changes', 
                { event: 'UPDATE', schema: 'public', table: 'rides', filter: `id=eq.${ride.id}` },
                (payload: any) => {
                    const newRide = payload.new;
                    if (newRide.current_lat) {
                        setCoords(prev => ({
                            ...prev, 
                            driver: { lat: newRide.current_lat, lng: newRide.current_lng }
                        }));
                    }
                    if (newRide.status !== ride.status) {
                        setStatus(newRide.status === 'completed' ? 'Arrived' : newRide.status === 'active' ? 'On Trip' : 'Scheduled');
                        if (newRide.status === 'completed') addToast('Trip Completed', 'success');
                    }
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    };

    fetchData();
  }, [bookingId]);

  const handleCall = () => {
      const phone = booking?.rides?.profiles?.phone_number;
      if (phone) window.open(`tel:${phone}`);
      else addToast('Driver phone hidden', 'error');
  };

  const handleShare = async () => {
      const text = `Track my ride on VeluxeRide: ${window.location.href}`;
      if (navigator.share) {
          await navigator.share({ title: 'My Ride', text, url: window.location.href });
      } else {
          navigator.clipboard.writeText(window.location.href);
          addToast('Link copied', 'success');
      }
  };

  if (!booking) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin w-8 h-8"/></div>;

  return (
    <div className="h-screen flex flex-col md:flex-row bg-white relative">
       
       {/* Map */}
       <div className="flex-1 relative order-1 md:order-2 h-[50vh] md:h-full">
          <div className="absolute top-4 left-4 z-[1000] md:hidden">
             <button onClick={() => router.back()} className="bg-white p-2 rounded-full shadow-lg border border-slate-100"><ArrowLeft className="w-5 h-5"/></button>
          </div>
          <LeafletMap 
             pickup={coords.pickup} 
             dropoff={coords.dropoff} 
             driverLocation={coords.driver} 
             routeCoordinates={route} 
             interactive={true}
          />
       </div>

       {/* Panel */}
       <div className="w-full md:w-[450px] bg-white h-[50vh] md:h-full z-10 shadow-2xl flex flex-col order-2 md:order-1 border-r border-slate-100">
          
          <div className="p-6 border-b border-slate-100 hidden md:flex justify-between items-center">
             <button onClick={() => router.back()} className="hover:bg-slate-100 p-2 rounded-full -ml-2 transition"><ArrowLeft className="w-5 h-5"/></button>
             <h2 className="font-bold text-slate-900">Live Tracking</h2>
             <div className="w-8"></div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
             
             {/* Status Badge */}
             <div className="bg-black text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
                <div className="relative z-10 flex justify-between items-start">
                   <div>
                      <p className="text-slate-400 text-xs font-bold uppercase mb-1">Status</p>
                      <h2 className="text-2xl font-bold">{status}</h2>
                   </div>
                   <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2">
                      <Clock className="w-4 h-4"/>
                      <span className="text-sm font-bold">{eta}</span>
                   </div>
                </div>
                
                {/* OTP Section - Safety First */}
                <div className="mt-6 p-4 bg-white/10 rounded-xl flex items-center justify-between backdrop-blur-sm border border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center font-bold text-lg"><Lock className="w-5 h-5"/></div>
                        <div>
                            <p className="text-xs text-slate-300 font-medium">Start Code</p>
                            <p className="text-sm font-bold">Give to driver</p>
                        </div>
                    </div>
                    <span className="text-3xl font-mono font-bold tracking-widest text-white">{otp}</span>
                </div>
             </div>

             {/* Driver Info */}
             <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-14 h-14 bg-slate-200 rounded-full overflow-hidden">
                   {booking.rides.profiles.avatar_url ? (
                      <img src={booking.rides.profiles.avatar_url} className="w-full h-full object-cover"/>
                   ) : <User className="w-6 h-6 text-slate-400 m-auto mt-4"/>}
                </div>
                <div className="flex-1">
                   <h3 className="font-bold text-slate-900">{booking.rides.profiles.full_name}</h3>
                   <p className="text-xs text-slate-500 font-bold uppercase">{booking.rides.profiles.vehicle_model} • {booking.rides.profiles.vehicle_plate}</p>
                </div>
                <div className="flex gap-2">
                   <button onClick={() => setIsChatOpen(true)} className="p-3 bg-white border border-slate-200 rounded-full hover:bg-slate-100 transition"><MessageSquare className="w-5 h-5"/></button>
                   <button onClick={handleCall} className="p-3 bg-black text-white rounded-full hover:bg-slate-800 transition"><Phone className="w-5 h-5"/></button>
                </div>
             </div>

             {/* Safety Actions */}
             <div className="grid grid-cols-2 gap-4 pt-2">
                <button onClick={handleShare} className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl transition group">
                   <Share2 className="w-6 h-6 text-slate-700 group-hover:scale-110 transition"/>
                   <span className="text-xs font-bold text-slate-600">Share Trip</span>
                </button>
                <button onClick={() => setIsSOSOpen(true)} className="flex flex-col items-center justify-center gap-2 p-4 bg-red-50 hover:bg-red-100 rounded-2xl transition group border border-red-100">
                   <AlertOctagon className="w-6 h-6 text-red-600 group-hover:scale-110 transition"/>
                   <span className="text-xs font-bold text-red-700">Emergency</span>
                </button>
             </div>
          </div>
       </div>

       {isChatOpen && currentUser && (
          <ChatModal 
            bookingId={bookingId} 
            driverName={booking.rides.profiles.full_name} 
            currentUserId={currentUser.id} 
            onClose={() => setIsChatOpen(false)} 
          />
       )}

       {/* Enhanced SOS Modal */}
       <Modal isOpen={isSOSOpen} onClose={() => setIsSOSOpen(false)} title="Safety Toolkit">
          <div className="space-y-4">
             <div className="p-4 bg-red-50 rounded-xl border border-red-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center shrink-0"><AlertTriangle className="w-6 h-6 text-red-600"/></div>
                <div>
                    <h4 className="font-bold text-red-900">Emergency 112</h4>
                    <p className="text-xs text-red-700">Call local police immediately.</p>
                </div>
                <button onClick={() => window.open('tel:112')} className="ml-auto bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold">Call</button>
             </div>
             
             <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center shrink-0"><Shield className="w-6 h-6 text-slate-600"/></div>
                <div>
                    <h4 className="font-bold text-slate-900">Veluxe Safety Line</h4>
                    <p className="text-xs text-slate-600">24/7 Support for urgent issues.</p>
                </div>
                <button className="ml-auto bg-black text-white px-4 py-2 rounded-lg text-sm font-bold">Call</button>
             </div>

             <div className="text-center pt-2">
                <button onClick={() => setIsSOSOpen(false)} className="text-slate-400 font-bold hover:text-black">Dismiss</button>
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