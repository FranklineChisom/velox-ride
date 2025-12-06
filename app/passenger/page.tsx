'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { 
  ShieldCheck, Car, Briefcase, Home, Clock, Star, Gift, ChevronRight, Navigation 
} from 'lucide-react';
import { APP_CONFIG } from '@/lib/constants';
import { usePassengerDashboard } from '@/hooks/usePassengerDashboard';
import { reverseGeocode } from '@/lib/osm';
import { useToast } from '@/components/ui/ToastProvider';
import { Coordinates } from '@/types';
import { format } from 'date-fns';

// Components
import BookingWidget from '@/components/passenger/BookingWidget';

const LeafletMap = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-100 animate-pulse flex items-center justify-center text-slate-400">Loading Map...</div>
});

export default function PassengerDashboard() {
  const { 
    loading, profile, wallet, stats, greeting, savedPlaces, recentSearches, activeBooking, upcomingBooking 
  } = usePassengerDashboard();
  
  const { addToast } = useToast();
  
  // Map State
  const [mapMode, setMapMode] = useState<'pickup' | 'dropoff' | null>(null);
  const [coords, setCoords] = useState<{ pickup?: Coordinates; dropoff?: Coordinates }>({});
  const [widgetQuery, setWidgetQuery] = useState({ origin: '', destination: '' });
  const [ghostDrivers, setGhostDrivers] = useState<Coordinates[]>([]);

  // 1. Ghost Drivers Logic (Simulate Liquidity)
  useEffect(() => {
    const center = APP_CONFIG.defaultCenter;
    const ghosts = Array.from({ length: 5 }).map(() => ({
      lat: center.lat + (Math.random() - 0.5) * 0.03,
      lng: center.lng + (Math.random() - 0.5) * 0.03
    }));
    setGhostDrivers(ghosts);

    const interval = setInterval(() => {
      setGhostDrivers(prev => prev.map(g => ({
        lat: g.lat + (Math.random() - 0.5) * 0.0005,
        lng: g.lng + (Math.random() - 0.5) * 0.0005
      })));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // 2. Handle Shortcuts (Home/Work)
  const handleShortcut = (type: 'home' | 'work') => {
    const place = savedPlaces.find(p => p.label.toLowerCase() === type);
    if (place) {
        setWidgetQuery(prev => ({ ...prev, destination: place.address }));
        setCoords(prev => ({ ...prev, dropoff: { lat: place.lat, lng: place.lng } }));
        addToast(`Destination set to ${type}`, 'success');
    } else {
        addToast(`No ${type} address saved. Add it in settings.`, 'info');
    }
  };

  const handleMapSelect = async (c: Coordinates) => {
    if (!mapMode) return;
    const target = mapMode;
    setCoords(prev => ({ ...prev, [target]: c }));
    try {
      const address = await reverseGeocode(c.lat, c.lng);
      setWidgetQuery(prev => ({ 
        ...prev, 
        [target === 'pickup' ? 'origin' : 'destination']: address 
      }));
    } catch {
      setWidgetQuery(prev => ({ 
        ...prev, 
        [target === 'pickup' ? 'origin' : 'destination']: "Pinned Location" 
      }));
    }
    setMapMode(null);
  };

  if (loading) return null;

  return (
    <div className="h-[calc(100vh-80px)] relative overflow-hidden flex flex-col lg:flex-row">
      
      {/* Sidebar Area */}
      <div className="w-full lg:w-[480px] bg-white h-full z-20 flex flex-col shadow-2xl relative order-2 lg:order-1 border-r border-slate-100">
         <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
            
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{greeting}, {profile?.full_name?.split(' ')[0]}</h1>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <ShieldCheck className="w-3 h-3 text-green-600"/>
                        <span>Verified Account</span>
                    </div>
                </div>
                {/* Wallet Pill */}
                <Link href="/passenger/wallet" className="bg-slate-100 px-3 py-1.5 rounded-full flex items-center gap-2 hover:bg-slate-200 transition">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
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
                <p className="text-xs font-bold text-slate-400 uppercase mb-3 px-1">Quick Access</p>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => handleShortcut('home')} className="bg-blue-50 p-4 rounded-2xl flex flex-col items-start gap-3 hover:bg-blue-100 transition border border-blue-100 text-left">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600"><Home className="w-4 h-4"/></div>
                        <div>
                            <span className="font-bold text-blue-900 text-sm block">Home</span>
                            <span className="text-[10px] text-blue-600/80 line-clamp-1">{savedPlaces.find(p => p.label.toLowerCase() === 'home')?.address || 'Tap to save'}</span>
                        </div>
                    </button>
                    <button onClick={() => handleShortcut('work')} className="bg-orange-50 p-4 rounded-2xl flex flex-col items-start gap-3 hover:bg-orange-100 transition border border-orange-100 text-left">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600"><Briefcase className="w-4 h-4"/></div>
                        <div>
                            <span className="font-bold text-orange-900 text-sm block">Work</span>
                            <span className="text-[10px] text-orange-600/80 line-clamp-1">{savedPlaces.find(p => p.label.toLowerCase() === 'work')?.address || 'Tap to save'}</span>
                        </div>
                    </button>
                </div>
            </div>

            {/* Recent Places */}
            {recentSearches.length > 0 && (
                <div className="space-y-3">
                    <p className="text-xs font-bold text-slate-400 uppercase px-1">Recent Destinations</p>
                    <div className="space-y-1">
                        {recentSearches.slice(0, 3).map((item) => (
                            <button 
                                key={item.id}
                                onClick={() => {
                                    setWidgetQuery(prev => ({ ...prev, destination: item.destination_name }));
                                    // Normally we would also need coords, but widget handles text search too
                                }}
                                className="w-full flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition group text-left"
                            >
                                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-black group-hover:text-white transition">
                                    <Clock className="w-4 h-4"/>
                                </div>
                                <div className="flex-1 border-b border-slate-50 pb-2 group-hover:border-transparent transition">
                                    <p className="font-bold text-slate-700 text-sm truncate">{item.destination_name}</p>
                                    <p className="text-[10px] text-slate-400">{format(new Date(item.created_at), 'MMM dd')}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Rewards Teaser (Passive) */}
            <div className="bg-gradient-to-br from-slate-100 to-slate-200 p-6 rounded-3xl relative overflow-hidden opacity-80 grayscale-[0.5]">
               <div className="relative z-10">
                  <span className="bg-black/10 text-black text-[9px] font-bold px-2 py-1 rounded mb-2 inline-block">COMING SOON</span>
                  <h3 className="font-bold text-slate-900 mb-1 flex items-center gap-2"><Gift className="w-4 h-4"/> Velox Rewards</h3>
                  <p className="text-xs text-slate-600">Earn points for every km you travel. Redeem for free rides and partner perks.</p>
               </div>
               <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12">
                  <Star className="w-24 h-24"/>
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
               ghostDrivers={ghostDrivers}
            />
         </div>

         {/* Selection Mode Overlay */}
         {mapMode && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] bg-black text-white px-6 py-3 rounded-full font-bold shadow-2xl animate-bounce flex items-center gap-3 cursor-pointer hover:bg-slate-900 transition" onClick={() => setMapMode(null)}>
               <span>Tap map to set {mapMode === 'pickup' ? 'Pickup' : 'Dropoff'}</span>
            </div>
         )}
      </div>

    </div>
  );
}