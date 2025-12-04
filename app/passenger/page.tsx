'use client';
import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase';
import { APP_CONFIG } from '@/lib/constants';
import { MapPin, Search, Home as HomeIcon, Briefcase, User, Star, ArrowRight, Loader2, Navigation, History, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Suggestion, SearchHistoryItem, Coordinates } from '@/types';
import { getRoute } from '@/lib/osm';

// Load map dynamically
const LeafletMap = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-100 animate-pulse rounded-3xl flex items-center justify-center text-slate-400">Loading Map...</div>
});

export default function PassengerHome() {
  const supabase = createClient();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [greeting, setGreeting] = useState('');

  // Search & Map State
  const [query, setQuery] = useState({ origin: '', destination: '' });
  const [coords, setCoords] = useState<{ pickup?: Coordinates; dropoff?: Coordinates }>({});
  const [mapMode, setMapMode] = useState<'pickup' | 'dropoff' | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [activeField, setActiveField] = useState<'origin' | 'destination' | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [recentSearches, setRecentSearches] = useState<SearchHistoryItem[]>([]);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [route, setRoute] = useState<[number, number][] | undefined>(undefined);

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserProfile(user);
        fetchRecentSearches(user.id);
      } else {
        router.push('/auth?role=passenger');
      }
    };
    
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    getProfile();

    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setActiveField(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [router, supabase]);

  useEffect(() => {
    if (coords.pickup && coords.dropoff) {
      updateRoute();
    }
  }, [coords.pickup, coords.dropoff]);

  const fetchRecentSearches = async (userId: string) => {
    const { data } = await supabase
      .from('search_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3);
    
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
    }, 500);
  };

  const handleSuggestionSelect = (suggestion: Suggestion) => {
    if (!activeField) return;

    const newCoords = { lat: parseFloat(suggestion.lat), lng: parseFloat(suggestion.lon) };
    
    setQuery(prev => ({ ...prev, [activeField]: suggestion.display_name.split(',')[0] }));
    
    if (activeField === 'origin') {
      setCoords(prev => ({ ...prev, pickup: newCoords }));
    } else {
      setCoords(prev => ({ ...prev, dropoff: newCoords }));
    }

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
    setActiveField(null);
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await res.json();
        const address = data.display_name.split(',')[0];
        
        setQuery(prev => ({ ...prev, origin: address }));
        setCoords(prev => ({ ...prev, pickup: { lat: latitude, lng: longitude } }));
      } catch (error) {
        alert("Unable to fetch address details.");
      } finally {
        setLoadingLocation(false);
      }
    }, () => {
      setLoadingLocation(false);
      alert("Unable to retrieve your location.");
    });
  };

  const handleMapSelect = (c: Coordinates) => {
    if(mapMode === 'pickup') {
        setCoords(prev => ({...prev, pickup: c}));
        setQuery(prev => ({...prev, origin: 'Pinned Location'}));
    } else if (mapMode === 'dropoff') {
        setCoords(prev => ({...prev, dropoff: c}));
        setQuery(prev => ({...prev, destination: 'Pinned Location'}));
    }
    setMapMode(null);
  }

  const handleSearchRedirect = () => {
    if (!query.origin || !query.destination) return;
    const params = new URLSearchParams();
    params.append('origin', query.origin);
    params.append('destination', query.destination);
    router.push(`/search?${params.toString()}`);
  };

  return (
    // Increased top padding to pt-40 (160px) to clear the navbar
    <div className="p-6 lg:p-10 space-y-8 mt-16 md:mt-20 min-h-screen">
      
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {/* Reduced text size on mobile to prevent wrapping/crowding */}
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{greeting}, {userProfile?.user_metadata?.full_name?.split(' ')[0] || 'Traveler'}</h1>
          <p className="text-slate-500 mt-1 text-sm md:text-base">Ready for your next journey?</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-2 pr-6 rounded-full border border-slate-100 shadow-sm w-fit hidden md:flex">
          <div className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Passenger</div>
            <div className="flex items-center gap-1 font-bold text-sm">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span>4.9</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Col: Search & Actions */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Integrated Search Widget */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative z-20" ref={wrapperRef}>
             <h2 className="text-xl font-bold text-slate-900 mb-4">Book a Ride</h2>
             
             <div className="relative">
                <div className="absolute left-[19px] top-10 bottom-10 w-0.5 bg-gray-200 z-0"></div>
                
                {/* Origin Input */}
                <div className="mb-4 relative z-10">
                   <div className="absolute left-3 top-3.5 w-2.5 h-2.5 bg-black rounded-full shadow-[0_0_0_4px_white]"></div>
                   <input 
                     value={query.origin}
                     onFocus={() => setActiveField('origin')}
                     onChange={(e) => handleInputChange('origin', e.target.value)}
                     placeholder="Pickup location"
                     className="w-full bg-slate-50 p-3 pl-10 rounded-xl font-medium text-slate-900 outline-none focus:ring-2 focus:ring-black transition text-sm"
                   />
                   <div className="absolute right-2 top-2 flex gap-1">
                     <button onClick={handleCurrentLocation} className="p-1.5 text-slate-400 hover:text-black hover:bg-slate-200 rounded-lg transition" title="Use current location">
                        {loadingLocation ? <Loader2 className="w-4 h-4 animate-spin"/> : <Navigation className="w-4 h-4" />}
                     </button>
                     <button onClick={() => setMapMode('pickup')} className="p-1.5 text-slate-400 hover:text-black hover:bg-slate-200 rounded-lg transition" title="Pick on map">
                       <MapPin className="w-4 h-4"/>
                     </button>
                   </div>
                </div>

                {/* Destination Input */}
                <div className="relative z-10">
                   <div className="absolute left-3 top-3.5 w-2.5 h-2.5 bg-slate-900 rounded-sm shadow-[0_0_0_4px_white]"></div>
                   <input 
                     value={query.destination}
                     onFocus={() => setActiveField('destination')}
                     onChange={(e) => handleInputChange('destination', e.target.value)}
                     placeholder="Where to?"
                     className="w-full bg-slate-50 p-3 pl-10 rounded-xl font-medium text-slate-900 outline-none focus:ring-2 focus:ring-black transition text-sm"
                   />
                   <button onClick={() => setMapMode('dropoff')} className="absolute right-3 top-2 p-1.5 text-slate-400 hover:text-black hover:bg-slate-200 rounded-lg transition" title="Pick on map">
                     <MapPin className="w-4 h-4"/>
                   </button>
                </div>

                {/* Autocomplete Dropdown */}
                {activeField && (suggestions.length > 0 || recentSearches.length > 0) && (
                  <div className="absolute top-full left-0 w-full bg-white rounded-xl shadow-xl border border-gray-100 mt-2 overflow-hidden z-50 max-h-60 overflow-y-auto">
                    {suggestions.length > 0 ? (
                      <div className="py-2">
                        <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Suggestions</div>
                        {suggestions.map((item) => (
                          <div 
                            key={item.place_id}
                            onClick={() => handleSuggestionSelect(item)}
                            className="px-4 py-3 hover:bg-slate-50 cursor-pointer flex items-center gap-3 border-b border-gray-50 last:border-0"
                          >
                            <div className="p-1.5 bg-slate-100 rounded-full"><MapPin className="w-3 h-3 text-slate-600"/></div>
                            <p className="text-sm font-medium text-slate-700 truncate">{item.display_name}</p>
                          </div>
                        ))}
                      </div>
                    ) : !isTyping && recentSearches.length > 0 && (
                      <div className="py-2 bg-slate-50/50">
                        <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                          <History className="w-3 h-3" /> Recent
                        </div>
                        {recentSearches.map((item) => (
                          <div 
                            key={item.id} 
                            onClick={() => handleHistorySelect(item)}
                            className="px-4 py-3 hover:bg-slate-100 cursor-pointer flex items-center gap-3 transition"
                          >
                            <div className="p-1.5 bg-white border border-slate-200 rounded-full"><History className="w-3 h-3 text-slate-400"/></div>
                            <span className="font-bold text-slate-800 text-sm truncate">{item.destination_name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
             </div>
             
             <button 
               onClick={handleSearchRedirect}
               disabled={!query.origin || !query.destination}
               className="w-full mt-4 bg-black disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold hover:bg-slate-800 transition shadow-lg flex items-center justify-center gap-2"
             >
               Find Rides <ArrowRight className="w-4 h-4" />
             </button>
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wider">Favorites</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition group border border-transparent hover:border-slate-100">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 group-hover:bg-white group-hover:shadow-sm">
                  <HomeIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">Home</div>
                  <div className="text-xs text-slate-400">Add address</div>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition group border border-transparent hover:border-slate-100">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 group-hover:bg-white group-hover:shadow-sm">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">Work</div>
                  <div className="text-xs text-slate-400">Add address</div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Col: Map & Activity - Fixed height map container */}
        <div className="lg:col-span-2 flex flex-col gap-6 relative">
          <div className="bg-slate-100 rounded-3xl overflow-hidden shadow-inner border border-slate-200 relative h-[600px]">
             <LeafletMap 
                pickup={coords.pickup}
                dropoff={coords.dropoff}
                routeCoordinates={route}
                selectionMode={mapMode}
                onPickupSelect={handleMapSelect}
                onDropoffSelect={handleMapSelect}
             />
             
             {mapMode && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] bg-black text-white px-6 py-2.5 rounded-full font-bold shadow-xl animate-bounce flex items-center gap-3">
                  <span>Tap map to set {mapMode}</span>
                  <button onClick={() => setMapMode(null)} className="bg-white/20 rounded-full p-1 hover:bg-white/30"><X className="w-3 h-3"/></button>
                </div>
             )}

             <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-lg z-[1000] flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Status</p>
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    System Online
                  </div>
                </div>
                <div className="text-right">
                   <p className="text-xs font-bold text-slate-500 uppercase mb-1">Balance</p>
                   <p className="text-slate-900 font-bold text-lg">{APP_CONFIG.currency}0.00</p>
                </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}