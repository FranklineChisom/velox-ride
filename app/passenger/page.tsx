'use client';
import { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { History, ArrowDown, X } from 'lucide-react';
import { APP_CONFIG } from '@/lib/constants';
import { usePassengerDashboard } from '@/hooks/usePassengerDashboard';
import { reverseGeocode } from '@/lib/osm';
import { useToast } from '@/components/ui/ToastProvider';
import { Coordinates } from '@/types';

// Components
import BookingWidget from '@/components/passenger/BookingWidget';
import StatCard from '@/components/ui/StatCard';

const LeafletMap = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => <div className="h-full bg-slate-100 rounded-3xl animate-pulse"></div>
});

export default function PassengerDashboard() {
  const { 
    loading, profile, wallet, stats, greeting, savedPlaces, recentSearches 
  } = usePassengerDashboard();
  
  const { addToast } = useToast();
  
  // Lifted Map State to coordinate between Map and Widget
  const [mapMode, setMapMode] = useState<'pickup' | 'dropoff' | null>(null);
  const [coords, setCoords] = useState<{ pickup?: Coordinates; dropoff?: Coordinates }>({});
  const [widgetQuery, setWidgetQuery] = useState({ origin: '', destination: '' });
  
  const bookingRef = useRef<HTMLDivElement>(null);

  const handleMapSelect = async (c: Coordinates) => {
    if (!mapMode) return;
    
    // 1. Update Coords
    const target = mapMode;
    setCoords(prev => ({ ...prev, [target]: c }));
    
    // 2. Resolve Address for Widget
    try {
      const address = await reverseGeocode(c.lat, c.lng);
      setWidgetQuery(prev => ({ 
        ...prev, 
        [target === 'pickup' ? 'origin' : 'destination']: address 
      }));
    } catch {
      addToast("Could not resolve address. Pin set.", 'info');
      setWidgetQuery(prev => ({ 
        ...prev, 
        [target === 'pickup' ? 'origin' : 'destination']: "Pinned Location" 
      }));
    }
    
    setMapMode(null);
  };

  const scrollToBooking = () => bookingRef.current?.scrollIntoView({ behavior: 'smooth' });

  if (loading) return null; // Or a skeleton loader handled by layout

  return (
    <div className="p-6 lg:p-10 space-y-8 pt-32 min-h-screen">
      
      {/* 1. Welcome Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-slate-900 text-white p-8 rounded-[2rem] relative overflow-hidden shadow-xl">
           <div className="relative z-10">
              <h1 className="text-3xl font-bold mb-2">{greeting}, {profile?.full_name?.split(' ')[0] || 'Traveler'}</h1>
              <p className="text-slate-400 mb-8">Ready for your next journey?</p>
              
              <div className="flex gap-4">
                 <button onClick={scrollToBooking} className="bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition flex items-center gap-2">
                    Book a Ride <ArrowDown className="w-4 h-4"/>
                 </button>
                 <Link href="/passenger/wallet" className="bg-slate-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-700 transition">
                    Add Funds
                 </Link>
              </div>
           </div>
           <div className="absolute right-0 bottom-0 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl -mr-10 -mb-10"></div>
        </div>

        <StatCard 
          label="Total Spent" 
          value={`${APP_CONFIG.currency}${stats.totalSpent.toLocaleString()}`} 
          subValue={`${stats.totalRides} Trips taken`}
          icon={History} 
          color="white"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* 2. Left Column: Booking Logic */}
        <div className="lg:col-span-1 space-y-6 flex flex-col h-full" ref={bookingRef}>
          <BookingWidget 
            savedPlaces={savedPlaces} 
            recentSearches={recentSearches}
            onMapPick={(mode) => setMapMode(mode)}
            coords={coords}
            setCoords={setCoords}
            externalQuery={widgetQuery}
            onLocationResolve={(field, val) => setWidgetQuery(prev => ({...prev, [field]: val}))}
          />
        </div>

        {/* 3. Right Column: Map Visualization */}
        <div className="lg:col-span-2 flex flex-col gap-6 relative">
          <div className="bg-slate-100 rounded-3xl overflow-hidden shadow-inner border border-slate-200 relative h-[600px]">
             <LeafletMap 
                pickup={coords.pickup}
                dropoff={coords.dropoff}
                selectionMode={mapMode}
                onPickupSelect={handleMapSelect}
                onDropoffSelect={handleMapSelect}
             />
             
             {mapMode && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] bg-black text-white px-6 py-2.5 rounded-full font-bold shadow-xl animate-bounce flex items-center gap-3">
                  <span>Tap map to set {mapMode === 'pickup' ? 'Pickup' : 'Dropoff'}</span>
                  <button onClick={() => setMapMode(null)} className="bg-white/20 rounded-full p-1 hover:bg-white/30 transition"><X className="w-3 h-3"/></button>
                </div>
             )}

             <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-lg z-[1000] flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">System Status</p>
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Operational
                  </div>
                </div>
                <div className="text-right">
                   <p className="text-xs font-bold text-slate-500 uppercase mb-1">Wallet Balance</p>
                   <p className="text-slate-900 font-bold text-lg">
                     {wallet ? `${wallet.currency}${Number(wallet.balance).toLocaleString()}` : '...'}
                   </p>
                </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}