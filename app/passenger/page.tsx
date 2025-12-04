'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Ride } from '@/types';
import { format } from 'date-fns';
import { MapPin, Search, Clock, CreditCard, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { searchLocation, getRoute } from '@/lib/osm';
import dynamic from 'next/dynamic';

const LeafletMap = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-velox-midnight animate-pulse flex items-center justify-center text-gray-600">Loading Map...</div>
});

export default function PassengerDashboard() {
  const supabase = createClient();
  const router = useRouter();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Map State
  const [pickupCoords, setPickupCoords] = useState<{lat: number, lng: number} | undefined>(undefined);
  const [dropoffCoords, setDropoffCoords] = useState<{lat: number, lng: number} | undefined>(undefined);
  const [routePath, setRoutePath] = useState<[number, number][] | undefined>(undefined);

  const [search, setSearch] = useState({
    from: '',
    to: '',
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const pickup = await searchLocation(search.from);
    const dropoff = await searchLocation(search.to);

    if (pickup) setPickupCoords(pickup);
    if (dropoff) setDropoffCoords(dropoff);

    if (pickup && dropoff) {
      const route = await getRoute(pickup, dropoff);
      if (route) setRoutePath(route);
    }

    let query = supabase
      .from('rides')
      .select('*, profiles(full_name)')
      .eq('status', 'scheduled')
      .gt('departure_time', new Date().toISOString());

    if (search.from) query = query.ilike('origin', `%${search.from}%`);
    if (search.to) query = query.ilike('destination', `%${search.to}%`);

    const { data, error } = await query;
    if (data) setRides(data as any);
    
    setLoading(false);
  };

  const handleBook = async (rideId: string, price: number) => {
    const confirm = window.confirm(`Confirm booking for ₦${price}?`);
    if (!confirm) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('bookings').insert({
      ride_id: rideId,
      passenger_id: user.id,
      seats_booked: 1
    });

    if (error) alert('Booking failed: ' + error.message);
    else alert('Booking confirmed! Driver will be notified.');
  };

  return (
    <div className="min-h-screen bg-velox-midnight flex flex-col md:flex-row">
      {/* Sidebar Panel */}
      <div className="w-full md:w-1/2 lg:w-1/3 flex flex-col h-screen overflow-y-auto z-10 bg-velox-navy border-r border-white/5 shadow-2xl">
        <nav className="flex justify-between items-center p-6 border-b border-white/5">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-velox-gold">Velox</span>Passenger
          </h1>
          <button onClick={handleLogout} className="text-xs font-bold text-gray-500 hover:text-white uppercase tracking-wider transition">Sign Out</button>
        </nav>

        <div className="p-6">
            {/* Search Box */}
            <div className="bg-velox-midnight p-5 rounded-2xl border border-white/5 mb-8 shadow-inner">
                <h2 className="text-xs font-bold text-velox-gold uppercase tracking-wider mb-4">Route Selection</h2>
                <form onSubmit={handleSearch} className="space-y-3">
                    <div className="relative">
                        <MapPin className="absolute left-3 top-3.5 text-gray-500 w-5 h-5" />
                        <input 
                            type="text" 
                            placeholder="Pickup Location"
                            className="w-full pl-10 pr-4 py-3 bg-velox-navy border border-white/10 rounded-xl focus:ring-1 focus:ring-velox-gold focus:outline-none transition text-white placeholder-gray-600"
                            value={search.from}
                            onChange={e => setSearch({...search, from: e.target.value})}
                        />
                    </div>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-3.5 text-gray-500 w-5 h-5" />
                        <input 
                            type="text" 
                            placeholder="Destination"
                            className="w-full pl-10 pr-4 py-3 bg-velox-navy border border-white/10 rounded-xl focus:ring-1 focus:ring-velox-gold focus:outline-none transition text-white placeholder-gray-600"
                            value={search.to}
                            onChange={e => setSearch({...search, to: e.target.value})}
                        />
                    </div>
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="w-full bg-white text-velox-midnight py-3 rounded-xl font-bold hover:bg-gray-200 transition flex items-center justify-center mt-2"
                    >
                        {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Find Available Rides'}
                    </button>
                </form>
            </div>

            {/* Results */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Matches</h3>
                {!loading && rides.length === 0 && <p className="text-gray-600 text-sm italic">No rides found matching your route.</p>}
                
                {rides.map((ride: any) => (
                    <div key={ride.id} className="bg-velox-midnight p-5 rounded-2xl border border-white/5 hover:border-velox-gold/50 transition cursor-pointer group">
                        <div className="flex justify-between items-start">
                            <div className="space-y-2">
                                <div className="text-xl font-bold text-white">
                                    {format(new Date(ride.departure_time), 'h:mm a')}
                                </div>
                                
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-velox-gold"></div>
                                      <span className="font-medium text-gray-400 text-sm">{ride.origin}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                                      <span className="font-medium text-gray-400 text-sm">{ride.destination}</span>
                                  </div>
                                </div>

                                <div className="pt-2 flex items-center gap-2 text-xs text-gray-500 font-bold uppercase tracking-wider">
                                    <span className="text-velox-gold">{ride.profiles?.full_name}</span>
                                    <span>•</span>
                                    <span>{ride.total_seats} seats</span>
                                </div>
                            </div>

                            <div className="text-right flex flex-col justify-between h-full">
                                <div className="text-lg font-bold text-white">₦{ride.price_per_seat}</div>
                                <button 
                                    onClick={() => handleBook(ride.id, ride.price_per_seat)}
                                    className="mt-4 bg-velox-gold text-velox-midnight px-4 py-2 rounded-lg text-xs font-bold hover:bg-yellow-400 transition shadow-lg shadow-velox-gold/10"
                                >
                                    Book
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* Map Area */}
      <div className="hidden md:block flex-1 h-screen sticky top-0 bg-velox-midnight">
         <LeafletMap 
            pickup={pickupCoords} 
            dropoff={dropoffCoords} 
            routeCoordinates={routePath} 
         />
      </div>
    </div>
  );
}