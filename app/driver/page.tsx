'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Ride } from '@/types';
import { APP_CONFIG } from '@/lib/constants';
import { format } from 'date-fns';
import { Plus, LogOut, X, TrendingUp, Calendar, ChevronRight, Shield, Loader2, ArrowUpRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';

export default function DriverDashboard() {
  const supabase = createClient();
  const router = useRouter();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [user, setUser] = useState<User | null>(null);

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
    fetchDriverData();
  }, []);

  const fetchDriverData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        router.push('/auth?role=driver');
        return;
    }
    setUser(user);

    const { data } = await supabase
      .from('rides')
      .select('*')
      .eq('driver_id', user.id)
      .order('departure_time', { ascending: true });
    
    if (data) setRides(data);
    setLoading(false);
  };

  const handleCreateRide = async (e: React.FormEvent) => {
    e.preventDefault();
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
      alert(error.message);
    } else {
      setShowForm(false);
      fetchDriverData();
      setFormData({ origin: '', destination: '', date: '', time: '', seats: 4, price: 0 });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center font-bold text-lg">V</div>
             <h1 className="font-bold text-slate-900">Driver Portal</h1>
          </div>
          
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-3 bg-slate-100 px-1 py-1 rounded-full">
                <button 
                  className={`text-xs font-bold px-3 py-1.5 rounded-full cursor-pointer transition ${!isOnline ? 'bg-white shadow text-black' : 'text-slate-500'}`} 
                  onClick={() => setIsOnline(false)}
                >
                  Offline
                </button>
                <button 
                  className={`text-xs font-bold px-3 py-1.5 rounded-full cursor-pointer transition ${isOnline ? 'bg-green-500 text-white shadow' : 'text-slate-500'}`} 
                  onClick={() => setIsOnline(true)}
                >
                  Online
                </button>
             </div>
             <button onClick={async () => { await supabase.auth.signOut(); router.push('/'); }} className="text-slate-400 hover:text-red-500 transition" title="Sign Out">
               <LogOut className="w-5 h-5"/>
             </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-10 px-6">
        
        <div className="grid lg:grid-cols-3 gap-8">
           
           {/* Sidebar Stats */}
           <div className="space-y-6">
              {/* Earnings Card */}
              <div className="bg-black text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
                 <div className="relative z-10">
                    <p className="text-slate-400 text-sm font-medium mb-1">Today&apos;s Earnings</p>
                    <h2 className="text-4xl font-bold mb-4">{APP_CONFIG.currency}0</h2>
                    <div className="flex items-center gap-2 text-green-400 text-sm font-bold bg-white/10 w-fit px-3 py-1 rounded-full">
                       <TrendingUp className="w-4 h-4" /> --%
                    </div>
                 </div>
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                 <h3 className="font-bold text-slate-900 mb-4">Quick Actions</h3>
                 <div className="space-y-2">
                    <button onClick={() => setShowForm(true)} className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition group text-left">
                       <div className="flex items-center gap-3">
                          <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100"><Plus className="w-5 h-5 text-black"/></div>
                          <span className="font-bold text-sm">Post a Trip</span>
                       </div>
                       <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-black"/>
                    </button>
                    <button className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition group text-left">
                       <div className="flex items-center gap-3">
                          <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100"><Shield className="w-5 h-5 text-black"/></div>
                          <span className="font-bold text-sm">Documents</span>
                       </div>
                       <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-black"/>
                    </button>
                 </div>
              </div>
           </div>

           {/* Main Content */}
           <div className="lg:col-span-2">
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-bold text-slate-900">Upcoming Trajectories</h2>
                 <button onClick={() => setShowForm(true)} className="text-sm font-bold text-black underline hover:text-slate-600">Create New</button>
              </div>

              {/* Ride Creation Modal */}
              {showForm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                   <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-lg relative animate-fade-in">
                      <button onClick={() => setShowForm(false)} className="absolute top-6 right-6 text-slate-400 hover:text-black transition"><X/></button>
                      <h3 className="text-2xl font-bold mb-6">New Trip</h3>
                      <form onSubmit={handleCreateRide} className="space-y-4">
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                               <label className="text-xs font-bold text-slate-500 uppercase">Origin</label>
                               <input className="w-full p-3 bg-slate-50 rounded-xl font-medium outline-none focus:ring-2 focus:ring-black border border-slate-200" required placeholder="Gwarinpa" value={formData.origin} onChange={e => setFormData({...formData, origin: e.target.value})}/>
                            </div>
                            <div className="space-y-1">
                               <label className="text-xs font-bold text-slate-500 uppercase">Destination</label>
                               <input className="w-full p-3 bg-slate-50 rounded-xl font-medium outline-none focus:ring-2 focus:ring-black border border-slate-200" required placeholder="Wuse 2" value={formData.destination} onChange={e => setFormData({...formData, destination: e.target.value})}/>
                            </div>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                               <label className="text-xs font-bold text-slate-500 uppercase">Date</label>
                               <input type="date" className="w-full p-3 bg-slate-50 rounded-xl font-medium outline-none focus:ring-2 focus:ring-black border border-slate-200" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}/>
                            </div>
                            <div className="space-y-1">
                               <label className="text-xs font-bold text-slate-500 uppercase">Time</label>
                               <input type="time" className="w-full p-3 bg-slate-50 rounded-xl font-medium outline-none focus:ring-2 focus:ring-black border border-slate-200" required value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})}/>
                            </div>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                               <label className="text-xs font-bold text-slate-500 uppercase">Seats</label>
                               <input type="number" min="1" max="6" className="w-full p-3 bg-slate-50 rounded-xl font-medium outline-none focus:ring-2 focus:ring-black border border-slate-200" required value={formData.seats} onChange={e => setFormData({...formData, seats: parseInt(e.target.value) || 0})}/>
                            </div>
                            <div className="space-y-1">
                               <label className="text-xs font-bold text-slate-500 uppercase">Price ({APP_CONFIG.currency})</label>
                               <input type="number" min="0" className="w-full p-3 bg-slate-50 rounded-xl font-medium outline-none focus:ring-2 focus:ring-black border border-slate-200" required value={formData.price} onChange={e => setFormData({...formData, price: parseInt(e.target.value) || 0})}/>
                            </div>
                         </div>
                         <button type="submit" className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition mt-4 shadow-lg">Publish Trip</button>
                      </form>
                   </div>
                </div>
              )}

              <div className="space-y-4">
                {loading ? (
                   <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-300"/></div>
                ) : rides.length === 0 ? (
                   <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-300 text-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400"><Calendar className="w-8 h-8"/></div>
                      <h3 className="font-bold text-lg mb-2 text-slate-900">No trips scheduled</h3>
                      <button onClick={() => setShowForm(true)} className="text-black font-bold hover:underline">Create your first trip</button>
                   </div>
                ) : (
                   rides.map(ride => (
                      <div key={ride.id} className="bg-white p-6 rounded-2xl border border-slate-100 hover:shadow-md transition flex items-center justify-between group">
                         <div className="flex gap-6 items-center">
                            <div className="flex flex-col items-center">
                               <span className="text-xs font-bold text-slate-400 uppercase">{format(new Date(ride.departure_time), 'MMM')}</span>
                               <span className="text-2xl font-bold text-slate-900">{format(new Date(ride.departure_time), 'dd')}</span>
                            </div>
                            <div className="w-px h-10 bg-slate-100"></div>
                            <div>
                               <div className="text-xl font-bold text-slate-900 mb-1">{format(new Date(ride.departure_time), 'h:mm a')}</div>
                               <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                                  <span>{ride.origin}</span>
                                  <ArrowUpRight className="w-3 h-3 text-slate-400"/>
                                  <span>{ride.destination}</span>
                               </div>
                            </div>
                         </div>
                         <div className="text-right">
                            <div className="text-lg font-bold text-slate-900">{APP_CONFIG.currency}{ride.price_per_seat}</div>
                            <div className="text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded-full inline-block mt-1 uppercase tracking-wide">{ride.status}</div>
                         </div>
                      </div>
                   ))
                )}
              </div>
           </div>

        </div>
      </div>
    </div>
  );
}