import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase';
import { RideWithDriver, Suggestion, Coordinates } from '@/types';
import { analyzeRideMatch, MatchAnalysis, getDistanceFromLatLonInKm } from '@/lib/search-engine';
import { getDrivingStats } from '@/lib/osm'; // Import the new function
import { startOfDay, endOfDay, addDays } from 'date-fns';

export interface SmartRideResult extends RideWithDriver {
  match: MatchAnalysis;
  availableSeats: number;
  realDrivingTime?: number; // New field for real-world data
  realDrivingDistance?: number; // New field
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

  // ... (keep geocode and fetchSuggestions functions as they were) ...
  const geocode = async (q: string): Promise<Coordinates | null> => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`);
      const data = await res.json();
      if(data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    } catch(e) { console.error(e); }
    return null;
  };

  const fetchSuggestions = async (input: string) => {
    if (!input || input.length < 3) { setSuggestions([]); return; }
    setIsTyping(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(input)}&countrycodes=ng&limit=5`);
      const data = await res.json();
      setSuggestions(data);
    } catch (error) { console.error(error); } 
    finally { setIsTyping(false); }
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

  // --- The Smart Search Function ---
  const performSearch = async (date?: string, time?: string, isInitial = false) => {
    if (!query.origin || !query.destination) {
        if(!isInitial) onToast("Please enter both locations", "error");
        return;
    }

    setLoading(true);
    setSuggestions([]);
    setHasSearched(true);

    // 1. Resolve Coordinates
    let finalPickup = coords.pickup || await geocode(query.origin);
    let finalDropoff = coords.dropoff || await geocode(query.destination);
    setCoords({ pickup: finalPickup || undefined, dropoff: finalDropoff || undefined });

    try {
        const now = new Date().toISOString();
        let targetDateObj: Date | undefined;
        if (date && time) targetDateObj = new Date(`${date}T${time}`);
        else if (date) targetDateObj = new Date(`${date}T08:00:00`);

        const queryBuilder = supabase
          .from('rides')
          .select(`*, profiles(*), bookings(seats_booked, status)`)
          .eq('status', 'scheduled')
          .gt('departure_time', now)
          .order('departure_time', { ascending: true })
          .limit(50); // Limit to 50 for performance

        if (date) {
            const startDate = startOfDay(new Date(date)).toISOString();
            const endDate = endOfDay(addDays(new Date(date), 1)).toISOString();
            queryBuilder.gte('departure_time', startDate).lte('departure_time', endDate);
        }

        const { data: allRides, error } = await queryBuilder;
        if (error) throw error;

        if (allRides) {
            // Phase 1: Fast Mathematical Filtering (The "Sieve")
            const initialResults = allRides.map((ride: any) => {
                const confirmedBookings = ride.bookings?.filter((b: any) => b.status === 'confirmed') || [];
                const bookedSeats = confirmedBookings.reduce((sum: number, b: any) => sum + b.seats_booked, 0);
                const availableSeats = Math.max(0, ride.total_seats - bookedSeats);

                const match = analyzeRideMatch(ride, { pickup: finalPickup, dropoff: finalDropoff }, targetDateObj);
                return { ...ride, match, availableSeats };
            }).filter((ride: SmartRideResult) => {
                return ride.availableSeats >= passengerCount && ride.match.tier !== 'NONE';
            });

            // Sort by Math Score first
            initialResults.sort((a, b) => b.match.score - a.match.score);
            
            // Update UI immediately with Math results (Fast)
            setFilteredRides(initialResults);

            // Phase 2: Intelligent Refinement (The "Polisher")
            // We only check the top 5 results to save bandwidth/time
            if (finalPickup && initialResults.length > 0) {
                const topCandidates = initialResults.slice(0, 5);
                
                // Async update: Fetch real driving stats
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

                Promise.all(enrichmentPromises).then(updates => {
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
                });
            }
        }
    } catch (err: any) {
        console.error(err);
        onToast("Search failed", 'error');
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