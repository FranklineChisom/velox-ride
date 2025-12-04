'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { searchLocation, getRoute } from '@/lib/osm';
import { Ride } from '@/types';
import dynamic from 'next/dynamic';
import { MapPin, Calendar, Loader2, User } from 'lucide-react';
import { format } from 'date-fns';

const LeafletMap = dynamic(() => import('@/components/Map'), { ssr: false });

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const [query, setQuery] = useState({
    origin: searchParams.get('origin') || '',
    destination: searchParams.get('destination') || ''
  });
  
  const [coords, setCoords] = useState<{
    pickup?: { lat: number; lng: number };
    dropoff?: { lat: number; lng: number };
  }>({});

  const [mapMode, setMapMode] = useState<'pickup' | 'dropoff' | null>(null);
  const [rides, setRides] = useState<Ride[]>([]);
  const [filteredRides, setFilteredRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(false);
  const [route, setRoute] = useState<[number, number][] | undefined>(undefined);

  useEffect(() => {
    if (query.origin || query.destination) {
      performSearch();
    }
  }, []);

  const performSearch = async () => {
    setLoading(true);
    
    let pCoords = coords.pickup;
    let dCoords = coords.dropoff;

    if (!pCoords && query.origin) pCoords = await searchLocation(query.origin) || undefined;
    if (!dCoords && query.destination) dCoords = await searchLocation(query.destination) || undefined;

    setCoords({ pickup: pCoords, dropoff: dCoords });

    if (pCoords && dCoords) {
      const routePath = await getRoute(pCoords, dCoords);
      if (routePath) setRoute(routePath);
    }

    const { data: allRides } = await supabase
      .from('rides')
      .select('*, profiles(full_name)')
      .eq('status', 'scheduled')
      .gt('departure_time', new Date().toISOString())
      .order('departure_time', { ascending: true });

    if (allRides) {
      setRides(allRides as any);
      const filtered = (allRides as any[]).filter(ride => {
        const originMatch = ride.origin.toLowerCase().includes(query.origin.toLowerCase());
        const destMatch = ride.destination.toLowerCase().includes(query.destination.toLowerCase());
        return originMatch || destMatch; 
      });
      setFilteredRides(filtered);
    }
    
    setLoading(false);
  };

  const handleMapSelect = async (selectedCoords: { lat: number; lng: number }) => {
    if (mapMode === 'pickup') {
      setCoords(prev => ({ ...prev, pickup: selectedCoords }));
      setQuery(prev => ({ ...prev, origin: 'Pinned Location' }));
    } else if (mapMode === 'dropoff') {
      setCoords(prev => ({ ...prev, dropoff: selectedCoords }));
      setQuery(prev => ({ ...prev, destination: 'Pinned Location' }));
    }
    setMapMode(null);
  };

  const handleBookAttempt = async (rideId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      const returnUrl = encodeURIComponent(`/search?origin=${query.origin}&destination=${query.destination}`);
      router.push(`/auth?role=passenger&next=${returnUrl}`);
      return;
    }

    const confirm = window.confirm('Confirm booking?');
    if (confirm) {
      const { error } = await supabase.from('bookings').insert({
        ride_id: rideId,
        passenger_id: user.id,
        seats_booked: 1
      });
      if (!error) alert('Booking Successful!');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-velox-midnight">
      
      {/* Left Panel */}
      <div className="w-full lg:w-[450px] flex flex-col bg-velox-navy shadow-2xl z-20 border-r border-white/5">
        <div className="p-6 border-b border-white/5">
           <div className="flex items-center gap-2 mb-6 cursor-pointer" onClick={() => router.push('/')}>
             <div className="w-8 h-8 bg-velox-gold text-velox-midnight rounded-lg flex items-center justify-center font-bold">V</div>
             <span className="font-bold text-xl text-white">VeloxRide</span>
           </div>

           <div className="space-y-4">
              <div className="relative group">
                 <MapPin className="absolute left-3 top-3.5 text-gray-500 w-5 h-5" />
                 <input 
                   value={query.origin}
                   onChange={e => setQuery({...query, origin: e.target.value})}
                   placeholder="Pickup Location" 
                   className="w-full pl-10 pr-10 py-3 bg-velox-midnight border border-white/10 rounded-xl focus:ring-1 focus:ring-velox-gold outline-none font-medium text-white placeholder-gray-600"
                 />
                 <button 
                    onClick={() => setMapMode('pickup')} 
                    className={`absolute right-3 top-3 p-1 rounded hover:bg-white/10 ${coords.pickup ? 'text-velox-gold' : 'text-gray-500'}`}
                 >
                   <MapPin className="w-5 h-5" />
                 </button>
              </div>

              <div className="relative group">
                 <MapPin className="absolute left-3 top-3.5 text-gray-500 w-5 h-5" />
                 <input 
                   value={query.destination}
                   onChange={e => setQuery({...query, destination: e.target.value})}
                   placeholder="Destination" 
                   className="w-full pl-10 pr-10 py-3 bg-velox-midnight border border-white/10 rounded-xl focus:ring-1 focus:ring-velox-gold outline-none font-medium text-white placeholder-gray-600"
                 />
                 <button 
                    onClick={() => setMapMode('dropoff')}
                    className={`absolute right-3 top-3 p-1 rounded hover:bg-white/10 ${coords.dropoff ? 'text-velox-gold' : 'text-gray-500'}`}
                 >
                   <MapPin className="w-5 h-5" />
                 </button>
              </div>

              <button 
                onClick={performSearch}
                disabled={loading}
                className="w-full bg-white text-velox-midnight py-4 rounded-xl font-bold hover:bg-gray-200 transition flex justify-center items-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" /> : 'Search Rides'}
              </button>
           </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-velox-midnight">
           {filteredRides.length === 0 && !loading && (
             <div className="text-center py-12 text-gray-600">
               <p>No rides found matching your route.</p>
               <p className="text-sm mt-2">Try broader terms like "Abuja" or "Lekki".</p>
             </div>
           )}

           {filteredRides.map(ride => (
             <div key={ride.id} className="bg-velox-navy p-5 rounded-2xl border border-white/5 hover:border-velox-gold/30 transition group">
                <div className="flex justify-between items-start mb-4">
                   <div className="flex items-center gap-3">
                      <div className="bg-white/5 p-2 rounded-full">
                        <User className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <div className="font-bold text-white">{ride.profiles?.full_name || 'Driver'}</div>
                        <div className="text-xs text-velox-gold">4.9 ★ Verified</div>
                      </div>
                   </div>
                   <div className="text-right">
                      <div className="text-lg font-black text-white">₦{ride.price_per_seat}</div>
                   </div>
                </div>

                <div className="space-y-2 mb-5">
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-velox-gold rounded-full"></div>
                      <span className="text-sm font-medium text-gray-300">{ride.origin}</span>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                      <span className="text-sm font-medium text-gray-300">{ride.destination}</span>
                   </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                   <div className="flex items-center gap-2 text-xs text-gray-500 font-bold uppercase tracking-wider">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(ride.departure_time), 'MMM d, h:mm a')}
                   </div>
                   <button 
                     onClick={() => handleBookAttempt(ride.id)}
                     className="bg-velox-gold text-velox-midnight px-6 py-2 rounded-lg text-sm font-bold hover:bg-yellow-400 transition"
                   >
                     Book Seat
                   </button>
                </div>
             </div>
           ))}
        </div>
      </div>

      {/* Right Panel: Map */}
      <div className="flex-1 h-[400px] lg:h-auto relative bg-velox-midnight">
         <LeafletMap 
            pickup={coords.pickup}
            dropoff={coords.dropoff}
            routeCoordinates={route}
            selectionMode={mapMode}
            onPickupSelect={(c) => handleMapSelect(c)}
            onDropoffSelect={(c) => handleMapSelect(c)}
         />
         
         {mapMode && (
           <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-velox-navy/90 backdrop-blur text-white px-6 py-3 rounded-full border border-velox-gold/50 z-[1000] font-bold animate-bounce flex items-center gap-2">
             <MapPin className="w-5 h-5 text-velox-gold" />
             Click on map to set {mapMode}
           </div>
         )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-velox-midnight"><Loader2 className="animate-spin w-8 h-8 text-velox-gold"/></div>}>
      <SearchContent />
    </Suspense>
  );
}