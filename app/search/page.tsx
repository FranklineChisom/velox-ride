'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getRoute, reverseGeocode } from '@/lib/osm';
import { Coordinates, Suggestion } from '@/types';
import dynamic from 'next/dynamic';
import { MapPin, Loader2, ArrowLeft, Clock, X, Search, CreditCard, ChevronRight, Filter, AlertCircle, Users } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import { useSmartSearch } from '@/hooks/useSmartSearch';
import RideResultCard from '@/components/search/RideResultCard';

const LeafletMap = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-50 animate-pulse flex items-center justify-center text-slate-400">Loading Map...</div>
});

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addToast } = useToast();

  const {
    query, setQuery, coords, setCoords, suggestions, setSuggestions,
    passengerCount, setPassengerCount,
    filteredRides, loading, hasSearched, isTyping,
    handleInputChange, performSearch
  } = useSmartSearch({ 
    initialOrigin: searchParams.get('origin') || '', 
    initialDest: searchParams.get('destination') || '',
    onToast: addToast 
  });

  const [date, setDate] = useState(searchParams.get('date') || '');
  const [time, setTime] = useState(searchParams.get('time') || '');
  const [route, setRoute] = useState<[number, number][] | undefined>(undefined);
  const [selectedRide, setSelectedRide] = useState<string | null>(null);
  const [mapMode, setMapMode] = useState<'pickup' | 'dropoff' | null>(null);
  const [activeField, setActiveField] = useState<'origin' | 'destination' | null>(null);

  useEffect(() => {
    const pUrl = searchParams.get('origin');
    const dUrl = searchParams.get('destination');
    const dateUrl = searchParams.get('date');
    const timeUrl = searchParams.get('time');
    
    if (pUrl && dUrl) {
      performSearch(dateUrl || undefined, timeUrl || undefined, true);
    }
  }, []);

  useEffect(() => {
    if (coords.pickup && coords.dropoff) {
      getRoute(coords.pickup, coords.dropoff).then(path => {
        if(path) setRoute(path);
      });
    } else {
      setRoute(undefined);
    }
  }, [coords.pickup, coords.dropoff]);

  const handleBookRedirect = () => {
    if(!selectedRide) {
        addToast("Please select a ride first", 'error');
        return;
    }
    router.push(`/booking?ride_id=${selectedRide}&seats=${passengerCount}`);
  };

  const handleSuggestionSelect = (suggestion: Suggestion) => {
    if (!activeField) return;
    const newCoords = { lat: parseFloat(suggestion.lat), lng: parseFloat(suggestion.lon) };
    const displayName = suggestion.display_name.split(',')[0];
    
    if (activeField === 'origin') {
        setQuery(prev => ({ ...prev, origin: displayName }));
        setCoords(prev => ({ ...prev, pickup: newCoords }));
    } else {
        setQuery(prev => ({ ...prev, destination: displayName }));
        setCoords(prev => ({ ...prev, dropoff: newCoords }));
    }
    setSuggestions([]);
    setActiveField(null);
  };

  const handleMapSelect = async (c: Coordinates) => {
      const currentMode = mapMode;
      setMapMode(null);
      if(!currentMode) return;

      const address = await reverseGeocode(c.lat, c.lng);
      
      if(currentMode === 'pickup') {
          setCoords(prev => ({...prev, pickup: c}));
          setQuery(prev => ({...prev, origin: address}));
      } else {
          setCoords(prev => ({...prev, dropoff: c}));
          setQuery(prev => ({...prev, destination: address}));
      }
  }

  return (
    <div className="h-screen w-full relative bg-white overflow-hidden font-sans flex flex-col md:flex-row">
      
      {/* Map Layer */}
      <div className="order-2 md:order-1 flex-1 relative h-[40vh] md:h-full bg-slate-100">
         <LeafletMap 
            pickup={coords.pickup}
            dropoff={coords.dropoff}
            routeCoordinates={route}
            selectionMode={mapMode}
            onPickupSelect={handleMapSelect}
            onDropoffSelect={handleMapSelect}
         />
         
         {mapMode && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] bg-black text-white px-6 py-3 rounded-full font-bold shadow-2xl animate-bounce flex items-center gap-3 cursor-pointer" onClick={() => setMapMode(null)}>
              <MapPin className="w-4 h-4 text-white"/>
              <span className="text-sm">Tap map to set {mapMode === 'pickup' ? 'Pickup' : 'Dropoff'}</span>
              <X className="w-4 h-4 ml-2 opacity-50 hover:opacity-100"/>
            </div>
         )}
      </div>

      {/* Search Panel */}
      <div className="order-1 md:order-2 w-full md:w-[500px] bg-white shadow-2xl z-20 flex flex-col h-[60vh] md:h-full border-l border-slate-100">
        
        <div className="p-5 border-b border-gray-100 flex items-center gap-4 bg-white shrink-0">
           <button onClick={() => router.push('/passenger')} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition"><ArrowLeft className="w-5 h-5 text-slate-900" /></button>
           <h1 className="font-bold text-lg text-slate-900">Find a Ride</h1>
        </div>

        <div className="p-5 bg-white shrink-0 space-y-4">
           <div className="bg-slate-50 p-2 rounded-2xl border border-slate-100 relative">
              <div className="absolute left-[23px] top-10 bottom-10 w-0.5 bg-gray-300 z-0"></div>
              <div className="relative z-10 mb-2">
                 <div className="absolute left-4 top-3.5 w-2 h-2 bg-black rounded-full ring-4 ring-slate-50"></div>
                 <input value={query.origin} onFocus={() => setActiveField('origin')} onChange={(e) => handleInputChange('origin', e.target.value)} placeholder="Pickup Location" className="w-full bg-white p-3 pl-10 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-black/5 shadow-sm transition"/>
                 <button onClick={() => setMapMode('pickup')} className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-black transition"><MapPin className="w-4 h-4"/></button>
              </div>
              <div className="relative z-10">
                 <div className="absolute left-4 top-3.5 w-2 h-2 bg-slate-900 rounded-sm ring-4 ring-slate-50"></div>
                 <input value={query.destination} onFocus={() => setActiveField('destination')} onChange={(e) => handleInputChange('destination', e.target.value)} placeholder="Where to?" className="w-full bg-white p-3 pl-10 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-black/5 shadow-sm transition"/>
                 <button onClick={() => setMapMode('dropoff')} className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-black transition"><MapPin className="w-4 h-4"/></button>
              </div>
           </div>

           <div className="grid grid-cols-3 gap-3">
              <div className="relative col-span-2">
                 <Clock className="absolute top-3 left-3 w-4 h-4 text-slate-400"/>
                 <input type="date" className="w-full bg-slate-50 border border-slate-100 p-2.5 pl-10 rounded-xl text-sm font-medium outline-none focus:border-black transition" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div className="relative">
                 <Users className="absolute top-3 left-3 w-4 h-4 text-slate-400"/>
                 <select 
                   className="w-full bg-slate-50 border border-slate-100 p-2.5 pl-9 rounded-xl text-sm font-medium outline-none focus:border-black transition appearance-none"
                   value={passengerCount}
                   onChange={(e) => setPassengerCount(Number(e.target.value))}
                 >
                   {[1,2,3,4].map(n => <option key={n} value={n}>{n} pass.</option>)}
                 </select>
              </div>
           </div>

           <button onClick={() => performSearch(date, time)} className="w-full bg-black text-white py-3.5 rounded-xl font-bold hover:bg-slate-800 transition shadow-lg flex items-center justify-center gap-2">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search Rides'}</button>

           {activeField && suggestions.length > 0 && (
              <div className="absolute left-5 right-5 z-50 bg-white rounded-xl shadow-2xl border border-slate-100 mt-[-10px] overflow-hidden">
                 {suggestions.map((item) => (
                    <div key={item.place_id} onClick={() => handleSuggestionSelect(item)} className="px-4 py-3 hover:bg-slate-50 cursor-pointer flex items-center gap-3 border-b border-slate-50 last:border-0">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0"/><p className="text-sm text-slate-700 truncate">{item.display_name}</p>
                    </div>
                 ))}
              </div>
           )}
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50 p-4 space-y-4">
           {!hasSearched ? (
             <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center px-8">
               <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm"><Search className="w-6 h-6 text-slate-300"/></div>
               <p className="text-sm font-medium text-slate-600">Enter your route to find rides</p>
             </div>
           ) : loading ? (
             <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3"><Loader2 className="w-8 h-8 animate-spin text-black"/><p className="text-xs font-bold">Scanning routes...</p></div>
           ) : filteredRides.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full text-center px-8">
               <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4"><AlertCircle className="w-8 h-8 text-red-400"/></div>
               <h3 className="font-bold text-slate-900 mb-1">No matches found</h3>
               <p className="text-sm text-slate-500">Try adjusting your locations or time.</p>
             </div>
           ) : (
             <>
               <div className="flex justify-between items-center px-1"><p className="text-xs font-bold text-slate-500 uppercase">{filteredRides.length} Results Found</p><Filter className="w-4 h-4 text-slate-400"/></div>
               {filteredRides.map((ride, index) => (
                 <RideResultCard 
                    key={ride.id} 
                    ride={ride} 
                    isSelected={selectedRide === ride.id} 
                    onSelect={() => setSelectedRide(ride.id)} 
                 />
               ))}
             </>
           )}
        </div>

        <div className="p-5 bg-white border-t border-slate-100 shrink-0 z-20">
           <div className="flex justify-between items-center mb-3"><span className="text-xs font-bold text-slate-400 uppercase">Selected</span><span className="text-sm font-bold text-slate-900">{selectedRide ? '1 Ride' : 'None'}</span></div>
           <button disabled={!selectedRide} onClick={handleBookRedirect} className="w-full bg-black disabled:bg-slate-100 disabled:text-slate-300 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition shadow-xl flex items-center justify-center gap-2">Proceed to Book <ChevronRight className="w-5 h-5"/></button>
        </div>
      </div>
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