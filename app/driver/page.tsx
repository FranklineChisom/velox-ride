'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Ride } from '@/types';
import { format } from 'date-fns';
import { MapPin, Clock, Users, Plus, Wallet, Trash2, ShieldCheck, ArrowUpRight } from 'lucide-react';
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
      fetchDriverRides();
      setFormData({ origin: '', destination: '', date: '', time: '', seats: 4, price: 0 });
    }
  };

  return (
    <div className="min-h-screen bg-velox-midnight font-sans text-white">
      {/* --- Premium Navigation --- */}
      <nav className="glass-nav border-b border-white/5 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-velox-gold text-velox-midnight rounded-xl flex items-center justify-center font-bold text-lg">V</div>
             <h1 className="text-xl font-bold text-white tracking-wide">Driver <span className="text-velox-gold">Portal</span></h1>
          </div>
          <button onClick={handleLogout} className="text-sm font-semibold text-gray-400 hover:text-white transition">
            Sign Out
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto py-12 px-6">
        
        {/* --- Header Section --- */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <h2 className="text-3xl font-extrabold text-white mb-2">My Schedule</h2>
            <p className="text-gray-400">Manage your upcoming trajectories and earnings.</p>
          </div>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="flex items-center px-6 py-4 bg-velox-gold text-velox-midnight rounded-xl font-bold hover:bg-yellow-400 transition shadow-lg shadow-velox-gold/10"
          >
            <Plus className="w-5 h-5 mr-2" />
            Publish New Ride
          </button>
        </div>

        {/* --- Create Ride Form (Animated) --- */}
        {showForm && (
          <div className="bg-velox-navy/50 backdrop-blur-sm p-8 rounded-3xl border border-white/10 mb-12 animate-fade-in ring-1 ring-velox-gold/20">
            <div className="flex justify-between items-center mb-8">
               <h3 className="text-lg font-bold flex items-center gap-2 text-velox-gold">
                 <ShieldCheck className="w-5 h-5"/> New Trajectory
               </h3>
               <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white transition">Cancel</button>
            </div>

            <form onSubmit={handleCreateRide} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pickup Location</label>
                <input 
                  type="text" 
                  placeholder="e.g. Gwarinpa, Abuja"
                  required
                  className="w-full p-4 bg-velox-midnight border border-white/10 rounded-xl font-medium focus:ring-1 focus:ring-velox-gold outline-none text-white transition"
                  value={formData.origin}
                  onChange={e => setFormData({...formData, origin: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Destination</label>
                <input 
                  type="text" 
                  placeholder="e.g. Maitama, Abuja"
                  required
                  className="w-full p-4 bg-velox-midnight border border-white/10 rounded-xl font-medium focus:ring-1 focus:ring-velox-gold outline-none text-white transition"
                  value={formData.destination}
                  onChange={e => setFormData({...formData, destination: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Date</label>
                <input 
                  type="date" 
                  required
                  className="w-full p-4 bg-velox-midnight border border-white/10 rounded-xl font-medium focus:ring-1 focus:ring-velox-gold outline-none text-white transition [color-scheme:dark]"
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Departure Time</label>
                <input 
                  type="time" 
                  required
                  className="w-full p-4 bg-velox-midnight border border-white/10 rounded-xl font-medium focus:ring-1 focus:ring-velox-gold outline-none text-white transition [color-scheme:dark]"
                  value={formData.time}
                  onChange={e => setFormData({...formData, time: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Available Seats</label>
                <input 
                  type="number" 
                  min="1" 
                  max="6"
                  required
                  className="w-full p-4 bg-velox-midnight border border-white/10 rounded-xl font-medium focus:ring-1 focus:ring-velox-gold outline-none text-white transition"
                  value={formData.seats}
                  onChange={e => setFormData({...formData, seats: parseInt(e.target.value) || 0})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Price per Seat (₦)</label>
                <input 
                  type="number" 
                  min="0"
                  required
                  className="w-full p-4 bg-velox-midnight border border-white/10 rounded-xl font-medium focus:ring-1 focus:ring-velox-gold outline-none text-white transition"
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: parseInt(e.target.value) || 0})}
                />
              </div>
              <div className="md:col-span-2 pt-6">
                <button 
                  type="submit" 
                  className="w-full py-4 bg-white text-velox-midnight rounded-xl font-bold hover:bg-gray-200 transition shadow-lg"
                >
                  Confirm Publication
                </button>
              </div>
            </form>
          </div>
        )}

        {/* --- Rides List --- */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-20">
               <div className="animate-spin w-8 h-8 border-4 border-velox-gold border-t-transparent rounded-full mx-auto mb-4"></div>
               <p className="text-gray-500 font-medium">Loading your schedule...</p>
            </div>
          ) : rides.length === 0 ? (
            <div className="text-center py-32 bg-white/5 rounded-3xl border border-white/5 border-dashed">
              <div className="w-16 h-16 bg-velox-midnight rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
                 <Clock className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No upcoming trips</h3>
              <p className="text-gray-500 mb-8">You haven't posted any trajectories yet.</p>
              <button onClick={() => setShowForm(true)} className="text-velox-gold font-bold hover:text-white transition flex items-center justify-center gap-2 mx-auto">
                Post your first ride <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            rides.map((ride) => (
              <div key={ride.id} className="bg-velox-navy/40 p-8 rounded-3xl border border-white/5 hover:border-velox-gold/30 transition group relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-velox-gold"></div>
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                   <div className="space-y-4">
                      <div className="flex items-center gap-4">
                         <span className="text-xs font-bold uppercase tracking-wider text-velox-gold">
                           {format(new Date(ride.departure_time), 'MMM dd')}
                         </span>
                         <span className="text-2xl font-black text-white">
                           {format(new Date(ride.departure_time), 'h:mm a')}
                         </span>
                      </div>
                      
                      <div className="flex items-center gap-4">
                          <div className="flex flex-col items-center gap-1">
                             <div className="w-2 h-2 rounded-full bg-velox-gold"></div>
                             <div className="w-0.5 h-8 bg-white/10"></div>
                             <div className="w-2 h-2 rounded-full bg-white"></div>
                          </div>
                          <div className="space-y-3">
                             <div className="text-lg font-medium text-gray-200">{ride.origin}</div>
                             <div className="text-lg font-medium text-gray-200">{ride.destination}</div>
                          </div>
                      </div>
                   </div>

                   <div className="mt-8 md:mt-0 flex items-center gap-10">
                      <div className="text-right">
                         <div className="flex items-center gap-2 text-gray-500 text-sm mb-2 justify-end">
                            <Users className="w-4 h-4" /> {ride.total_seats} seats
                         </div>
                         <div className="flex items-center gap-2 text-white font-bold text-2xl">
                            <span className="text-velox-gold">₦</span>{ride.price_per_seat}
                         </div>
                      </div>
                      
                      <div className="inline-flex px-4 py-2 rounded-full text-xs font-bold bg-green-500/10 text-green-400 uppercase tracking-wider border border-green-500/20">
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