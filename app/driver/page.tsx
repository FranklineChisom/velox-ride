'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Ride } from '@/types';
import { format } from 'date-fns';
import { MapPin, Clock, Users, Plus, Wallet, Trash2, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DriverDashboard() {
  const supabase = createClient();
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
        router.push('/auth?role=driver');
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
      // Reset form
      setFormData({ origin: '', destination: '', date: '', time: '', seats: 4, price: 0 });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* --- Premium Navigation --- */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold">V</div>
             <h1 className="text-lg font-bold text-slate-900">Driver Portal</h1>
          </div>
          <button onClick={handleLogout} className="text-sm font-semibold text-slate-500 hover:text-red-600 transition">
            Sign Out
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto py-10 px-6">
        
        {/* --- Header Section --- */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">My Schedule</h2>
            <p className="text-slate-500">Manage your upcoming trips and earnings.</p>
          </div>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="flex items-center px-6 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition shadow-lg shadow-teal-500/20"
          >
            <Plus className="w-5 h-5 mr-2" />
            Post New Ride
          </button>
        </div>

        {/* --- Create Ride Form (Animated) --- */}
        {showForm && (
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 mb-10 animate-fade-in ring-1 ring-slate-900/5">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-lg font-bold flex items-center gap-2">
                 <ShieldCheck className="w-5 h-5 text-teal-600"/> New Trajectory
               </h3>
               <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">Cancel</button>
            </div>

            <form onSubmit={handleCreateRide} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pickup Location</label>
                <input 
                  type="text" 
                  placeholder="e.g. Gwarinpa, Abuja"
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                  value={formData.origin}
                  onChange={e => setFormData({...formData, origin: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Destination</label>
                <input 
                  type="text" 
                  placeholder="e.g. Maitama, Abuja"
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                  value={formData.destination}
                  onChange={e => setFormData({...formData, destination: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date</label>
                <input 
                  type="date" 
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Departure Time</label>
                <input 
                  type="time" 
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                  value={formData.time}
                  onChange={e => setFormData({...formData, time: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Available Seats</label>
                <input 
                  type="number" 
                  min="1" 
                  max="6"
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                  value={formData.seats}
                  // FIX: Handle NaN by defaulting to 0 or keeping it empty carefully
                  onChange={e => {
                    const val = parseInt(e.target.value);
                    setFormData({...formData, seats: isNaN(val) ? 0 : val})
                  }}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Price per Seat (₦)</label>
                <input 
                  type="number" 
                  min="0"
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                  value={formData.price}
                  // FIX: Handle NaN
                  onChange={e => {
                    const val = parseInt(e.target.value);
                    setFormData({...formData, price: isNaN(val) ? 0 : val})
                  }}
                />
              </div>
              <div className="md:col-span-2 pt-4">
                <button 
                  type="submit" 
                  className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition shadow-lg"
                >
                  Publish Ride
                </button>
              </div>
            </form>
          </div>
        )}

        {/* --- Rides List --- */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-20">
               <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full mx-auto mb-4"></div>
               <p className="text-slate-400 font-medium">Loading your schedule...</p>
            </div>
          ) : rides.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-2xl shadow-sm border border-slate-200 border-dashed">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Clock className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No upcoming trips</h3>
              <p className="text-slate-500 mb-6">You haven't posted any trajectories yet.</p>
              <button onClick={() => setShowForm(true)} className="text-teal-600 font-bold hover:underline">Post your first ride</button>
            </div>
          ) : (
            rides.map((ride) => (
              <div key={ride.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-teal-500 transition group relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-teal-500"></div>
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                   <div className="space-y-3">
                      <div className="flex items-center gap-3">
                         <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                           {format(new Date(ride.departure_time), 'MMM dd')}
                         </span>
                         <span className="text-xl font-black text-slate-900">
                           {format(new Date(ride.departure_time), 'h:mm a')}
                         </span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                          <div className="flex flex-col items-center gap-1">
                             <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                             <div className="w-0.5 h-6 bg-slate-200"></div>
                             <div className="w-2 h-2 rounded-full bg-slate-900"></div>
                          </div>
                          <div className="space-y-4">
                             <div className="text-base font-semibold text-slate-700">{ride.origin}</div>
                             <div className="text-base font-semibold text-slate-700">{ride.destination}</div>
                          </div>
                      </div>
                   </div>

                   <div className="mt-6 md:mt-0 flex items-center gap-8">
                      <div className="text-right">
                         <div className="flex items-center gap-2 text-slate-500 text-sm mb-1 justify-end">
                            <Users className="w-4 h-4" /> {ride.total_seats} seats
                         </div>
                         <div className="flex items-center gap-2 text-slate-900 font-bold text-xl">
                            <Wallet className="w-5 h-5 text-teal-600" /> ₦{ride.price_per_seat}
                         </div>
                      </div>
                      
                      <div className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 uppercase tracking-wider border border-green-200">
                          {ride.status}
                      </div>
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