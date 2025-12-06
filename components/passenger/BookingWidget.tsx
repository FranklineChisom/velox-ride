'use client';
import { useState, useRef, useEffect } from 'react';
import { 
  MapPin, Loader2, Navigation, Calendar, Clock, 
  ArrowRight, ArrowUpDown, Briefcase, Home, Info
} from 'lucide-react';
import { Suggestion, SearchHistoryItem, Coordinates, SavedPlace, VehicleClass } from '@/types';
import { reverseGeocode, getDrivingStats } from '@/lib/osm';
import { calculateFare } from '@/lib/pricing';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/ToastProvider';
import { APP_CONFIG } from '@/lib/constants';

interface BookingWidgetProps {
  savedPlaces: SavedPlace[];
  recentSearches: SearchHistoryItem[];
  onMapPick: (mode: 'pickup' | 'dropoff') => void;
  coords: { pickup?: Coordinates; dropoff?: Coordinates };
  setCoords: (coords: { pickup?: Coordinates; dropoff?: Coordinates }) => void;
  onLocationResolve: (field: 'origin' | 'destination', name: string) => void;
  externalQuery: { origin: string; destination: string };
  isMapSelecting: boolean;
}

export default function BookingWidget({ 
  savedPlaces, 
  recentSearches, 
  onMapPick,
  coords,
  setCoords,
  onLocationResolve,
  externalQuery,
  isMapSelecting
}: BookingWidgetProps) {
  
  const router = useRouter();
  const { addToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'schedule' | 'now'>('schedule');
  const [query, setQuery] = useState({ origin: '', destination: '' });
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  
  const [activeField, setActiveField] = useState<'origin' | 'destination' | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [loadingLoc, setLoadingLoc] = useState(false);
  
  // Dynamic Pricing State
  const [estimatedFare, setEstimatedFare] = useState<number | null>(null);
  const [calculatingFare, setCalculatingFare] = useState(false);
  
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Initialize date/time
  useEffect(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    now.setMinutes(Math.ceil(now.getMinutes() / 30) * 30);
    setDate(now.toISOString().split('T')[0]);
    setTime(now.toTimeString().slice(0, 5));
  }, []);

  // Sync with external map queries
  useEffect(() => {
    setQuery(prev => ({
      origin: externalQuery.origin || prev.origin,
      destination: externalQuery.destination || prev.destination
    }));
  }, [externalQuery]);

  // Real-time Fare Calculation
  useEffect(() => {
    const calculate = async () => {
        if (coords.pickup && coords.dropoff) {
            setCalculatingFare(true);
            const stats = await getDrivingStats(coords.pickup, coords.dropoff);
            if (stats) {
                const price = calculateFare(stats); // Default multiplier 1
                setEstimatedFare(price);
            }
            setCalculatingFare(false);
        } else {
            setEstimatedFare(null);
        }
    };
    calculate();
  }, [coords.pickup, coords.dropoff]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setActiveField(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = async (input: string) => {
    if (!input || input.length < 3) { setSuggestions([]); return; }
    setIsTyping(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(input)}&countrycodes=ng&limit=5`);
      const data = await res.json();
      setSuggestions(data);
    } catch (error) { console.error(error); } finally { setIsTyping(false); }
  };

  const handleInputChange = (field: 'origin' | 'destination', value: string) => {
    setQuery(prev => ({ ...prev, [field]: value }));
    if (field === 'origin') setCoords({ ...coords, pickup: undefined });
    else setCoords({ ...coords, dropoff: undefined });
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => fetchSuggestions(value), 500);
  };

  const handleSuggestionSelect = (item: Suggestion) => {
    if (!activeField) return;
    const name = item.display_name.split(',')[0];
    const newCoords = { lat: parseFloat(item.lat), lng: parseFloat(item.lon) };
    setQuery(prev => ({ ...prev, [activeField]: name }));
    if (activeField === 'origin') setCoords({ ...coords, pickup: newCoords });
    else setCoords({ ...coords, dropoff: newCoords });
    onLocationResolve(activeField, name);
    setActiveField(null);
    setSuggestions([]);
  };

  const handleSavedPlaceSelect = (place: SavedPlace) => {
      if (!activeField) return;
      setQuery(prev => ({ ...prev, [activeField]: place.address }));
      setCoords(prev => ({ ...prev, [activeField === 'origin' ? 'pickup' : 'dropoff']: { lat: place.lat, lng: place.lng } }));
      setActiveField(null);
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) { addToast("Geolocation disabled", 'error'); return; }
    setLoadingLoc(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      try {
        const address = await reverseGeocode(latitude, longitude);
        setQuery(prev => ({ ...prev, origin: address }));
        setCoords({ ...coords, pickup: { lat: latitude, lng: longitude } });
        onLocationResolve('origin', address);
      } catch { addToast("Could not locate you", 'error'); } finally { setLoadingLoc(false); }
    }, () => { setLoadingLoc(false); addToast("Permission denied", 'error'); });
  };

  const handleSwap = () => {
    setQuery(prev => ({ origin: prev.destination, destination: prev.origin }));
    setCoords({ pickup: coords.dropoff, dropoff: coords.pickup });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.origin || !query.destination) {
      addToast("Please fill both locations", 'error');
      return;
    }
    const params = new URLSearchParams();
    params.append('origin', query.origin);
    params.append('destination', query.destination);
    
    if (activeTab === 'schedule') {
      params.append('date', date);
      params.append('time', time);
      params.append('mode', 'scheduled');
    } else {
      // Ride Now
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().slice(0, 5); // HH:mm
      params.append('date', dateStr);
      params.append('time', timeStr);
      params.append('mode', 'instant');
      
      // Pass coordinates to Booking Page to avoid re-fetching
      if (coords.pickup) {
          params.append('pickup_lat', coords.pickup.lat.toString());
          params.append('pickup_lng', coords.pickup.lng.toString());
      }
      if (coords.dropoff) {
          params.append('dropoff_lat', coords.dropoff.lat.toString());
          params.append('dropoff_lng', coords.dropoff.lng.toString());
      }
    }
    router.push(`/search?${params.toString()}`);
  };

  const Dropdown = () => (
    <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-slide-up max-h-60 overflow-y-auto">
        {isTyping ? <div className="p-3 text-center text-xs text-slate-400 flex justify-center gap-2"><Loader2 className="w-3 h-3 animate-spin"/> Searching...</div> : (
            <>
                {suggestions.length === 0 && !isTyping && savedPlaces.length > 0 && (
                    <div className="p-2 border-b border-slate-50">
                        <p className="px-2 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider">Saved Places</p>
                        {savedPlaces.map(place => (
                            <div key={place.id} onClick={() => handleSavedPlaceSelect(place)} className="px-2 py-2 hover:bg-slate-50 cursor-pointer flex items-center gap-3 rounded-lg group transition">
                                <div className="bg-blue-50 p-1.5 rounded-full text-blue-600 group-hover:bg-blue-100 transition">{place.label.toLowerCase().includes('home') ? <Home className="w-3 h-3"/> : <Briefcase className="w-3 h-3"/>}</div>
                                <span className="text-xs font-bold text-slate-700">{place.label}</span>
                            </div>
                        ))}
                    </div>
                )}
                <div className="py-1">
                    {suggestions.map(item => (
                        <div key={item.place_id} onClick={() => handleSuggestionSelect(item)} className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer flex items-center gap-3 border-b border-slate-50 last:border-0 group transition">
                            <div className="bg-slate-100 p-1.5 rounded-full text-slate-400 group-hover:text-black group-hover:bg-slate-200 transition"><MapPin className="w-3 h-3"/></div>
                            <div className="overflow-hidden"><p className="text-xs font-bold text-slate-900 truncate">{item.display_name.split(',')[0]}</p><p className="text-[9px] text-slate-500 truncate">{item.display_name}</p></div>
                        </div>
                    ))}
                </div>
            </>
        )}
    </div>
  );

  return (
    <div className="bg-white p-5 rounded-3xl shadow-float border border-slate-100 relative z-20 w-full max-w-md" ref={wrapperRef}>
      
      <div className="flex gap-4 mb-5 border-b border-slate-100 pb-2">
        <button onClick={() => setActiveTab('schedule')} className={`pb-2 text-sm font-bold transition-all ${activeTab === 'schedule' ? 'text-black border-b-2 border-black' : 'text-slate-400 hover:text-slate-600'}`}>Schedule Ride</button>
        <button onClick={() => setActiveTab('now')} className={`pb-2 text-sm font-bold transition-all ${activeTab === 'now' ? 'text-black border-b-2 border-black' : 'text-slate-400 hover:text-slate-600'}`}>Ride Now</button>
      </div>

      <form onSubmit={handleSearch} className="space-y-4">
        
        <div className="bg-slate-50 rounded-2xl p-2 relative border border-slate-100 transition-all focus-within:ring-2 focus-within:ring-black/5">
           <div className="absolute left-[27px] top-10 bottom-10 w-0.5 bg-slate-300 z-0"></div>
           <div className="relative z-20">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-black rounded-full ring-4 ring-slate-50 shadow-sm"></div>
              <input value={query.origin} onFocus={() => setActiveField('origin')} onChange={(e) => handleInputChange('origin', e.target.value)} placeholder="Pickup location" className="w-full bg-transparent p-3.5 pl-12 pr-16 text-sm font-semibold outline-none text-slate-900 placeholder:text-slate-400"/>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                 <button type="button" onClick={handleCurrentLocation} className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-white transition">{loadingLoc ? <Loader2 className="w-4 h-4 animate-spin"/> : <Navigation className="w-4 h-4"/>}</button>
                 <div className="w-px h-4 bg-slate-200 mx-1"></div>
                 <button type="button" onClick={() => onMapPick('pickup')} className={`p-1.5 rounded-lg transition ${isMapSelecting ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-black hover:bg-white'}`}><MapPin className="w-4 h-4"/></button>
              </div>
              {activeField === 'origin' && <Dropdown />}
           </div>
           <div className="h-px bg-slate-200 mx-10 relative">
              <button type="button" onClick={handleSwap} className="absolute right-0 -top-3 p-1.5 bg-white border border-slate-100 rounded-full shadow-sm text-slate-400 hover:text-black z-20"><ArrowUpDown className="w-3 h-3"/></button>
           </div>
           <div className="relative z-10">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-slate-900 rounded-sm ring-4 ring-slate-50 shadow-sm"></div>
              <input value={query.destination} onFocus={() => setActiveField('destination')} onChange={(e) => handleInputChange('destination', e.target.value)} placeholder="Where to?" className="w-full bg-transparent p-3.5 pl-12 pr-10 text-sm font-semibold outline-none text-slate-900 placeholder:text-slate-400"/>
              <button type="button" onClick={() => onMapPick('dropoff')} className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition ${isMapSelecting ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-black hover:bg-white'}`}><MapPin className="w-4 h-4"/></button>
              {activeField === 'destination' && <Dropdown />}
           </div>
        </div>

        {activeTab === 'schedule' && (
           <div className="flex gap-2 animate-fade-in">
              <div className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 flex items-center gap-2 cursor-pointer hover:border-slate-300 transition">
                 <Calendar className="w-4 h-4 text-slate-500"/>
                 <input type="date" className="bg-transparent w-full text-xs font-bold text-slate-900 outline-none cursor-pointer" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 flex items-center gap-2 cursor-pointer hover:border-slate-300 transition">
                 <Clock className="w-4 h-4 text-slate-500"/>
                 <input type="time" className="bg-transparent w-full text-xs font-bold text-slate-900 outline-none cursor-pointer" value={time} onChange={e => setTime(e.target.value)} />
              </div>
           </div>
        )}

        {/* Price Estimate Teaser */}
        {estimatedFare && (
           <div className="bg-green-50 border border-green-100 p-3 rounded-xl flex justify-between items-center animate-fade-in">
               <span className="text-xs font-bold text-green-700 flex items-center gap-1"><Info className="w-3 h-3"/> Est. Price</span>
               <span className="text-sm font-bold text-slate-900">{APP_CONFIG.currency}{estimatedFare.toLocaleString()}</span>
           </div>
        )}
        {calculatingFare && <div className="text-center text-xs text-slate-400 animate-pulse">Calculating fare...</div>}

        <button type="submit" className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-slate-900 transition flex items-center justify-center gap-2 shadow-lg shadow-black/10 active:scale-[0.98]">
           {activeTab === 'schedule' ? 'Find Scheduled Rides' : 'Find Available Drivers'} <ArrowRight className="w-4 h-4"/>
        </button>
      </form>
    </div>
  );
}