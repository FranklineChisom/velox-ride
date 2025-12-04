'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase'; // CHANGED IMPORT
import { Ride } from '@/types';
import { format } from 'date-fns';
import { MapPin, Search, Clock, CreditCard } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PassengerDashboard() {
  const supabase = createClient(); // CHANGED USAGE
  const router = useRouter();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(false);
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

    // Simple search implementation
    // Ideally this would use PostGIS for location, but text match works for MVP
    let query = supabase
      .from('rides')
      .select('*, profiles(full_name, rating)')
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
      seats_booked: 1 // Defaulting to 1 for MVP
    });

    if (error) alert('Booking failed: ' + error.message);
    else alert('Booking confirmed! Driver will be notified.');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">Passenger Portal</h1>
        <button onClick={handleLogout} className="text-sm text-red-600 hover:text-red-700">Sign Out</button>
      </nav>

      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Search Box */}
        <div className="bg-white p-6 rounded-xl shadow-md mb-8">
            <h2 className="text-lg font-semibold mb-4">Where to today?</h2>
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <MapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                    <input 
                        type="text" 
                        placeholder="From (e.g. Lekki)"
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                        value={search.from}
                        onChange={e => setSearch({...search, from: e.target.value})}
                    />
                </div>
                <div className="flex-1 relative">
                    <MapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                    <input 
                        type="text" 
                        placeholder="To (e.g. VI)"
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                        value={search.to}
                        onChange={e => setSearch({...search, to: e.target.value})}
                    />
                </div>
                <button type="submit" className="bg-teal-600 text-white px-8 py-2 rounded-lg font-medium hover:bg-teal-700 flex items-center justify-center">
                    <Search className="w-5 h-5 mr-2" />
                    Find Rides
                </button>
            </form>
        </div>

        {/* Results */}
        <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800">Available Rides</h3>
            {loading && <p>Searching...</p>}
            {!loading && rides.length === 0 && <p className="text-gray-500">No rides found. Try different locations.</p>}
            
            {rides.map((ride: any) => (
                <div key={ride.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="text-lg font-bold text-gray-900 mb-1">
                                {format(new Date(ride.departure_time), 'h:mm a')}
                            </div>
                            <div className="text-gray-500 text-sm mb-4">
                                {format(new Date(ride.departure_time), 'MMM d, yyyy')}
                            </div>
                            
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                                <span className="font-medium text-gray-700">{ride.origin}</span>
                            </div>
                            <div className="flex items-center gap-2 ml-0.5 border-l-2 border-gray-200 pl-4 py-1 h-6"></div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                <span className="font-medium text-gray-700">{ride.destination}</span>
                            </div>

                            <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                                <span>Driver: {ride.profiles?.full_name || 'Verified Driver'}</span>
                                <span>•</span>
                                <span>{ride.total_seats} seats left</span>
                            </div>
                        </div>

                        <div className="text-right flex flex-col justify-between h-full">
                            <div className="text-2xl font-bold text-teal-600">₦{ride.price_per_seat}</div>
                            <button 
                                onClick={() => handleBook(ride.id, ride.price_per_seat)}
                                className="mt-6 bg-gray-900 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition flex items-center"
                            >
                                <CreditCard className="w-4 h-4 mr-2" />
                                Book Seat
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}