'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { Ride, Profile, Booking } from '@/types';
import { APP_CONFIG } from '@/lib/constants';
import { format } from 'date-fns';
import { 
  Plus, LogOut, TrendingUp, Calendar, ChevronRight, 
  Shield, Loader2, ArrowUpRight, AlertTriangle, CheckCircle, 
  User, Star, Car, Map, Clock 
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/ToastProvider';
import RideManagerModal from '@/components/driver/RideManagerModal';
import CreateTripModal from '@/components/driver/CreateTripModal';

// Extended interfaces for joins
interface RideWithBookings extends Ride {
  bookings: (Booking & { profiles: Profile })[];
}

export default function DriverDashboard() {
  const supabase = createClient();
  const router = useRouter();
  const { addToast } = useToast();
  
  // State
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [rides, setRides] = useState<RideWithBookings[]>([]);
  const [earnings, setEarnings] = useState(0);
  const [rating, setRating] = useState(5.0);
  const [isOnline, setIsOnline] = useState(false);
  const [activeRide, setActiveRide] = useState<RideWithBookings | null>(null); // Track currently active ride separately
  
  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRide, setSelectedRide] = useState<RideWithBookings | null>(null);

  const fetchDriverData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
          router.push('/auth?role=driver');
          return;
      }

      // 1. Fetch Profile
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (profileData) {
          setProfile(profileData);
          setIsOnline(profileData.is_online || false);
          
          // 2. Fetch Rating (via RPC function we created)
          const { data: ratingData } = await supabase.rpc('get_user_rating', { target_user_id: user.id });
          if (ratingData) setRating(ratingData);
      }

      // 3. Fetch Rides with Bookings (Nested Select)
      const { data: ridesData, error: ridesError } = await supabase
        .from('rides')
        .select(`
            *,
            bookings (
                *,
                profiles (*)
            )
        `)
        .eq('driver_id', user.id)
        .order('departure_time', { ascending: true });

      if (ridesError) throw ridesError;

      if (ridesData) {
          const typedRides = ridesData as unknown as RideWithBookings[];
          setRides(typedRides);
          
          // Find active ride
          const active = typedRides.find(r => r.status === 'active' || (r.status === 'scheduled' && r.driver_arrived));
          if (active) setActiveRide(active);
          else setActiveRide(null);

          // 4. Calculate Total Earnings (Simple Client-Side Calc)
          const total = typedRides.reduce((acc, ride) => {
              const rideEarnings = ride.bookings
                .filter(b => b.status === 'confirmed')
                .reduce((sum, b) => sum + (ride.price_per_seat * b.seats_booked), 0);
              return acc + rideEarnings;
          }, 0);
          setEarnings(total);
      }

    } catch (e: any) {
        console.error(e);
        addToast("Failed to load dashboard", 'error');
    } finally {
        setLoading(false);
    }
  }, [supabase, router, addToast]);

  useEffect(() => {
    fetchDriverData();
    
    // Realtime subscription for ride updates
    const channel = supabase.channel('driver-dashboard')
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'rides' }, 
        () => fetchDriverData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => fetchDriverData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDriverData, supabase]);

  const toggleOnline = async () => {
    if (!profile) return;
    const newState = !isOnline;
    setIsOnline(newState); // Optimistic update
    
    const { error } = await supabase.from('profiles').update({ is_online: newState }).eq('id', profile.id);
    if (error) {
        setIsOnline(!newState); // Revert on fail
        addToast("Failed to update status", 'error');
    } else {
        addToast(newState ? "You are now Online" : "You are now Offline", 'info');
    }
  };

  const handleManageRide = (ride: RideWithBookings) => {
    setSelectedRide(ride);
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-10 h-10 animate-spin text-black"/></div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      
      {/* Header */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center font-bold text-xl">V</div>
             <h1 className="font-bold text-slate-900 text-lg hidden sm:block">Driver Portal</h1>
          </div>
          
          <div className="flex items-center gap-4 md:gap-6">
             <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-full border border-slate-200">
                <button 
                  className={`text-xs font-bold px-4 py-2 rounded-full transition-all duration-300 ${!isOnline ? 'bg-white text-black shadow-sm scale-105' : 'text-slate-500 hover:text-slate-700'}`} 
                  onClick={() => isOnline && toggleOnline()}
                >
                  Offline
                </button>
                <button 
                  className={`text-xs font-bold px-4 py-2 rounded-full transition-all duration-300 ${isOnline ? 'bg-green-500 text-white shadow-sm scale-105' : 'text-slate-500 hover:text-slate-700'}`} 
                  onClick={() => !isOnline && toggleOnline()}
                >
                  Online
                </button>
             </div>
             <button onClick={async () => { await supabase.auth.signOut(); router.push('/'); }} className="text-slate-400 hover:text-red-600 transition p-2 rounded-full hover:bg-red-50">
               <LogOut className="w-5 h-5"/>
             </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-10 px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Welcome, {profile?.full_name?.split(' ')[0]}</h1>
                <p className="text-slate-500">Here's your overview for today.</p>
            </div>
            {activeRide && (
                <button 
                    onClick={() => handleManageRide(activeRide)}
                    className="bg-green-600 text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-green-600/20 hover:bg-green-700 transition flex items-center gap-2 animate-pulse"
                >
                    <Car className="w-5 h-5"/> Resume Active Trip
                </button>
            )}
        </div>
        
        <div className="grid lg:grid-cols-3 gap-8">
           
           {/* Left Sidebar: Stats & Actions */}
           <div className="space-y-6">
              
              {/* Earnings Card */}
              <div className="bg-black text-white p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group transition-all hover:scale-[1.02]">
                 <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Earnings</p>
                        <div className="bg-white/10 p-2 rounded-xl"><TrendingUp className="w-5 h-5 text-white"/></div>
                    </div>
                    <h2 className="text-5xl font-bold mb-4 tracking-tight">{APP_CONFIG.currency}{earnings.toLocaleString()}</h2>
                    <div className="flex items-center gap-3">
                       <div className="flex items-center gap-1 text-yellow-400 font-bold bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
                          <Star className="w-4 h-4 fill-current" /> {Number(rating).toFixed(1)}
                       </div>
                       <span className="text-slate-500 text-sm font-medium">Driver Rating</span>
                    </div>
                 </div>
                 <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/30 transition duration-700"></div>
              </div>

              {/* Status Alert */}
              {profile && !profile.is_verified ? (
                  <div className="bg-orange-50 border border-orange-100 p-6 rounded-3xl flex gap-4 items-start shadow-sm">
                      <div className="bg-orange-100 p-3 rounded-full shrink-0"><Shield className="w-6 h-6 text-orange-600"/></div>
                      <div>
                          <h4 className="font-bold text-orange-900 text-lg">Verification Pending</h4>
                          <p className="text-sm text-orange-800/80 mt-1 leading-relaxed">You cannot accept rides until your documents are verified by our team.</p>
                      </div>
                  </div>
              ) : (
                  <div className="bg-green-50 border border-green-100 p-6 rounded-3xl flex gap-4 items-center shadow-sm">
                      <div className="bg-green-100 p-3 rounded-full"><CheckCircle className="w-6 h-6 text-green-600"/></div>
                      <div>
                          <h4 className="font-bold text-green-900 text-lg">Account Verified</h4>
                          <p className="text-sm text-green-800/80 mt-1">You are fully approved to drive.</p>
                      </div>
                  </div>
              )}

              {/* Quick Actions */}
              <button 
                onClick={() => setShowCreateModal(true)} 
                disabled={!profile?.is_verified}
                className="w-full flex items-center justify-between p-6 rounded-3xl bg-white border border-slate-200 hover:border-black transition group shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md"
              >
                 <div className="flex items-center gap-4">
                    <div className="bg-slate-100 p-3 rounded-2xl group-hover:bg-black group-hover:text-white transition"><Plus className="w-6 h-6"/></div>
                    <div className="text-left">
                        <span className="font-bold text-lg block text-slate-900">Post a Trip</span>
                        <span className="text-slate-500 text-sm">Schedule a new ride</span>
                    </div>
                 </div>
                 <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-black"/>
              </button>
           </div>

           {/* Main Content: Schedule */}
           <div className="lg:col-span-2">
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl font-bold text-slate-900">Your Schedule</h2>
              </div>

              <div className="space-y-4">
                {rides.length === 0 ? (
                   <div className="bg-white p-16 rounded-[2.5rem] border border-dashed border-slate-300 text-center flex flex-col items-center justify-center h-[400px]">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-400"><Calendar className="w-10 h-10"/></div>
                      <h3 className="font-bold text-xl mb-2 text-slate-900">No upcoming trips</h3>
                      <p className="text-slate-500 max-w-sm mx-auto mb-6">You haven't scheduled any rides yet. Create one to start earning.</p>
                      <button onClick={() => setShowCreateModal(true)} className="text-black font-bold underline hover:text-slate-600">Create first trip</button>
                   </div>
                ) : (
                   rides.map(ride => {
                      const isComplete = ride.status === 'completed';
                      const isActive = ride.status === 'active' || (ride.status === 'scheduled' && ride.driver_arrived);
                      
                      return (
                        <div 
                            key={ride.id} 
                            onClick={() => handleManageRide(ride)}
                            className={`bg-white p-6 rounded-3xl border transition cursor-pointer group relative overflow-hidden ${
                                isActive ? 'border-green-500 ring-1 ring-green-500 shadow-lg' : 'border-slate-100 hover:border-slate-300 hover:shadow-lg'
                            } ${isComplete ? 'opacity-70 grayscale' : ''}`}
                        >
                            {/* Active Indicator */}
                            {isActive && <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl tracking-wider">LIVE</div>}
                            
                            <div className="flex flex-col md:flex-row md:items-center gap-6">
                                {/* Date Box */}
                                <div className={`flex md:flex-col items-center gap-2 md:gap-0 p-4 rounded-2xl min-w-[90px] justify-center text-center ${isActive ? 'bg-green-50 text-green-900' : 'bg-slate-50 text-slate-900'}`}>
                                    <span className="text-xs font-bold opacity-60 uppercase">{format(new Date(ride.departure_time), 'MMM')}</span>
                                    <span className="text-3xl font-bold">{format(new Date(ride.departure_time), 'dd')}</span>
                                    <span className="text-xs font-medium opacity-60">{format(new Date(ride.departure_time), 'EEE')}</span>
                                </div>
                                
                                {/* Ride Info */}
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                                        <Clock className="w-4 h-4"/>
                                        <span>{format(new Date(ride.departure_time), 'h:mm a')}</span>
                                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                        <span>{ride.total_seats - (ride.bookings?.length || 0)} seats open</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-lg font-bold text-slate-900">
                                        <span>{ride.origin}</span>
                                        <ArrowUpRight className="w-5 h-5 text-slate-300"/>
                                        <span>{ride.destination}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {ride.bookings && ride.bookings.length > 0 ? (
                                            <div className="flex -space-x-2">
                                                {ride.bookings.slice(0,3).map(b => (
                                                <div key={b.id} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center overflow-hidden">
                                                    {b.profiles?.avatar_url ? <img src={b.profiles.avatar_url} className="w-full h-full object-cover"/> : <User className="w-4 h-4 text-slate-500"/>}
                                                </div>
                                                ))}
                                                {ride.bookings.length > 3 && (
                                                <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">+{ride.bookings.length - 3}</div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-400 italic bg-slate-50 px-2 py-1 rounded-lg">No passengers yet</span>
                                        )}
                                    </div>
                                </div>

                                {/* Price */}
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-slate-900">{APP_CONFIG.currency}{ride.price_per_seat}</div>
                                    <div className={`text-xs font-bold px-3 py-1 rounded-full inline-block mt-2 uppercase tracking-wide ${
                                        ride.status === 'completed' ? 'bg-slate-100 text-slate-500' :
                                        isActive ? 'bg-green-100 text-green-700' : 
                                        'bg-blue-50 text-blue-700'
                                    }`}>
                                        {ride.status.replace('_', ' ')}
                                    </div>
                                </div>
                            </div>
                        </div>
                      );
                   })
                )}
              </div>
           </div>

        </div>
      </div>

      {/* Modals */}
      {showCreateModal && profile && (
        <CreateTripModal 
            driverId={profile.id} 
            onClose={() => setShowCreateModal(false)} 
            onSuccess={fetchDriverData}
        />
      )}

      {selectedRide && (
        <RideManagerModal 
            ride={selectedRide} 
            bookings={selectedRide.bookings} 
            onClose={() => setSelectedRide(null)}
            onUpdate={fetchDriverData}
        />
      )}
    </div>
  );
}