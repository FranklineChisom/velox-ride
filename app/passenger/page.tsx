'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Ride } from '@/types';
import { format } from 'date-fns';
import { MapPin, Search, Clock, CreditCard, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { searchLocation, getRoute } from '@/lib/osm';
// Dynamic import for Map to disable SSR
import dynamic from 'next/dynamic';

const LeafletMap = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-100 animate-pulse flex items-center justify-center text-slate-400">Loading Map...</div>
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

    // 1. Geocode locations
    const pickup = await searchLocation(search.from);
    const dropoff = await searchLocation(search.to);

    if (pickup) setPickupCoords(pickup);
    if (dropoff) setDropoffCoords(dropoff);

    // 2. Get Route visualization if both exist
    if (pickup && dropoff) {
      const route = await getRoute(pickup, dropoff);
      if (route) setRoutePath(route);
    }

    // 3. Database Search
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
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar / Main Content Area */}
      <div className="w-full md:w-1/2 lg:w-1/3 p-4 flex flex-col h-screen overflow-y-auto z-10 bg-white shadow-xl">
        <nav className="flex justify-between items-center mb-8">
          <h1 className="text-xl font-bold text-slate-900">VeloxRide</h1>
          <button onClick={handleLogout} className="text-sm text-red-600 hover:text-red-700 font-medium">Sign Out</button>
        </nav>

        {/* Search Box */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Find a Ride</h2>
            <form onSubmit={handleSearch} className="space-y-3">
                <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                    <input 
                        type="text" 
                        placeholder="Pickup (e.g. Wuse 2)"
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none transition"
                        value={search.from}
                        onChange={e => setSearch({...search, from: e.target.value})}
                    />
                </div>
                <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                    <input 
                        type="text" 
                        placeholder="Destination (e.g. Gwarinpa)"
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none transition"
                        value={search.to}
                        onChange={e => setSearch({...search, to: e.target.value})}
                    />
                </div>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-teal-600 text-white py-3 rounded-lg font-bold hover:bg-teal-700 transition flex items-center justify-center"
                >
                    {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Search Rides'}
                </button>
            </form>
        </div>

        {/* Results */}
        <div className="flex-1 space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Available Rides</h3>
            {!loading && rides.length === 0 && <p className="text-slate-400 text-sm">No rides found. Try different locations.</p>}
            
            {rides.map((ride: any) => (
                <div key={ride.id} className="bg-white p-4 rounded-xl border border-slate-200 hover:border-teal-500 transition cursor-pointer group">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="text-xl font-bold text-slate-900">
                                {format(new Date(ride.departure_time), 'h:mm a')}
                            </div>
                            
                            <div className="flex items-center gap-2 mt-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-teal-500"></div>
                                <span className="font-medium text-slate-600 text-sm">{ride.origin}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                <span className="font-medium text-slate-600 text-sm">{ride.destination}</span>
                            </div>

                            <div className="mt-3 flex items-center gap-2 text-xs text-slate-400 font-medium">
                                <span>{ride.profiles?.full_name}</span>
                                <span>•</span>
                                <span>{ride.total_seats} seats</span>
                            </div>
                        </div>

                        <div className="text-right">
                            <div className="text-lg font-bold text-teal-600">₦{ride.price_per_seat}</div>
                            <button 
                                onClick={() => handleBook(ride.id, ride.price_per_seat)}
                                className="mt-3 bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold group-hover:bg-teal-600 transition"
                            >
                                Book
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* Map Area */}
      <div className="hidden md:block flex-1 h-screen sticky top-0">
         <LeafletMap 
            pickup={pickupCoords} 
            dropoff={dropoffCoords} 
            routeCoordinates={routePath} 
         />
      </div>
    </div>
  );
}