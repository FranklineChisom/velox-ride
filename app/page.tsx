'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { 
  ArrowRight, 
  ShieldCheck,
  MapPin,
  Smartphone,
  Clock,
  UserCheck,
  Zap,
  Navigation,
  History,
  Loader2,
  CalendarDays,
  ArrowUpDown
} from 'lucide-react';

// --- Types ---
interface Suggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface SearchHistoryItem {
  id: string;
  destination_name: string;
  created_at: string;
}

// Configuration
const APP_STORE_LINK = "https://apps.apple.com/us/app/veloxride/id123456789"; 
const PLAY_STORE_LINK = "https://play.google.com/store/apps/details?id=com.veloxride.app";
const HERO_IMAGE_URL = "https://images.unsplash.com/photo-1554223090-7e482851df45?q=80&w=2940&auto=format&fit=crop";
const PHONE_MOCKUP_IMAGE_URL = "https://images.unsplash.com/photo-1512428559087-560fa5db7df7?auto=format&fit=crop&q=80&w=800";
const SAFETY_BADGE_TITLE = "Safety Verified";
const SAFETY_BADGE_TEXT = "Every trip is insured.";

export default function Home() {
  const router = useRouter();
  const supabase = createClient();
  
  const [activeTab, setActiveTab] = useState<'schedule' | 'now'>('schedule');
  
  // Search State
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  
  // Autocomplete State
  const [activeField, setActiveField] = useState<'pickup' | 'dropoff' | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUserHistory();
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setActiveField(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchUserHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('search_history')
      .select('id, destination_name, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (data) setHistory(data);
  };

  const fetchSuggestions = async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsTyping(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ng&limit=5`);
      const data = await res.json();
      setSuggestions(data);
    } catch (error) {
      console.error("Autocomplete error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleInputChange = (field: 'pickup' | 'dropoff', value: string) => {
    if (field === 'pickup') setPickup(value);
    else setDropoff(value);
    
    setActiveField(field);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 400);
  };

  const handleSelectSuggestion = (suggestion: Suggestion) => {
    const simpleName = suggestion.display_name.split(',')[0];
    if (activeField === 'pickup') setPickup(simpleName);
    else setDropoff(simpleName);
    setActiveField(null);
    setSuggestions([]);
  };

  const handleSelectHistory = (item: SearchHistoryItem) => {
    if (activeField === 'pickup') setPickup(item.destination_name);
    else setDropoff(item.destination_name);
    setActiveField(null);
  };

  const handleSwapLocations = () => {
    const temp = pickup;
    setPickup(dropoff);
    setDropoff(temp);
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
        const address = data.display_name.split(',')[0] + ', ' + (data.address.city || data.address.state || '');
        setPickup(address);
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (pickup) params.append('origin', pickup);
    if (dropoff) params.append('destination', dropoff);
    if (activeTab === 'schedule' && date && time) {
      params.append('date', date);
      params.append('time', time);
    }
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-black selection:text-white">
      
      {/* --- Hero Section --- */}
      <section className="pt-32 pb-16 w-[90%] md:w-[85%] mx-auto bg-white min-h-[90vh] flex items-center relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center w-full h-full">
          
          <div className="relative z-20 animate-fade-in flex flex-col justify-center">
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1] mb-6">
              Your city.<br />
              Your schedule.
            </h1>
            
            <p className="text-xl text-slate-500 mb-10 max-w-lg leading-relaxed font-medium">
              Experience seamless mobility. Book a seat, share the cost, and travel in premium comfort.
            </p>

            {/* Smart Booking Widget */}
            <div className="bg-white p-1 rounded-[2rem] shadow-float border border-slate-100 max-w-lg relative z-20" ref={wrapperRef}>
               
               {/* Tab Switcher */}
               <div className="grid grid-cols-2 p-1.5 bg-slate-50/80 rounded-[1.8rem] mb-2">
                  <button 
                    onClick={() => setActiveTab('schedule')}
                    className={`py-3 rounded-3xl text-sm font-bold transition-all duration-300 ${activeTab === 'schedule' ? 'bg-white text-black shadow-sm ring-1 ring-slate-100' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    Schedule
                  </button>
                  <button 
                    onClick={() => setActiveTab('now')}
                    className={`py-3 rounded-3xl text-sm font-bold transition-all duration-300 ${activeTab === 'now' ? 'bg-white text-black shadow-sm ring-1 ring-slate-100' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    Ride Now
                  </button>
               </div>
               
               <form onSubmit={handleSearch} className="p-5 space-y-3 relative">
                 
                 {/* Input Group */}
                 <div className="bg-slate-50 rounded-2xl p-2 relative border border-slate-100 focus-within:border-black/10 focus-within:ring-4 focus-within:ring-black/5 transition-all duration-300">
                    <div className="absolute left-[27px] top-12 bottom-12 w-0.5 bg-slate-200 z-0"></div>

                    <button 
                      type="button"
                      onClick={handleSwapLocations}
                      className="absolute right-12 top-1/2 -translate-y-1/2 p-2 bg-white rounded-full shadow-sm border border-slate-100 text-slate-400 hover:text-black z-10 hover:scale-110 transition hidden md:flex"
                      title="Swap locations"
                    >
                      <ArrowUpDown className="w-4 h-4" />
                    </button>

                    <div className="relative z-10 group">
                       <div className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 bg-black rounded-full ring-4 ring-white shadow-sm"></div>
                       <input 
                         type="text" 
                         placeholder="Pickup location"
                         className="w-full bg-transparent p-4 pl-12 pr-10 text-slate-900 font-semibold placeholder:text-slate-400 placeholder:font-medium outline-none text-base"
                         value={pickup}
                         onChange={(e) => handleInputChange('pickup', e.target.value)}
                         onFocus={() => setActiveField('pickup')}
                       />
                       <button 
                          type="button" 
                          onClick={handleCurrentLocation}
                          disabled={loadingLocation}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl hover:bg-slate-200/50 text-slate-400 hover:text-black transition"
                          title="Use current location"
                       >
                          {loadingLocation ? <Loader2 className="w-5 h-5 animate-spin"/> : <Navigation className="w-5 h-5" />}
                       </button>
                    </div>

                    <div className="h-px bg-slate-200 mx-4 my-1"></div>

                    <div className="relative z-10 group">
                       <div className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 bg-slate-800 rounded-sm ring-4 ring-white shadow-sm"></div>
                       <input 
                         type="text" 
                         placeholder="Dropoff destination"
                         className="w-full bg-transparent p-4 pl-12 pr-4 text-slate-900 font-semibold placeholder:text-slate-400 placeholder:font-medium outline-none text-base"
                         value={dropoff}
                         onChange={(e) => handleInputChange('dropoff', e.target.value)}
                         onFocus={() => setActiveField('dropoff')}
                       />
                    </div>
                 </div>

                 {activeTab === 'schedule' && (
                   <div className="grid grid-cols-2 gap-3 animate-fade-in mt-2">
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center gap-3 hover:border-slate-300 transition cursor-pointer">
                        <CalendarDays className="w-5 h-5 text-slate-500" />
                        <input 
                          type="date" 
                          className="bg-transparent text-sm font-bold text-slate-900 outline-none w-full cursor-pointer"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                        />
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center gap-3 hover:border-slate-300 transition cursor-pointer">
                        <Clock className="w-5 h-5 text-slate-500" />
                        <input 
                          type="time" 
                          className="bg-transparent text-sm font-bold text-slate-900 outline-none w-full cursor-pointer"
                          value={time}
                          onChange={(e) => setTime(e.target.value)}
                        />
                      </div>
                   </div>
                 )}

                 {activeField && (suggestions.length > 0 || (history.length > 0 && !isTyping)) && (
                    <div className="absolute top-[calc(100%-80px)] left-0 w-full bg-white rounded-2xl shadow-xl border border-slate-100/50 overflow-hidden z-50 max-h-72 overflow-y-auto animate-fade-in mt-2">
                       {isTyping && (
                         <div className="p-6 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
                           <Loader2 className="w-4 h-4 animate-spin" /> Searching places...
                         </div>
                       )}

                       {!isTyping && history.length > 0 && (
                         <div className="py-2 bg-slate-50/50">
                            <div className="px-5 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                              <History className="w-3 h-3" /> Recent
                            </div>
                            {history.map(item => (
                              <div 
                                key={item.id} 
                                onClick={() => handleSelectHistory(item)}
                                className="px-5 py-3.5 hover:bg-slate-100 cursor-pointer flex items-center gap-4 transition group"
                              >
                                <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-black group-hover:border-black transition">
                                  <Clock className="w-4 h-4" />
                                </div>
                                <span className="font-bold text-slate-800 text-sm">{item.destination_name}</span>
                              </div>
                            ))}
                         </div>
                       )}

                       {suggestions.length > 0 && (
                         <div className="py-2">
                            <div className="px-5 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Suggestions</div>
                            {suggestions.map(item => (
                              <div 
                                key={item.place_id} 
                                onClick={() => handleSelectSuggestion(item)}
                                className="px-5 py-3.5 hover:bg-slate-50 cursor-pointer flex items-center gap-4 border-b border-slate-50 last:border-0 transition group"
                              >
                                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-slate-200 transition">
                                  <MapPin className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900 text-sm">{item.display_name.split(',')[0]}</div>
                                  <div className="text-xs text-slate-500 truncate max-w-[280px]">{item.display_name}</div>
                                </div>
                              </div>
                            ))}
                         </div>
                       )}
                    </div>
                 )}

                 <button type="submit" className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-900 transition flex items-center justify-center gap-2 shadow-xl shadow-black/10 transform active:scale-[0.98] mt-4">
                   See prices <ArrowRight className="w-5 h-5" />
                 </button>
               </form>
            </div>
          </div>

          <div className="relative hidden lg:block h-full max-h-[650px] w-full bg-slate-100 rounded-[3rem] overflow-hidden shadow-float group">
            <img 
              src={HERO_IMAGE_URL}
              alt="Urban Mobility" 
              className="w-full h-full object-cover scale-105 group-hover:scale-100 transition duration-1000 ease-in-out"
            />
            <div className="absolute bottom-10 left-10 bg-white/80 backdrop-blur-xl p-5 pr-8 rounded-2xl shadow-float max-w-xs border border-white/40">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center shadow-lg">
                   <ShieldCheck className="w-6 h-6" />
                 </div>
                 <div>
                   <p className="font-bold text-slate-900 text-lg">{SAFETY_BADGE_TITLE}</p>
                   <p className="text-xs text-slate-600 font-medium">{SAFETY_BADGE_TEXT}</p>
                 </div>
               </div>
            </div>
          </div>

        </div>
      </section>

      {/* --- Other Sections (How It Works, Why Choose Us, App Download) --- */}
      {/* Kept minimal for brevity in this response, assume previous sections exist here or are imported */}
      {/* ... [Insert previous 'How It Works', 'Why Choose Us', 'Driver CTA', 'App Download' sections here] ... */}
      
      {/* Re-adding the App Download Section for context with dynamic link */}
      <section className="py-20 px-6 bg-black text-white rounded-[3rem] mx-4 lg:mx-20 mb-20 overflow-hidden relative shadow-float">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-[100px] pointer-events-none"></div>
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
            <div className="md:w-1/2 px-6">
               <h2 className="text-4xl lg:text-5xl font-bold mb-6">Velox on the go.</h2>
               <p className="text-slate-400 text-lg mb-8 max-w-md">
                 Download the VeloxRide app for iOS and Android. Book rides, track drivers, and manage payments effortlessly.
               </p>
               <div className="flex flex-wrap gap-4">
                  <a href={APP_STORE_LINK} target="_blank" rel="noopener noreferrer" className="bg-white text-black px-6 py-3 rounded-xl font-bold flex items-center gap-3 hover:bg-slate-200 transition">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.21-1.98 1.07-3.11-1.06.05-2.36.71-3.13 1.6-.66.75-1.24 1.95-1.08 3.09 1.17.09 2.37-.74 3.14-1.58z"/></svg>
                    <span>App Store</span>
                  </a>
                  <a href={PLAY_STORE_LINK} target="_blank" rel="noopener noreferrer" className="bg-transparent border border-white/20 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-3 hover:bg-white/10 transition">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.3,4.26S20.3,4.26 20.3,4.26L4.26,13.5L14.55,11.15L16.81,8.88L20.3,4.26M15.12,7.19L6.05,2.66L16.81,8.88L15.12,7.19Z"/></svg>
                    <span>Google Play</span>
                  </a>
               </div>
            </div>
            <div className="md:w-1/2 flex justify-center">
               <div className="relative w-72 h-[550px] bg-slate-800 rounded-[3rem] border-[8px] border-slate-700 shadow-2xl overflow-hidden transform rotate-6 hover:rotate-0 transition duration-500">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-700 rounded-b-xl z-20"></div>
                  <img src={PHONE_MOCKUP_IMAGE_URL} className="w-full h-full object-cover opacity-80" alt="App Screen"/>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-8">
                     <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-4">
                       <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-bold">V</div>
                     </div>
                     <div className="text-white font-bold text-2xl mb-1">Your ride is here</div>
                     <div className="text-slate-300 text-sm">Driver arriving in 2 mins</div>
                  </div>
               </div>
            </div>
         </div>
      </section>

    </div>
  );
}