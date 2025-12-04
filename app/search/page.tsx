'use client';

import { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { getRoute } from '@/lib/osm';
import { Ride } from '@/types';
import dynamic from 'next/dynamic';
import { MapPin, Calendar, Loader2, User, ArrowLeft, Clock, Car, Navigation2, History, X } from 'lucide-react';
import { format } from 'date-fns';

// Dynamic import for Leaflet map to avoid SSR issues
const LeafletMap = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-gray-50 animate-pulse flex items-center justify-center text-slate-400">Loading Map...</div>
});

// Interface for Autocomplete Suggestions
interface Suggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface SearchHistoryItem {
  id: string;
  origin_name: string;
  destination_name: string;
  origin_lat: number;
  origin_lng: number;
  destination_lat: number;
  destination_lng: number;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  // --- State Management ---
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
  const [selectedRide, setSelectedRide] = useState<string | null>(null);

  // Autocomplete & History State
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [activeField, setActiveField] = useState<'origin' | 'destination' | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [recentSearches, setRecentSearches] = useState<SearchHistoryItem[]>([]);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // --- Effects ---

  // Load initial search if params exist
  useEffect(() => {
    if (query.origin && query.destination && !coords.pickup) {
      // If we have text but no coords (e.g. from URL), try to auto-resolve or just search text
      performSearch(false); 
    }
    fetchRecentSearches();
  }, []);

  // Update Route when both coords are set
  useEffect(() => {
    if (coords.pickup && coords.dropoff) {
      updateRoute();
    }
  }, [coords.pickup, coords.dropoff]);

  // --- Logic ---

  const fetchRecentSearches = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('search_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (data) setRecentSearches(data);
  };

  const updateRoute = async () => {
    if (!coords.pickup || !coords.dropoff) return;
    const path = await getRoute(coords.pickup, coords.dropoff);
    if (path) setRoute(path);
  };

  const fetchSuggestions = async (input: string) => {
    if (!input || input.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsTyping(true);
    try {
      // Using Nominatim for demo purposes. In production, consider Google Places API for better accuracy in Nigeria.
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

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 500); // 500ms debounce
  };

  const handleSuggestionSelect = (suggestion: Suggestion) => {
    if (!activeField) return;

    const newCoords = { lat: parseFloat(suggestion.lat), lng: parseFloat(suggestion.lon) };
    
    setQuery(prev => ({ ...prev, [activeField]: suggestion.display_name.split(',')[0] })); // Keep it short
    
    if (activeField === 'origin') {
      setCoords(prev => ({ ...prev, pickup: newCoords }));
    } else {
      setCoords(prev => ({ ...prev, dropoff: newCoords }));
    }

    setSuggestions([]);
    setActiveField(null);
  };

  const handleHistorySelect = (item: SearchHistoryItem) => {
    setQuery({ origin: item.origin_name, destination: item.destination_name });
    setCoords({
      pickup: { lat: item.origin_lat, lng: item.origin_lng },
      dropoff: { lat: item.destination_lat, lng: item.destination_lng }
    });
    setSuggestions([]);
    performSearch(false); // Re-run search logic
  };

  const saveSearchToHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !coords.pickup || !coords.dropoff) return;

    // Avoid saving duplicates purely by name for simplicity
    const { error } = await supabase.from('search_history').insert({
      user_id: user.id,
      origin_name: query.origin,
      origin_lat: coords.pickup.lat,
      origin_lng: coords.pickup.lng,
      destination_name: query.destination,
      destination_lat: coords.dropoff.lat,
      destination_lng: coords.dropoff.lng
    });
    
    if (!error) fetchRecentSearches();
  };

  const performSearch = async (shouldSaveHistory = true) => {
    setLoading(true);
    setSuggestions([]); // Clear any open suggestions
    
    // In a real app, you might want to force geocoding here if coords aren't set yet
    // For this demo, we assume coords are set via suggestions or map clicks for best accuracy,
    // fallback to string matching if strictly necessary.

    const { data: allRides } = await supabase
      .from('rides')
      .select('*, profiles(full_name)')
      .eq('status', 'scheduled')
      .gt('departure_time', new Date().toISOString())
      .order('departure_time', { ascending: true });

    if (allRides) {
      setRides(allRides as any);
      const filtered = (allRides as any[]).filter(ride => {
        // Advanced filtering could happen here (radius search using PostGIS is better for production)
        const originMatch = ride.origin.toLowerCase().includes(query.origin.toLowerCase());
        const destMatch = ride.destination.toLowerCase().includes(query.destination.toLowerCase());
        return originMatch || destMatch; 
      });
      setFilteredRides(filtered);
    }
    
    if (shouldSaveHistory && coords.pickup && coords.dropoff) {
      saveSearchToHistory();
    }

    setLoading(false);
  };

  const handleBookAttempt = async () => {
    if(!selectedRide) return;
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      const returnUrl = encodeURIComponent(`/search?origin=${query.origin}&destination=${query.destination}`);
      router.push(`/auth?role=passenger&next=${returnUrl}`);
      return;
    }

    const confirm = window.confirm('Confirm booking?');
    if (confirm) {
      const { error } = await supabase.from('bookings').insert({
        ride_id: selectedRide,
        passenger_id: user.id,
        seats_booked: 1
      });
      if (!error) alert('Booking Successful!');
      else alert(error.message);
    }
  };

  const handleMapSelect = (c: {lat: number, lng: number}) => {
      if(mapMode === 'pickup') {
          setCoords(prev => ({...prev, pickup: c}));
          setQuery(prev => ({...prev, origin: 'Pinned Location'}));
      } else if (mapMode === 'dropoff') {
          setCoords(prev => ({...prev, dropoff: c}));
          setQuery(prev => ({...prev, destination: 'Pinned Location'}));
      }
      setMapMode(null);
  }

  return (
    <div className="h-screen w-full relative bg-white overflow-hidden font-sans">
      
      {/* Map Background */}
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

      {/* Floating Left Panel */}
      <div className="absolute top-0 left-0 h-full w-full md:w-[480px] bg-white shadow-2xl z-10 flex flex-col animate-slide-right md:rounded-r-3xl md:m-0 border-r border-slate-100">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white z-20">
           <button onClick={() => router.push('/')} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition">
             <ArrowLeft className="w-5 h-5 text-slate-900" />
           </button>
           <h1 className="font-bold text-lg text-slate-900">Request a Ride</h1>
           <div className="w-9 h-9"></div> {/* Spacer */}
        </div>

        {/* Search Inputs Area */}
        <div className="p-6 bg-white z-20 shadow-sm relative">
           <div className="relative">
              {/* Connector Line */}
              <div className="absolute left-[27px] top-10 bottom-10 w-0.5 bg-gray-200 z-0"></div>
              
              {/* Origin Input */}
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

              {/* Destination Input */}
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

              {/* Autocomplete Dropdown */}
              {activeField && (suggestions.length > 0 || recentSearches.length > 0) && (
                <div className="absolute top-full left-0 w-full bg-white rounded-xl shadow-xl border border-gray-100 mt-2 overflow-hidden z-50 max-h-80 overflow-y-auto">
                  
                  {/* Suggestions List */}
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

                  {/* Recent Searches List (Only show if not typing new search) */}
                  {suggestions.length === 0 && recentSearches.length > 0 && !isTyping && (
                    <div className="py-2 bg-slate-50/50">
                      <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider flex justify-between items-center">
                        Recent
                        <History className="w-3 h-3" />
                      </div>
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
                  
                  {isTyping && suggestions.length === 0 && (
                    <div className="p-4 text-center text-gray-400 text-sm">Searching locations...</div>
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

        {/* Ride Options (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
           {filteredRides.length === 0 && !loading && (
             <div className="flex flex-col items-center justify-center h-full text-slate-400">
               <Navigation2 className="w-12 h-12 mb-4 opacity-20" />
               <p className="text-sm">Enter a route to see rides</p>
             </div>
           )}

           {filteredRides.map(ride => (
             <div 
                key={ride.id} 
                onClick={() => setSelectedRide(ride.id)}
                className={`p-4 rounded-xl border transition cursor-pointer flex items-center justify-between group ${selectedRide === ride.id ? 'border-black bg-slate-50 ring-1 ring-black' : 'border-gray-100 hover:border-gray-300'}`}
             >
                <div className="flex items-center gap-4">
                   <div className="w-16 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Car className="w-8 h-8 text-slate-700" />
                   </div>
                   <div>
                      <h4 className="font-bold text-slate-900 text-lg">Velox Share</h4>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                         <span className="flex items-center"><User className="w-3 h-3 mr-1"/> {ride.total_seats}</span>
                         <span>•</span>
                         <span>{format(new Date(ride.departure_time), 'h:mm a')}</span>
                         {ride.profiles?.full_name && <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">{ride.profiles.full_name.split(' ')[0]}</span>}
                      </div>
                   </div>
                </div>
                <div className="text-right">
                   <div className="text-lg font-bold text-slate-900">₦{ride.price_per_seat}</div>
                   <div className="text-xs text-slate-500 line-through">₦{Math.round(ride.price_per_seat * 1.4)}</div>
                </div>
             </div>
           ))}
        </div>

        {/* Bottom Action */}
        <div className="p-6 border-t border-gray-100 bg-white z-20">
           <div className="flex items-center justify-between mb-4 text-sm font-medium text-slate-600">
              <span className="flex items-center gap-2"><CreditCard className="w-4 h-4"/> Personal • Cash</span>
              <span className="text-black font-bold cursor-pointer hover:underline">Change</span>
           </div>
           <button 
             disabled={!selectedRide}
             onClick={handleBookAttempt}
             className="w-full bg-black disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-900 transition shadow-lg flex items-center justify-center"
           >
             Request Ride
           </button>
        </div>

      </div>

      {mapMode && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[100] bg-black text-white px-6 py-2.5 rounded-full font-bold shadow-xl animate-bounce flex items-center gap-3">
          <span>Tap map to set {mapMode} location</span>
          <button onClick={() => setMapMode(null)} className="bg-white/20 rounded-full p-1 hover:bg-white/30"><X className="w-3 h-3"/></button>
        </div>
      )}
    </div>
  );
}

function CreditCard(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-white"><Loader2 className="animate-spin w-8 h-8 text-black"/></div>}>
      <SearchContent />
    </Suspense>
  );
}