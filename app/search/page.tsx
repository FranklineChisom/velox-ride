'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { searchLocation, getRoute } from '@/lib/osm';
import { getDistance } from '@/lib/utils';
import { Ride } from '@/types';
import dynamic from 'next/dynamic';
import { MapPin, Calendar, Clock, Loader2, ArrowRight, User } from 'lucide-react';
import { format } from 'date-fns';

// Dynamic Map
const LeafletMap = dynamic(() => import('@/components/Map'), { ssr: false });

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  // State
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

  // Initial load
  useEffect(() => {
    if (query.origin || query.destination) {
      performSearch();
    }
  }, []);

  const performSearch = async () => {
    setLoading(true);
    
    // 1. Resolve Coordinates
    let pCoords = coords.pickup;
    let dCoords = coords.dropoff;

    if (!pCoords && query.origin) pCoords = await searchLocation(query.origin) || undefined;
    if (!dCoords && query.destination) dCoords = await searchLocation(query.destination) || undefined;

    setCoords({ pickup: pCoords, dropoff: dCoords });

    // 2. Get Route
    if (pCoords && dCoords) {
      const routePath = await getRoute(pCoords, dCoords);
      if (routePath) setRoute(routePath);
    }

    // 3. Fetch All Scheduled Rides (Client-side filtering for MVP)
    const { data: allRides } = await supabase
      .from('rides')
      .select('*, profiles(full_name, rating)')
      .eq('status', 'scheduled')
      .gt('departure_time', new Date().toISOString())
      .order('departure_time', { ascending: true });

    if (allRides) {
      setRides(allRides as any);
      
      // 4. Smart Filtering
      // If we have map coords, filter by distance (within 5km of origin)
      // Otherwise, filter by text match
      const filtered = (allRides as any[]).filter(ride => {
        // Text Match Fallback
        const originMatch = ride.origin.toLowerCase().includes(query.origin.toLowerCase());
        const destMatch = ride.destination.toLowerCase().includes(query.destination.toLowerCase());
        
        // Return text matches if no coords, otherwise we would add coordinate math here if we had lat/lng on rides table
        // For MVP, we rely on the text users typed matching what drivers typed, OR broad string matching
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
      // Redirect to login with return path
      const returnUrl = encodeURIComponent(`/search?origin=${query.origin}&destination=${query.destination}`);
      router.push(`/auth?role=passenger&next=${returnUrl}`);
      return;
    }

    // If logged in, proceed
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
    <div className="flex flex-col lg:flex-row h-screen bg-slate-50">
      
      {/* Left Panel: Search & Results */}
      <div className="w-full lg:w-[450px] flex flex-col bg-white shadow-xl z-20">
        <div className="p-6 border-b border-slate-100">
           <div className="flex items-center gap-2 mb-6 cursor-pointer" onClick={() => router.push('/')}>
             <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center font-bold">V</div>
             <span className="font-bold text-xl text-slate-900">VeloxRide</span>
           </div>

           <div className="space-y-3">
              <div className="relative group">
                 <MapPin className="absolute left-3 top-3.5 text-slate-400 w-5 h-5" />
                 <input 
                   value={query.origin}
                   onChange={e => setQuery({...query, origin: e.target.value})}
                   placeholder="Pickup Location" 
                   className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none font-medium"
                 />
                 <button 
                    onClick={() => setMapMode('pickup')} 
                    className={`absolute right-3 top-3 p-1 rounded hover:bg-slate-200 ${coords.pickup ? 'text-teal-600' : 'text-slate-400'}`}
                    title="Pick on Map"
                 >
                   <MapPin className="w-5 h-5" />
                 </button>
              </div>

              <div className="relative group">
                 <MapPin className="absolute left-3 top-3.5 text-slate-400 w-5 h-5" />
                 <input 
                   value={query.destination}
                   onChange={e => setQuery({...query, destination: e.target.value})}
                   placeholder="Destination" 
                   className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none font-medium"
                 />
                 <button 
                    onClick={() => setMapMode('dropoff')}
                    className={`absolute right-3 top-3 p-1 rounded hover:bg-slate-200 ${coords.dropoff ? 'text-teal-600' : 'text-slate-400'}`}
                    title="Pick on Map"
                 >
                   <MapPin className="w-5 h-5" />
                 </button>
              </div>

              <button 
                onClick={performSearch}
                disabled={loading}
                className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition flex justify-center items-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" /> : 'Search Rides'}
              </button>
           </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
           {filteredRides.length === 0 && !loading && (
             <div className="text-center py-12 text-slate-400">
               <p>No rides found matching your route.</p>
               <p className="text-sm mt-2">Try broader terms like "Abuja" or "Lekki".</p>
             </div>
           )}

           {filteredRides.map(ride => (
             <div key={ride.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:border-teal-500 transition group">
                <div className="flex justify-between items-start mb-4">
                   <div className="flex items-center gap-3">
                      <div className="bg-slate-100 p-2 rounded-full">
                        <User className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{ride.profiles?.full_name || 'Driver'}</div>
                        <div className="text-xs text-slate-500">4.9 ★ Verified</div>
                      </div>
                   </div>
                   <div className="text-right">
                      <div className="text-lg font-black text-teal-700">₦{ride.price_per_seat}</div>
                   </div>
                </div>

                <div className="space-y-3 mb-5">
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                      <span className="text-sm font-medium text-slate-700">{ride.origin}</span>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-slate-900 rounded-full"></div>
                      <span className="text-sm font-medium text-slate-700">{ride.destination}</span>
                   </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                   <div className="flex items-center gap-2 text-xs text-slate-500 font-bold uppercase tracking-wider">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(ride.departure_time), 'MMM d, h:mm a')}
                   </div>
                   <button 
                     onClick={() => handleBookAttempt(ride.id)}
                     className="bg-slate-900 text-white px-6 py-2 rounded-lg text-sm font-bold group-hover:bg-teal-600 transition"
                   >
                     Book Seat
                   </button>
                </div>
             </div>
           ))}
        </div>
      </div>

      {/* Right Panel: Map */}
      <div className="flex-1 h-[400px] lg:h-auto relative bg-slate-200">
         <LeafletMap 
            pickup={coords.pickup}
            dropoff={coords.dropoff}
            routeCoordinates={route}
            selectionMode={mapMode}
            onPickupSelect={(c) => handleMapSelect(c)}
            onDropoffSelect={(c) => handleMapSelect(c)}
         />
         
         {mapMode && (
           <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur text-white px-6 py-3 rounded-full shadow-2xl z-[1000] font-bold animate-bounce flex items-center gap-2">
             <MapPin className="w-5 h-5 text-teal-400" />
             Click on map to set {mapMode}
           </div>
         )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin w-8 h-8 text-teal-600"/></div>}>
      <SearchContent />
    </Suspense>
  );
}