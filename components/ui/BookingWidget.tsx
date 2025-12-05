'use client';
import { useState, useRef, useEffect } from 'react';
import { 
  MapPin, Loader2, Navigation, History, Calendar, Clock, 
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
  // We allow the parent to control coords so map and form stay in sync
  coords: { pickup?: Coordinates; dropoff?: Coordinates };
  setCoords: (coords: { pickup?: Coordinates; dropoff?: Coordinates }) => void;
  onLocationResolve: (field: 'origin' | 'destination', name: string) => void;
  externalQuery: { origin: string; destination: string }; // To receive updates from map
}

export default function BookingWidget({ 
  savedPlaces, 
  recentSearches, 
  onMapPick,
  coords,
  setCoords,
  onLocationResolve,
  externalQuery
}: BookingWidgetProps) {
  
  const router = useRouter();
  const { addToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'schedule' | 'now'>('schedule');
  const [query, setQuery] = useState({ origin: '', destination: '' });
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  
  // Suggestions State
  const [activeField, setActiveField] = useState<'origin' | 'destination' | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [loadingLoc, setLoadingLoc] = useState(false);
  
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync external query changes (from map clicks)
  useEffect(() => {
    setQuery(prev => ({
      origin: externalQuery.origin || prev.origin,
      destination: externalQuery.destination || prev.destination
    }));
  }, [externalQuery]);

  // Click outside to close dropdown
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
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleInputChange = (field: 'origin' | 'destination', value: string) => {
    setQuery(prev => ({ ...prev, [field]: value }));
    // Clear coord if typing manually to force re-selection
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
    if (!navigator.geolocation) {
      addToast("Geolocation not supported", 'error');
      return;
    }
    setLoadingLoc(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      try {
        const address = await reverseGeocode(latitude, longitude);
        setQuery(prev => ({ ...prev, origin: address }));
        setCoords({ ...coords, pickup: { lat: latitude, lng: longitude } });
        onLocationResolve('origin', address);
      } catch {
        addToast("Location check failed", 'error');
      } finally {
        setLoadingLoc(false);
      }
    }, () => {
      setLoadingLoc(false);
      addToast("Location permission denied", 'error');
    });
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
    if (activeTab === 'schedule' && date && time) {
      params.append('date', date);
      params.append('time', time);
    }
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative z-20" ref={wrapperRef}>
      
      {/* Tabs */}
      <div className="grid grid-cols-2 p-1.5 bg-slate-50/80 rounded-[1.8rem] mb-6">
        {['schedule', 'now'].map((t) => (
          <button 
            key={t}
            onClick={() => setActiveTab(t as any)}
            className={`py-3 rounded-3xl text-sm font-bold capitalize transition-all duration-300 ${activeTab === t ? 'bg-white text-black shadow-sm ring-1 ring-slate-100' : 'text-slate-500 hover:text-slate-800'}`}
          >
            {t === 'schedule' ? 'Schedule Ride' : 'Ride Now'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSearch} className="space-y-4">
        
        {/* Inputs */}
        <div className="bg-slate-50 rounded-2xl p-2 relative border border-slate-100 focus-within:border-black/10 focus-within:ring-4 focus-within:ring-black/5 transition-all">
           <div className="absolute left-[27px] top-12 bottom-12 w-0.5 bg-slate-200 z-0"></div>
           
           {/* Pickup */}
           <div className="relative z-10 group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 bg-black rounded-full ring-4 ring-white shadow-sm"></div>
              <input 
                value={query.origin}
                onFocus={() => setActiveField('origin')}
                onChange={(e) => handleInputChange('origin', e.target.value)}
                placeholder="Pickup location"
                className="w-full bg-transparent p-4 pl-12 pr-20 font-semibold outline-none text-slate-900 placeholder:text-slate-400"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                 <button type="button" onClick={handleCurrentLocation} className="p-2 text-slate-400 hover:text-blue-600 rounded-xl hover:bg-white transition">
                    {loadingLoc ? <Loader2 className="w-4 h-4 animate-spin"/> : <Navigation className="w-4 h-4"/>}
                 </button>
                 <button type="button" onClick={() => onMapPick('pickup')} className="p-2 text-slate-400 hover:text-black rounded-xl hover:bg-white transition">
                    <MapPin className="w-4 h-4"/>
                 </button>
              </div>
           </div>

           <div className="h-px bg-slate-200 mx-4 relative">
              <button type="button" onClick={handleSwap} className="absolute right-4 -top-3 p-1.5 bg-white border border-slate-100 rounded-full shadow-sm text-slate-400 hover:text-black z-20">
                 <ArrowUpDown className="w-3 h-3"/>
              </button>
           </div>

           {/* Dropoff */}
           <div className="relative z-10 group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 bg-slate-800 rounded-sm ring-4 ring-white shadow-sm"></div>
              <input 
                value={query.destination}
                onFocus={() => setActiveField('destination')}
                onChange={(e) => handleInputChange('destination', e.target.value)}
                placeholder="Dropoff destination"
                className="w-full bg-transparent p-4 pl-12 pr-12 font-semibold outline-none text-slate-900 placeholder:text-slate-400"
              />
              <button type="button" onClick={() => onMapPick('dropoff')} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-black rounded-xl hover:bg-white transition">
                 <MapPin className="w-4 h-4"/>
              </button>
           </div>
        </div>

        {/* Date/Time for Schedule */}
        {activeTab === 'schedule' && (
           <div className="grid grid-cols-2 gap-3 animate-fade-in">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center gap-3">
                 <Calendar className="w-5 h-5 text-slate-400"/>
                 <input type="date" className="bg-transparent w-full text-sm font-bold text-slate-900 outline-none" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center gap-3">
                 <Clock className="w-5 h-5 text-slate-400"/>
                 <input type="time" className="bg-transparent w-full text-sm font-bold text-slate-900 outline-none" value={time} onChange={e => setTime(e.target.value)} />
              </div>
           </div>
        )}

        {/* Dropdown Results */}
        {activeField && (suggestions.length > 0 || (recentSearches.length > 0 && !isTyping)) && (
           <div className="absolute top-[calc(100%-80px)] left-0 w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-fade-in">
              {isTyping ? (
                 <div className="p-4 text-center text-slate-400 text-sm flex justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/> Finding places...</div>
              ) : (
                 <>
                   {!isTyping && suggestions.length === 0 && recentSearches.map(item => (
                      <div key={item.id} onClick={() => {
                         const name = item.destination_name;
                         setQuery(prev => ({...prev, [activeField]: name}));
                         onLocationResolve(activeField, name);
                         setActiveField(null);
                      }} className="px-5 py-3 hover:bg-slate-50 cursor-pointer flex items-center gap-3 border-b border-slate-50">
                         <History className="w-4 h-4 text-slate-400"/>
                         <div><p className="text-sm font-bold text-slate-800">{item.destination_name}</p></div>
                      </div>
                   ))}
                   {suggestions.map(item => (
                      <div key={item.place_id} onClick={() => handleSuggestionSelect(item)} className="px-5 py-3 hover:bg-slate-50 cursor-pointer flex items-center gap-3 border-b border-slate-50">
                         <MapPin className="w-4 h-4 text-slate-400"/>
                         <div>
                            <p className="text-sm font-bold text-slate-800">{item.display_name.split(',')[0]}</p>
                            <p className="text-xs text-slate-500 truncate max-w-[250px]">{item.display_name}</p>
                         </div>
                      </div>
                   ))}
                 </>
              )}
           </div>
        )}

        <button type="submit" className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-slate-900 transition flex items-center justify-center gap-2 shadow-lg">
           Find Rides <ArrowRight className="w-5 h-5"/>
        </button>
      </form>
    </div>
  );
}