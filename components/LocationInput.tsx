'use client';
import { useState, useRef } from 'react';
import { MapPin, X, Navigation } from 'lucide-react';
import { Suggestion, Coordinates } from '@/types';
import dynamic from 'next/dynamic';

const LeafletMap = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => <div className="h-64 w-full bg-slate-50 animate-pulse flex items-center justify-center">Loading Map...</div>
});

interface Props {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string, coords?: Coordinates) => void;
  required?: boolean;
}

export default function LocationInput({ label, placeholder, value, onChange, required }: Props) {
  const [showMap, setShowMap] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [coords, setCoords] = useState<Coordinates | undefined>(undefined);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const fetchSuggestions = async (input: string) => {
    if (input.length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(input)}&countrycodes=ng&limit=3`);
      const data = await res.json();
      setSuggestions(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => fetchSuggestions(val), 500);
  };

  const selectSuggestion = (s: Suggestion) => {
    const c = { lat: parseFloat(s.lat), lng: parseFloat(s.lon) };
    setCoords(c);
    onChange(s.display_name.split(',')[0], c);
    setSuggestions([]);
  };

  const handleMapSelect = async (c: Coordinates) => {
    setCoords(c);
    // Reverse geocode
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${c.lat}&lon=${c.lng}`);
      const data = await res.json();
      onChange(data.display_name?.split(',')[0] || "Pinned Location", c);
    } catch {
      onChange("Pinned Location", c);
    }
    setShowMap(false);
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const c = { 
        lat: position.coords.latitude, 
        lng: position.coords.longitude 
      };
      handleMapSelect(c);
    }, () => {
      alert("Unable to retrieve your location.");
    });
  };

  return (
    <div className="relative">
      {label && <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{label}</label>}
      <div className="relative">
        <input 
          required={required}
          value={value}
          onChange={handleTextChange}
          placeholder={placeholder}
          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-black focus:ring-1 focus:ring-black transition pr-20"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <button 
            type="button" 
            onClick={handleCurrentLocation}
            className="p-1.5 text-slate-400 hover:text-black hover:bg-slate-100 rounded-lg transition"
            title="Use Current Location"
          >
            <Navigation className="w-4 h-4"/>
          </button>
          <button 
            type="button" 
            onClick={() => setShowMap(true)} 
            className="p-1.5 text-slate-400 hover:text-black hover:bg-slate-100 rounded-lg transition"
            title="Pick on map"
          >
            <MapPin className="w-4 h-4"/>
          </button>
        </div>
      </div>

      {suggestions.length > 0 && (
        <div className="absolute top-full left-0 w-full bg-white shadow-xl rounded-xl border border-slate-100 mt-1 z-50 overflow-hidden">
          {suggestions.map(s => (
            <div key={s.place_id} onClick={() => selectSuggestion(s)} className="p-3 hover:bg-slate-50 cursor-pointer text-sm truncate border-b border-slate-50 last:border-0">
              {s.display_name}
            </div>
          ))}
        </div>
      )}

      {showMap && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl overflow-hidden w-full max-w-2xl h-[500px] relative shadow-2xl">
            <button onClick={() => setShowMap(false)} className="absolute top-4 right-4 z-[1000] bg-white p-2 rounded-full shadow-md hover:bg-slate-100">
              <X className="w-5 h-5"/>
            </button>
            <div className="h-full w-full">
               <LeafletMap 
                 pickup={coords} // Show marker if selected
                 onPickupSelect={handleMapSelect} 
                 selectionMode="pickup" 
               />
            </div>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-black text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg pointer-events-none">
              Tap anywhere to set location
            </div>
          </div>
        </div>
      )}
    </div>
  );
}