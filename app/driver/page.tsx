'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase'; // CHANGED IMPORT
import { Ride } from '@/types';
import { format } from 'date-fns';
import { MapPin, Clock, Users, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DriverDashboard() {
  const supabase = createClient(); // CHANGED USAGE
  const router = useRouter();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    date: '',
    time: '',
    seats: 4,
    price: 0
  });

  useEffect(() => {
    fetchDriverRides();
  }, []);

  const fetchDriverRides = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        router.push('/auth');
        return;
    }

    const { data, error } = await supabase
      .from('rides')
      .select('*')
      .eq('driver_id', user.id)
      .order('departure_time', { ascending: true });
    
    if (data) setRides(data);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleCreateRide = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Combine date and time
    const departureTime = new Date(`${formData.date}T${formData.time}`).toISOString();

    const { error } = await supabase.from('rides').insert({
      driver_id: user.id,
      origin: formData.origin,
      destination: formData.destination,
      departure_time: departureTime,
      total_seats: formData.seats,
      price_per_seat: formData.price,
      status: 'scheduled'
    });

    if (error) {
      alert('Error creating ride: ' + error.message);
    } else {
      setShowForm(false);
      fetchDriverRides(); // Refresh list
      setFormData({ origin: '', destination: '', date: '', time: '', seats: 4, price: 0 });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">Driver Portal</h1>
        <button onClick={handleLogout} className="text-sm text-red-600 hover:text-red-700">Sign Out</button>
      </nav>

      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Your Scheduled Trajectories</h2>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
          >
            <Plus className="w-5 h-5 mr-2" />
            Post New Ride
          </button>
        </div>

        {/* Create Ride Form */}
        {showForm && (
          <div className="bg-white p-6 rounded-xl shadow-md mb-8 animate-fade-in">
            <h3 className="text-lg font-semibold mb-4">Create a New Trajectory</h3>
            <form onSubmit={handleCreateRide} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Origin (Pickup)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Gwarinpa, Abuja"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                  value={formData.origin}
                  onChange={e => setFormData({...formData, origin: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Destination</label>
                <input 
                  type="text" 
                  placeholder="e.g. Maitama, Abuja"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                  value={formData.destination}
                  onChange={e => setFormData({...formData, destination: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input 
                  type="date" 
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Time</label>
                <input 
                  type="time" 
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                  value={formData.time}
                  onChange={e => setFormData({...formData, time: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Available Seats</label>
                <input 
                  type="number" 
                  min="1" 
                  max="6"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                  value={formData.seats}
                  onChange={e => setFormData({...formData, seats: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Price per Seat (₦)</label>
                <input 
                  type="number" 
                  min="0"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: parseInt(e.target.value)})}
                />
              </div>
              <div className="md:col-span-2 flex justify-end gap-2 mt-4">
                <button 
                  type="button" 
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                  Publish Ride
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Rides List */}
        <div className="space-y-4">
          {loading ? (
            <p>Loading rides...</p>
          ) : rides.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm">
              <p className="text-gray-500">No active trajectories. Post one to start earning!</p>
            </div>
          ) : (
            rides.map((ride) => (
              <div key={ride.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center">
                <div className="space-y-2">
                    <div className="flex items-center text-lg font-semibold text-gray-900">
                        <MapPin className="w-5 h-5 text-teal-600 mr-2" />
                        {ride.origin} <span className="mx-2 text-gray-400">→</span> {ride.destination}
                    </div>
                    <div className="flex items-center text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        {format(new Date(ride.departure_time), 'MMM d, yyyy h:mm a')}
                    </div>
                    <div className="flex items-center text-gray-600">
                        <Users className="w-4 h-4 mr-2" />
                        {ride.total_seats} seats total
                    </div>
                </div>
                <div className="mt-4 md:mt-0 text-right">
                    <div className="text-2xl font-bold text-teal-600">₦{ride.price_per_seat}</div>
                    <div className="text-sm text-gray-500">per passenger</div>
                    <div className="mt-2 inline-flex px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 uppercase">
                        {ride.status}
                    </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}