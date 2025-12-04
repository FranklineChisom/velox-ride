'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { getRoute, reverseGeocode } from '@/lib/osm';
import { RideWithDriver, Suggestion, SearchHistoryItem, Coordinates } from '@/types';
import dynamic from 'next/dynamic';
// Added CreditCard to imports
import { MapPin, Loader2, User, ArrowLeft, Clock, Car, Navigation2, History, X, Search, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/ToastProvider';

const LeafletMap = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-50 animate-pulse flex items-center justify-center text-slate-400">Loading Map...</div>
});

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();
  const { addToast } = useToast();

  const [query, setQuery] = useState({
    origin: searchParams.get('origin') || '',
    destination: searchParams.get('destination') || ''
  });
  
  const [coords, setCoords] = useState<{ pickup?: Coordinates; dropoff?: Coordinates; }>({});
  const [mapMode, setMapMode] = useState<'pickup' | 'dropoff' | null>(null);
  const [rides, setRides] = useState<RideWithDriver[]>([]);
  const [filteredRides, setFilteredRides] = useState<RideWithDriver[]>([]);
  const [loading, setLoading] = useState(false);
  const [route, setRoute] = useState<[number, number][] | undefined>(undefined);
  const [selectedRide, setSelectedRide] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [activeField, setActiveField] = useState<'origin' | 'destination' | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [recentSearches, setRecentSearches] = useState<SearchHistoryItem[]>([]);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Initialize Search coordinates if names are provided in URL
  useEffect(() => {
    const initCoords = async () => {
      const pUrl = searchParams.get('origin');
      const dUrl = searchParams.get('destination');
      if (pUrl && !coords.pickup) {
         try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(pUrl)}&limit=1`);
            const data = await res.json();
            if(data[0]) setCoords(prev => ({...prev, pickup: { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }}));
         } catch(e) {}
      }
      if (dUrl && !coords.dropoff) {
         try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(dUrl)}&limit=1`);
            const data = await res.json();
            if(data[0]) setCoords(prev => ({...prev, dropoff: { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }}));
         } catch(e) {}
      }
    };
    initCoords();
    performSearch(false);
    fetchRecentSearches();
  }, []);

  useEffect(() => {
    if (coords.pickup && coords.dropoff) {
      getRoute(coords.pickup, coords.dropoff).then(path => {
        if(path) setRoute(path);
      });
    }
  }, [coords.pickup, coords.dropoff]);

  const fetchRecentSearches = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('search_history').select('*').order('created_at', { ascending: false }).limit(5);
    if (data) setRecentSearches(data);
  };

  const fetchSuggestions = async (input: string) => {
    if (!input || input.length < 3) {
      setSuggestions([]);
      return;
    }
    setIsTyping(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(input)}&countrycodes=ng&limit=5`);
      const data = await res.json();
      setSuggestions(data);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleInputChange = (field: 'origin' | 'destination', value: string) => {
    setQuery(prev => ({ ...prev, [field]: value }));
    setActiveField(field);
    // Reset specific coordinate when typing
    if (field === 'origin') setCoords(prev => ({ ...prev, pickup: undefined }));
    else setCoords(prev => ({ ...prev, dropoff: undefined }));
    setRoute(undefined);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => { fetchSuggestions(value); }, 500);
  };

  const handleSuggestionSelect = (suggestion: Suggestion) => {
    if (!activeField) return;
    const newCoords = { lat: parseFloat(suggestion.lat), lng: parseFloat(suggestion.lon) };
    const displayName = suggestion.display_name.split(',')[0];
    setQuery(prev => ({ ...prev, [activeField]: displayName }));
    if (activeField === 'origin') setCoords(prev => ({ ...prev, pickup: newCoords }));
    else setCoords(prev => ({ ...prev, dropoff: newCoords }));
    setSuggestions([]);
    setActiveField(null);
  };

  const handleHistorySelect = (item: SearchHistoryItem) => {
    setQuery({ origin: item.origin_name || '', destination: item.destination_name });
    if(item.origin_lat && item.origin_lng && item.destination_lat && item.destination_lng){
        setCoords({
            pickup: { lat: item.origin_lat, lng: item.origin_lng },
            dropoff: { lat: item.destination_lat, lng: item.destination_lng }
        });
    }
    setSuggestions([]);
    performSearch(false);
  };

  const performSearch = async (shouldSaveHistory = true) => {
    setLoading(true);
    setSuggestions([]);
    
    try {
        const now = new Date();
        now.setHours(now.getHours() - 2); 
        const isoDate = now.toISOString();

        const { data: allRides, error } = await supabase
        .from('rides')
        .select(`
            *,
            profiles (
                full_name,
                phone_number,
                is_verified,
                avatar_url
            )
        `)
        .eq('status', 'scheduled')
        .gt('departure_time', isoDate)
        .order('departure_time', { ascending: true });

        if (error) throw error;

        if (allRides) {
            const typedRides = allRides as unknown as RideWithDriver[];
            setRides(typedRides);
            
            const filtered = typedRides.filter(ride => {
                if (!query.origin && !query.destination) return true;
                const qOrigin = query.origin.toLowerCase().trim();
                const qDest = query.destination.toLowerCase().trim();
                const originMatch = !qOrigin || ride.origin.toLowerCase().includes(qOrigin);
                const destMatch = !qDest || ride.destination.toLowerCase().includes(qDest);
                return originMatch && destMatch; 
            });
            setFilteredRides(filtered);
        }
        
    } catch (err: any) {
        console.error('SEARCH ERROR:', err);
        addToast("Failed to search rides", 'error');
    } finally {
        setLoading(false);
    }
  };

  const handleBookRedirect = () => {
    if(!selectedRide) return;
    router.push(`/booking?ride_id=${selectedRide}`);
  };

  const handleMapSelect = async (c: Coordinates) => {
      const currentMode = mapMode;
      setMapMode(null);
      if(!currentMode) return;

      if(currentMode === 'pickup') {
          setCoords(prev => ({...prev, pickup: c}));
          setQuery(prev => ({...prev, origin: 'Fetching...'}));
      } else if (mapMode === 'dropoff') {
          setCoords(prev => ({...prev, dropoff: c}));
          setQuery(prev => ({...prev, destination: 'Fetching...'}));
      }

      try {
        const address = await reverseGeocode(c.lat, c.lng);
        setQuery(prev => ({...prev, [currentMode === 'pickup' ? 'origin' : 'destination']: address}));
      } catch (e) {
        setQuery(prev => ({...prev, [currentMode === 'pickup' ? 'origin' : 'destination']: "Pinned Location"}));
      }
  }

  return (
    <div className="h-screen w-full relative bg-white overflow-hidden font-sans">
      <div className="absolute inset-0 z-0">
         <LeafletMap 
            pickup={coords.pickup}
            dropoff={coords.dropoff}
            routeCoordinates={route}
            selectionMode={mapMode}
            onPickupSelect={handleMapSelect}
            onDropoffSelect={handleMapSelect}
         />
      </div>

      <div className="absolute top-0 left-0 h-full w-full md:w-[480px] bg-white shadow-2xl z-10 flex flex-col animate-slide-right md:rounded-r-3xl md:m-0 border-r border-slate-100">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white z-20">
           <button onClick={() => router.push('/')} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition">
             <ArrowLeft className="w-5 h-5 text-slate-900" />
           </button>
           <h1 className="font-bold text-lg text-slate-900">Request a Ride</h1>
           <div className="w-9 h-9"></div> 
        </div>

        <div className="p-6 bg-white z-20 shadow-sm relative">
           <div className="relative">
              <div className="absolute left-[27px] top-10 bottom-10 w-0.5 bg-gray-200 z-0"></div>
              
              <div className="mb-4 relative z-10">
                 <div className="absolute left-4 top-3.5 w-2.5 h-2.5 bg-black rounded-full shadow-[0_0_0_4px_white]"></div>
                 <input 
                   value={query.origin}
                   onFocus={() => setActiveField('origin')}
                   onChange={(e) => handleInputChange('origin', e.target.value)}
                   placeholder="Pickup location"
                   className="w-full bg-slate-50 p-3.5 pl-12 rounded-xl font-medium text-slate-900 outline-none focus:ring-2 focus:ring-black transition"
                 />
                 <button onClick={() => setMapMode('pickup')} className="absolute right-3 top-3 p-1 text-slate-400 hover:text-black" title="Pick on map">
                   <MapPin className="w-5 h-5"/>
                 </button>
              </div>

              <div className="relative z-10">
                 <div className="absolute left-4 top-3.5 w-2.5 h-2.5 bg-slate-900 rounded-sm shadow-[0_0_0_4px_white]"></div>
                 <input 
                   value={query.destination}
                   onFocus={() => setActiveField('destination')}
                   onChange={(e) => handleInputChange('destination', e.target.value)}
                   placeholder="Where to?"
                   className="w-full bg-slate-50 p-3.5 pl-12 rounded-xl font-medium text-slate-900 outline-none focus:ring-2 focus:ring-black transition"
                 />
                 <button onClick={() => setMapMode('dropoff')} className="absolute right-3 top-3 p-1 text-slate-400 hover:text-black" title="Pick on map">
                   <MapPin className="w-5 h-5"/>
                 </button>
              </div>

              {activeField && (suggestions.length > 0 || recentSearches.length > 0) && (
                <div className="absolute top-full left-0 w-full bg-white rounded-xl shadow-xl border border-gray-100 mt-2 overflow-hidden z-50 max-h-80 overflow-y-auto">
                  {suggestions.length > 0 && (
                    <div className="py-2">
                      <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Suggestions</div>
                      {suggestions.map((item) => (
                        <div 
                          key={item.place_id}
                          onClick={() => handleSuggestionSelect(item)}
                          className="px-4 py-3 hover:bg-slate-50 cursor-pointer flex items-center gap-3 border-b border-gray-50 last:border-0"
                        >
                          <div className="p-2 bg-slate-100 rounded-full"><MapPin className="w-4 h-4 text-slate-600"/></div>
                          <p className="text-sm font-medium text-slate-700 truncate">{item.display_name}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {suggestions.length === 0 && recentSearches.length > 0 && !isTyping && (
                    <div className="py-2 bg-slate-50/50">
                      <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider flex justify-between items-center">Recent <History className="w-3 h-3" /></div>
                      {recentSearches.map((item) => (
                        <div 
                          key={item.id}
                          onClick={() => handleHistorySelect(item)}
                          className="px-4 py-3 hover:bg-slate-100 cursor-pointer flex items-center gap-3"
                        >
                          <div className="p-2 bg-white border border-gray-200 rounded-full"><Clock className="w-4 h-4 text-slate-600"/></div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{item.destination_name}</p>
                            <p className="text-xs text-slate-500">From: {item.origin_name}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
           </div>
           
           <button 
             onClick={() => performSearch(true)}
             className="w-full mt-4 bg-black text-white py-3.5 rounded-xl font-bold hover:bg-slate-800 transition shadow-lg flex items-center justify-center gap-2"
           >
             {loading ? <Loader2 className="animate-spin" /> : 'Search Rides'}
           </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
           {filteredRides.length === 0 && !loading && (
             <div className="flex flex-col items-center justify-center h-full text-slate-400">
               <Navigation2 className="w-12 h-12 mb-4 opacity-20" />
               <p className="text-sm">No scheduled rides found for this route.</p>
               <button onClick={() => performSearch(false)} className="mt-2 text-xs font-bold text-black underline">Refresh all rides</button>
             </div>
           )}

           {filteredRides.map(ride => (
             <div 
                key={ride.id} 
                onClick={() => setSelectedRide(ride.id)}
                className={`p-4 rounded-xl border transition cursor-pointer flex items-center justify-between group bg-white shadow-sm hover:shadow-md ${selectedRide === ride.id ? 'border-black ring-1 ring-black' : 'border-gray-100'}`}
             >
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-700">
                      {ride.profiles?.full_name?.[0] || <User className="w-5 h-5"/>}
                   </div>
                   <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900">{ride.profiles?.full_name?.split(' ')[0]}</h4>
                        {ride.profiles?.is_verified && <div className="w-2 h-2 bg-green-500 rounded-full" title="Verified Driver"></div>}
                      </div>
                      <div className="flex flex-col text-xs text-slate-500 mt-1">
                         <div className="flex items-center gap-2 font-medium">
                            <span className="text-black">{format(new Date(ride.departure_time), 'h:mm a')}</span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                            <span>{format(new Date(ride.departure_time), 'MMM dd')}</span>
                         </div>
                         <div className="flex items-center gap-1 mt-1 truncate max-w-[150px]">
                            {ride.origin} <ArrowLeft className="w-3 h-3 rotate-180 inline"/> {ride.destination}
                         </div>
                      </div>
                   </div>
                </div>
                <div className="text-right">
                   <div className="text-lg font-bold text-slate-900">₦{ride.price_per_seat}</div>
                   <div className="text-xs text-slate-500">{ride.total_seats} seats</div>
                </div>
             </div>
           ))}
        </div>

        <div className="p-6 border-t border-gray-100 bg-white z-20">
           <div className="flex items-center justify-between mb-4 text-sm font-medium text-slate-600">
              <span className="flex items-center gap-2"><CreditCard className="w-4 h-4"/> Personal • Cash</span>
              <span className="text-black font-bold cursor-pointer hover:underline">Change</span>
           </div>
           <button 
             disabled={!selectedRide}
             onClick={handleBookRedirect}
             className="w-full bg-black disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-900 transition shadow-lg flex items-center justify-center"
           >
             Review Booking
           </button>
        </div>
      </div>

      {mapMode && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[100] bg-black text-white px-6 py-2.5 rounded-full font-bold shadow-xl animate-bounce flex items-center gap-3">
          <span>Tap map to set {mapMode === 'pickup' ? 'Pickup' : 'Dropoff'}</span>
          <button onClick={() => setMapMode(null)} className="bg-white/20 rounded-full p-1 hover:bg-white/30"><X className="w-3 h-3"/></button>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-white"><Loader2 className="animate-spin w-8 h-8 text-black"/></div>}>
      <SearchContent />
    </Suspense>
  );
}