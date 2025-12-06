'use client';
import { useState, useRef, useEffect } from 'react';
import { 
  MapPin, Loader2, Navigation, Calendar, Clock, 
  ArrowRight, ArrowUpDown
} from 'lucide-react';
import { Suggestion, SearchHistoryItem, Coordinates, SavedPlace } from '@/types';
import { reverseGeocode } from '@/lib/osm';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/ToastProvider';

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

  useEffect(() => {
    setQuery(prev => ({
      origin: externalQuery.origin || prev.origin,
      destination: externalQuery.destination || prev.destination
    }));
  }, [externalQuery]);

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
    
    // Pass the mode to the search page so it knows whether to filter by time or show instant options
    if (activeTab === 'schedule') {
      params.append('date', date);
      params.append('time', time);
      params.append('mode', 'scheduled');
    } else {
      params.append('mode', 'instant');
    }
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="bg-white p-5 rounded-3xl shadow-float border border-slate-100 relative z-20 w-full max-w-md" ref={wrapperRef}>
      
      {/* Mode Switcher */}
      <div className="flex gap-4 mb-5 border-b border-slate-100 pb-2">
        <button onClick={() => setActiveTab('schedule')} className={`pb-2 text-sm font-bold transition-all ${activeTab === 'schedule' ? 'text-black border-b-2 border-black' : 'text-slate-400 hover:text-slate-600'}`}>Schedule Ride</button>
        <button onClick={() => setActiveTab('now')} className={`pb-2 text-sm font-bold transition-all ${activeTab === 'now' ? 'text-black border-b-2 border-black' : 'text-slate-400 hover:text-slate-600'}`}>Ride Now</button>
      </div>

      <form onSubmit={handleSearch} className="space-y-4">
        
        {/* Input Group */}
        <div className="bg-slate-50 rounded-2xl p-2 relative border border-slate-100 transition-all focus-within:ring-2 focus-within:ring-black/5">
           <div className="absolute left-[27px] top-10 bottom-10 w-0.5 bg-slate-300 z-0"></div>
           
           {/* Pickup */}
           <div className="relative z-10">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-black rounded-full ring-4 ring-slate-50 shadow-sm"></div>
              <input value={query.origin} onFocus={() => setActiveField('origin')} onChange={(e) => handleInputChange('origin', e.target.value)} placeholder="Pickup location" className="w-full bg-transparent p-3.5 pl-12 pr-16 text-sm font-semibold outline-none text-slate-900 placeholder:text-slate-400"/>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                 <button type="button" onClick={handleCurrentLocation} className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-white transition">{loadingLoc ? <Loader2 className="w-4 h-4 animate-spin"/> : <Navigation className="w-4 h-4"/>}</button>
                 <div className="w-px h-4 bg-slate-200 mx-1"></div>
                 <button type="button" onClick={() => onMapPick('pickup')} className={`p-1.5 rounded-lg transition ${isMapSelecting ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-black hover:bg-white'}`}><MapPin className="w-4 h-4"/></button>
              </div>
           </div>

           <div className="h-px bg-slate-200 mx-10 relative">
              <button type="button" onClick={handleSwap} className="absolute right-0 -top-3 p-1.5 bg-white border border-slate-100 rounded-full shadow-sm text-slate-400 hover:text-black z-20"><ArrowUpDown className="w-3 h-3"/></button>
           </div>

           {/* Dropoff */}
           <div className="relative z-10">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-slate-900 rounded-sm ring-4 ring-slate-50 shadow-sm"></div>
              <input value={query.destination} onFocus={() => setActiveField('destination')} onChange={(e) => handleInputChange('destination', e.target.value)} placeholder="Where to?" className="w-full bg-transparent p-3.5 pl-12 pr-10 text-sm font-semibold outline-none text-slate-900 placeholder:text-slate-400"/>
              <button type="button" onClick={() => onMapPick('dropoff')} className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition ${isMapSelecting ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-black hover:bg-white'}`}><MapPin className="w-4 h-4"/></button>
           </div>
        </div>

        {/* Schedule Inputs - Only show if Schedule tab is active */}
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

        {/* Dropdown Results */}
        {activeField && (suggestions.length > 0) && (
           <div className="absolute top-[100%] left-0 w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-slide-up max-h-72 overflow-y-auto">
              {isTyping ? <div className="p-4 text-center text-slate-400 text-xs font-medium flex justify-center gap-2"><Loader2 className="w-3 h-3 animate-spin"/> Searching...</div> : (
                 <div className="py-1">
                    {suggestions.map(item => (
                       <div key={item.place_id} onClick={() => handleSuggestionSelect(item)} className="px-4 py-3 hover:bg-slate-50 cursor-pointer flex items-center gap-3 border-b border-slate-50 last:border-0 group transition">
                          <div className="bg-slate-100 p-1.5 rounded-full text-slate-400 group-hover:text-black group-hover:bg-slate-200 transition"><MapPin className="w-3 h-3"/></div>
                          <div className="overflow-hidden"><p className="text-xs font-bold text-slate-900 truncate">{item.display_name.split(',')[0]}</p><p className="text-[10px] text-slate-500 truncate">{item.display_name}</p></div>
                       </div>
                    ))}
                 </div>
              )}
           </div>
        )}

        <button type="submit" className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-slate-900 transition flex items-center justify-center gap-2 shadow-lg shadow-black/10 active:scale-[0.98]">
           {activeTab === 'schedule' ? 'Find Scheduled Rides' : 'See Available Drivers'} <ArrowRight className="w-4 h-4"/>
        </button>
      </form>
    </div>
  );
}