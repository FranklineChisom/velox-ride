'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { 
  Briefcase, Home, Clock, ChevronRight, Navigation, 
  MapPin, Gift
} from 'lucide-react';
import { APP_CONFIG } from '@/lib/constants';
import { usePassengerDashboard } from '@/hooks/usePassengerDashboard';
import { reverseGeocode, getRoute } from '@/lib/osm';
import { useToast } from '@/components/ui/ToastProvider';
import { Coordinates, Profile } from '@/types';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

// Components
import BookingWidget from '@/components/passenger/BookingWidget';

const LeafletMap = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-100 animate-pulse flex items-center justify-center text-slate-400">Loading Map...</div>
});

export default function PassengerDashboard() {
  const { 
    loading, profile, wallet, savedPlaces, recentSearches, activeBooking, refresh 
  } = usePassengerDashboard();
  
  const { addToast } = useToast();
  const router = useRouter();
  const supabase = createClient();
  
  // Map State
  const [mapMode, setMapMode] = useState<'pickup' | 'dropoff' | null>(null);
  const [coords, setCoords] = useState<{ pickup?: Coordinates; dropoff?: Coordinates }>({});
  const [widgetQuery, setWidgetQuery] = useState({ origin: '', destination: '' });
  const [activeDrivers, setActiveDrivers] = useState<Coordinates[]>([]); // REAL DRIVERS
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][] | undefined>(undefined);

  // Context State
  const [commuteContext, setCommuteContext] = useState<{ label: string } | null>(null);

  useEffect(() => { refresh(); }, [refresh]);

  // 1. Fetch Real Active Drivers
  useEffect(() => {
    const fetchDrivers = async () => {
      // Get drivers who are online and verified
      const { data } = await supabase
        .from('profiles')
        .select('current_lat, current_lng')
        .eq('role', 'driver')
        .eq('is_online', true)
        .eq('is_verified', true)
        .not('current_lat', 'is', null)
        .not('current_lng', 'is', null);

      if (data) {
        const driverCoords = data.map(d => ({ lat: d.current_lat!, lng: d.current_lng! }));
        setActiveDrivers(driverCoords);
      }
    };

    fetchDrivers();
    // Real-time subscription for driver movement
    const channel = supabase.channel('online-drivers')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: "role=eq.driver" }, (payload) => {
         const newProfile = payload.new as Profile;
         if (newProfile.is_online && newProfile.current_lat && newProfile.current_lng) {
             fetchDrivers(); // Refresh list on update
         }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  // 2. Commute Context (Simplified to avoid fake traffic data)
  useEffect(() => {
    const hour = new Date().getHours();
    const isMorning = hour < 12;
    const targetLabel = isMorning ? 'work' : 'home';
    const place = savedPlaces.find(p => p.label.toLowerCase() === targetLabel);

    if (place) {
        setCommuteContext({ label: targetLabel === 'work' ? 'Work' : 'Home' });
    }
  }, [savedPlaces]);

  // 3. Route Calculation
  useEffect(() => {
    const fetchRoute = async () => {
        if (coords.pickup && coords.dropoff) {
            const path = await getRoute(coords.pickup, coords.dropoff);
            if (path) setRouteCoordinates(path);
        } else {
            setRouteCoordinates(undefined);
        }
    };
    fetchRoute();
  }, [coords.pickup, coords.dropoff]);

  const handleShortcut = (type: 'home' | 'work') => {
    const place = savedPlaces.find(p => p.label.toLowerCase() === type);
    if (place) {
        setWidgetQuery(prev => ({ ...prev, destination: place.address }));
        setCoords(prev => ({ ...prev, dropoff: { lat: place.lat, lng: place.lng } }));
        addToast(`Destination set to ${type}`, 'success');
    } else {
        addToast(`No ${type} address saved. Add it in settings.`, 'info');
        router.push('/passenger/settings');
    }
  };

  const handleRepeatRide = (item: any) => {
      setWidgetQuery({ origin: item.origin_name || 'Current Location', destination: item.destination_name });
      addToast('Locations pre-filled', 'info');
  };

  const handleMapSelect = async (c: Coordinates) => {
    if (!mapMode) return;
    const target = mapMode;
    setCoords(prev => ({ ...prev, [target]: c }));
    try {
      const address = await reverseGeocode(c.lat, c.lng);
      setWidgetQuery(prev => ({ ...prev, [target === 'pickup' ? 'origin' : 'destination']: address }));
    } catch {
      setWidgetQuery(prev => ({ ...prev, [target === 'pickup' ? 'origin' : 'destination']: "Pinned Location" }));
    }
    setMapMode(null);
  };

  if (loading) return <div className="h-screen w-full bg-white"></div>;

  return (
    <div className="h-[calc(100vh-80px)] relative overflow-hidden flex flex-col lg:flex-row">
      
      {/* Sidebar Area */}
      <div className="w-full lg:w-[480px] bg-white h-full z-20 flex flex-col shadow-2xl relative order-2 lg:order-1 border-r border-slate-100">
         <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
            
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Good Morning, {profile?.full_name?.split(' ')[0]}</h1>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Ready to move?</p>
                </div>
                <Link href="/passenger/wallet" className="bg-slate-100 px-3 py-1.5 rounded-full flex items-center gap-2 hover:bg-slate-200 transition group">
                    <div className="w-2 h-2 bg-green-500 rounded-full group-hover:animate-pulse"></div>
                    <span className="text-xs font-bold text-slate-900">{wallet ? `${APP_CONFIG.currency}${Number(wallet.balance).toLocaleString()}` : '...'}</span>
                </Link>
            </div>

            {/* Active Ride Card (High Priority) */}
            {activeBooking && activeBooking.rides && (
                <div className="bg-black text-white p-5 rounded-3xl relative overflow-hidden shadow-lg animate-fade-in group cursor-pointer">
                    <Link href={`/passenger/track?booking_id=${activeBooking.id}`} className="absolute inset-0 z-20"></Link>
                    <div className="relative z-10">
                        <div className="flex justify-between items-center mb-4">
                            <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> {activeBooking.rides.status === 'active' ? 'On Trip' : 'Driver En Route'}
                            </span>
                            <ChevronRight className="w-4 h-4 text-white/50 group-hover:text-white transition"/>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                                <Navigation className="w-5 h-5"/>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">Heading to</p>
                                <p className="font-bold text-lg truncate w-48">{activeBooking.rides.destination}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Commute Insight Card */}
            {!activeBooking && commuteContext && (
                <div onClick={() => handleShortcut(commuteContext.label.toLowerCase() as 'home'|'work')} className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-100 cursor-pointer hover:shadow-md transition flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-xl text-blue-600 shadow-sm">
                           {commuteContext.label === 'Work' ? <Briefcase className="w-4 h-4"/> : <Home className="w-4 h-4"/>}
                        </div>
                        <div>
                            <p className="text-xs font-bold text-blue-900 uppercase tracking-wider">Commute to {commuteContext.label}</p>
                            <p className="text-sm text-slate-600 font-medium">Tap to set destination</p>
                        </div>
                    </div>
                    <div className="bg-white p-1.5 rounded-full text-slate-400"><ChevronRight className="w-4 h-4"/></div>
                </div>
            )}

            {/* Booking Widget */}
            <BookingWidget 
              savedPlaces={savedPlaces} 
              recentSearches={recentSearches}
              onMapPick={(mode) => setMapMode(mode)}
              coords={coords}
              setCoords={setCoords}
              externalQuery={widgetQuery}
              onLocationResolve={(field, val) => setWidgetQuery(prev => ({...prev, [field]: val}))}
              isMapSelecting={!!mapMode}
            />

            {/* Quick Access Grid */}
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase mb-3 px-1">Saved Places</p>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => handleShortcut('home')} className="bg-slate-50 p-4 rounded-2xl flex flex-col items-start gap-3 hover:bg-slate-100 transition border border-slate-100 text-left group">
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-600 shadow-sm group-hover:scale-110 transition"><Home className="w-4 h-4"/></div>
                        <div>
                            <span className="font-bold text-slate-900 text-sm block">Home</span>
                            <span className="text-[10px] text-slate-500 line-clamp-1">{savedPlaces.find(p => p.label.toLowerCase() === 'home')?.address || 'Set Address'}</span>
                        </div>
                    </button>
                    <button onClick={() => handleShortcut('work')} className="bg-slate-50 p-4 rounded-2xl flex flex-col items-start gap-3 hover:bg-slate-100 transition border border-slate-100 text-left group">
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-600 shadow-sm group-hover:scale-110 transition"><Briefcase className="w-4 h-4"/></div>
                        <div>
                            <span className="font-bold text-slate-900 text-sm block">Work</span>
                            <span className="text-[10px] text-slate-500 line-clamp-1">{savedPlaces.find(p => p.label.toLowerCase() === 'work')?.address || 'Set Address'}</span>
                        </div>
                    </button>
                </div>
            </div>

            {/* Recent / Repeat Rides */}
            {recentSearches.length > 0 && (
                <div className="space-y-3">
                    <p className="text-xs font-bold text-slate-400 uppercase px-1">Recent Trips</p>
                    <div className="space-y-1">
                        {recentSearches.slice(0, 3).map((item) => (
                            <button 
                                key={item.id}
                                onClick={() => handleRepeatRide(item)}
                                className="w-full flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition group text-left border border-transparent hover:border-slate-100"
                            >
                                <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-black group-hover:text-white transition shrink-0">
                                    <Clock className="w-4 h-4"/>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <p className="font-bold text-slate-900 text-sm truncate">{item.destination_name}</p>
                                    </div>
                                    <p className="text-[10px] text-slate-400 truncate">From: {item.origin_name || 'Current Location'}</p>
                                </div>
                                <div className="p-2 bg-slate-50 rounded-full opacity-0 group-hover:opacity-100 transition">
                                    <ChevronRight className="w-4 h-4 text-slate-400"/>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Invite/Rewards Section - Replaced placeholder with simple referral UI */}
            <div className="bg-indigo-600 p-6 rounded-3xl relative overflow-hidden shadow-lg">
               <div className="relative z-10 text-white">
                  <h3 className="font-bold text-lg mb-1">Invite Friends</h3>
                  <p className="text-xs text-indigo-100 opacity-90 max-w-[80%] mb-3">Share the love. Get discounted rides when your friends sign up.</p>
                  <button onClick={() => addToast('Referral link copied', 'success')} className="bg-white/20 hover:bg-white/30 text-xs font-bold px-3 py-1.5 rounded-lg transition backdrop-blur-md">Launching Soon!</button>
               </div>
               <div className="absolute -right-6 -bottom-6 text-white opacity-10 rotate-12">
                  <Gift className="w-32 h-32"/>
               </div>
            </div>

         </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 h-[40vh] lg:h-full relative order-1 lg:order-2 bg-slate-100">
         <div className="absolute inset-0 z-0">
            <LeafletMap 
               pickup={coords.pickup}
               dropoff={coords.dropoff}
               selectionMode={mapMode}
               onPickupSelect={handleMapSelect}
               onDropoffSelect={handleMapSelect}
               driverLocation={activeDrivers.length > 0 ? activeDrivers[0] : undefined} // Show one active driver for now or use clustering in future
               ghostDrivers={activeDrivers.length > 1 ? activeDrivers.slice(1) : []} // Show others as ghosts/markers
               routeCoordinates={routeCoordinates} 
            />
         </div>
         {mapMode && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] bg-black text-white px-6 py-3 rounded-full font-bold shadow-2xl animate-bounce flex items-center gap-3 cursor-pointer hover:bg-slate-900 transition" onClick={() => setMapMode(null)}>
               <span>Tap map to set {mapMode === 'pickup' ? 'Pickup' : 'Dropoff'}</span>
            </div>
         )}
      </div>
    </div>
  );
}