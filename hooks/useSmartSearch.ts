import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase';
import { RideWithDriver, Suggestion, Coordinates } from '@/types';
import { analyzeRideMatch, MatchAnalysis } from '@/lib/search-engine';
import { getDrivingStats } from '@/lib/osm'; 
import { startOfDay, endOfDay, addDays } from 'date-fns';

export interface SmartRideResult extends RideWithDriver {
  match: MatchAnalysis;
  availableSeats: number;
  realDrivingTime?: number;
  realDrivingDistance?: number;
}

interface UseSmartSearchProps {
  initialOrigin?: string;
  initialDest?: string;
  onToast: (msg: string, type: 'error' | 'success') => void;
}

export function useSmartSearch({ initialOrigin = '', initialDest = '', onToast }: UseSmartSearchProps) {
  const supabase = createClient();
  
  const [query, setQuery] = useState({ origin: initialOrigin, destination: initialDest });
  const [coords, setCoords] = useState<{ pickup?: Coordinates; dropoff?: Coordinates; }>({});
  const [passengerCount, setPassengerCount] = useState(1);
  
  const [filteredRides, setFilteredRides] = useState<SmartRideResult[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Safe Geocode Function
  const geocode = async (q: string): Promise<Coordinates | null> => {
    if (!q) return null;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`);
      if (!res.ok) return null;
      const data = await res.json();
      if(data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    } catch(e) { 
      console.warn("Geocoding error (non-fatal):", e); 
    }
    return null;
  };

  const fetchSuggestions = async (input: string) => {
    if (!input || input.length < 3) { setSuggestions([]); return; }
    setIsTyping(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(input)}&countrycodes=ng&limit=5`);
      const data = await res.json();
      setSuggestions(data || []);
    } catch (error) { 
      console.error(error); 
    } finally { 
      setIsTyping(false); 
    }
  };

  const handleInputChange = (field: 'origin' | 'destination', value: string) => {
    setQuery(prev => ({ ...prev, [field]: value }));
    if (field === 'origin') setCoords(prev => ({ ...prev, pickup: undefined }));
    else setCoords(prev => ({ ...prev, dropoff: undefined }));
    setHasSearched(false);
    setFilteredRides([]);
    
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => { fetchSuggestions(value); }, 500);
  };

  const performSearch = async (date?: string, time?: string, isInitial = false) => {
    if (!query.origin || !query.destination) {
        if(!isInitial) onToast("Please enter both locations", "error");
        return;
    }

    setLoading(true);
    setSuggestions([]);
    setHasSearched(true);

    try {
        // 1. Resolve Coordinates safely
        // We use explicit null checks to ensure we don't pass bad data
        let finalPickup = coords.pickup;
        if (!finalPickup) finalPickup = await geocode(query.origin);
        
        let finalDropoff = coords.dropoff;
        if (!finalDropoff) finalDropoff = await geocode(query.destination);

        setCoords({ 
            pickup: finalPickup || undefined, 
            dropoff: finalDropoff || undefined 
        });

        // 2. Prepare Date safely
        const now = new Date().toISOString();
        let targetDateObj: Date | undefined;
        
        if (date) {
            const dateStr = time ? `${date}T${time}` : `${date}T08:00:00`;
            const parsed = new Date(dateStr);
            if (!isNaN(parsed.getTime())) {
                targetDateObj = parsed;
            }
        }

        // 3. Build Query
        let queryBuilder = supabase
          .from('rides')
          .select(`
            *, 
            profiles(*), 
            bookings(seats_booked, status)
          `)
          .eq('status', 'scheduled')
          .gt('departure_time', now)
          .order('departure_time', { ascending: true })
          .limit(50);

        if (date && !isNaN(new Date(date).getTime())) {
            try {
                const startDate = startOfDay(new Date(date)).toISOString();
                const endDate = endOfDay(addDays(new Date(date), 1)).toISOString();
                queryBuilder = queryBuilder.gte('departure_time', startDate).lte('departure_time', endDate);
            } catch (e) {
                console.warn("Date filtering error:", e);
            }
        }

        const { data: allRides, error } = await queryBuilder;
        
        if (error) {
            console.error("Supabase Error:", error);
            throw new Error(error.message || "Failed to fetch rides");
        }

        if (allRides) {
            // Phase 1: Filtering
            const initialResults = allRides.map((ride: any) => {
                // Safety check for bookings
                const bookings = Array.isArray(ride.bookings) ? ride.bookings : [];
                
                const confirmedBookings = bookings.filter((b: any) => b.status === 'confirmed');
                const bookedSeats = confirmedBookings.reduce((sum: number, b: any) => sum + (b.seats_booked || 0), 0);
                const availableSeats = Math.max(0, (ride.total_seats || 4) - bookedSeats);

                // Analyze Match
                // Ensure we pass undefined if null to satisfy types if needed
                const pickupParam = finalPickup || undefined;
                const dropoffParam = finalDropoff || undefined;
                
                const match = analyzeRideMatch(
                    ride, 
                    { pickup: pickupParam, dropoff: dropoffParam }, 
                    targetDateObj
                );
                
                return { ...ride, match, availableSeats };
            }).filter((ride: SmartRideResult) => {
                return ride.availableSeats >= passengerCount && ride.match.tier !== 'NONE';
            });

            // Sort
            initialResults.sort((a, b) => b.match.score - a.match.score);
            setFilteredRides(initialResults);

            // Phase 2: Enrichment (Only if we have valid pickup coords)
            if (finalPickup && initialResults.length > 0) {
                const topCandidates = initialResults.slice(0, 5);
                
                const enrichmentPromises = topCandidates.map(async (ride) => {
                    if (ride.origin_lat && ride.origin_lng) {
                        const stats = await getDrivingStats(
                            finalPickup!, 
                            { lat: ride.origin_lat, lng: ride.origin_lng }
                        );
                        return { id: ride.id, stats };
                    }
                    return { id: ride.id, stats: null };
                });

                // Handle enrichment separately so it doesn't block UI or crash
                Promise.all(enrichmentPromises)
                    .then(updates => {
                        setFilteredRides(currentRides => {
                            return currentRides.map(ride => {
                                const update = updates.find(u => u.id === ride.id);
                                if (update && update.stats) {
                                    return {
                                        ...ride,
                                        realDrivingTime: Math.ceil(update.stats.durationSeconds / 60),
                                        realDrivingDistance: update.stats.distanceMeters / 1000
                                    };
                                }
                                return ride;
                            });
                        });
                    })
                    .catch(e => console.warn("Enrichment skipped:", e));
            }
        }
    } catch (err: any) {
        console.error("Search Critical Failure:", err);
        const msg = err.message || "An unexpected error occurred";
        onToast(msg, 'error');
    } finally {
        setLoading(false);
    }
  };

  return {
    query, setQuery, coords, setCoords, suggestions, setSuggestions,
    passengerCount, setPassengerCount,
    filteredRides, loading, hasSearched, isTyping,
    handleInputChange, performSearch, geocode
  };
}