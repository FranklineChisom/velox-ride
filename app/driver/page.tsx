'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { RideWithBookings, Profile } from '@/types';
import { APP_CONFIG } from '@/lib/constants';
import { 
  Loader2, TrendingUp, Calendar, Star, Plus, 
  AlertTriangle, CheckCircle, Navigation, Car, ShieldCheck // Added missing imports
} from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import CreateTripModal from '@/components/driver/CreateTripModal';
import RideManagerModal from '@/components/driver/RideManagerModal';
import StatCard from '@/components/ui/StatCard';
import { format, isToday } from 'date-fns';
import Link from 'next/link';

export default function DriverDashboard() {
  const supabase = createClient();
  const { addToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeRide, setActiveRide] = useState<RideWithBookings | null>(null);
  const [nextRide, setNextRide] = useState<RideWithBookings | null>(null);
  const [stats, setStats] = useState({ earnings: 0, totalRides: 0, rating: 5.0 });
  const [isVerified, setIsVerified] = useState(false);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRide, setSelectedRide] = useState<RideWithBookings | null>(null);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (profileData) {
        setProfile(profileData);
        setIsVerified(profileData.is_verified);
      }

      const { data: rides } = await supabase
        .from('rides')
        .select(`*, bookings(*, profiles(*))`)
        .eq('driver_id', user.id)
        .order('departure_time', { ascending: true });

      if (rides) {
        const typedRides = rides as unknown as RideWithBookings[];
        
        const completed = typedRides.filter(r => r.status === 'completed');
        const earnings = completed.reduce((sum, ride) => {
           const rideTotal = ride.bookings
             .filter(b => b.status === 'confirmed')
             .reduce((sub, b) => sub + (ride.price_per_seat * b.seats_booked), 0);
           return sum + rideTotal;
        }, 0);

        setStats({
          earnings,
          totalRides: completed.length,
          rating: 4.8 
        });

        const now = new Date();
        const active = typedRides.find(r => r.status === 'active' || (r.status === 'scheduled' && r.driver_arrived));
        
        const upcoming = typedRides.find(r => 
          r.status === 'scheduled' && 
          !r.driver_arrived && 
          new Date(r.departure_time) > now
        );

        setActiveRide(active || null);
        setNextRide(upcoming || null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) return <div className="flex justify-center items-center h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-slate-300"/></div>;

  return (
    <div className="space-y-8">
      
      {/* 1. Verification Alert */}
      {!isVerified && (
        <div className="bg-orange-50 border border-orange-200 p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center gap-4 shadow-sm animate-fade-in">
           <div className="p-3 bg-orange-100 rounded-full text-orange-600"><AlertTriangle className="w-6 h-6"/></div>
           <div className="flex-1">
              <h3 className="font-bold text-orange-900 text-lg">Account Verification Required</h3>
              <p className="text-orange-800/80 text-sm mt-1">To ensure safety, verify your documents before accepting passengers.</p>
           </div>
           <Link href="/driver/settings" className="bg-orange-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-700 transition whitespace-nowrap">
              Upload Documents
           </Link>
        </div>
      )}

      {/* 2. Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label="Total Earnings" 
          value={`${APP_CONFIG.currency}${stats.earnings.toLocaleString()}`} 
          icon={TrendingUp} 
          color="black"
        />
        <StatCard 
          label="Total Trips" 
          value={stats.totalRides.toString()} 
          subValue="Lifetime"
          icon={Calendar} 
        />
        <StatCard 
          label="Rating" 
          value={stats.rating.toFixed(1)} 
          subValue="Gold Driver"
          icon={Star} 
          color="green"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* 3. Main Action Area */}
        <div className="lg:col-span-2 space-y-6">
           <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900">Current Mission</h2>
              {isVerified && (
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition flex items-center gap-2 shadow-lg"
                >
                  <Plus className="w-4 h-4"/> New Trip
                </button>
              )}
           </div>

           {activeRide ? (
             <div className="bg-green-600 text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                <div className="relative z-10">
                   <div className="flex justify-between items-start mb-6">
                      <div className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                         <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span> Live Trip
                      </div>
                      <p className="font-mono text-xl opacity-90">{format(new Date(activeRide.departure_time), 'HH:mm')}</p>
                   </div>
                   
                   <div className="space-y-4 mb-8">
                      <div>
                         <p className="text-green-200 text-xs font-bold uppercase mb-1">Pickup</p>
                         <h3 className="text-2xl font-bold">{activeRide.origin}</h3>
                      </div>
                      <div className="w-0.5 h-8 bg-green-400/50 ml-1.5"></div>
                      <div>
                         <p className="text-green-200 text-xs font-bold uppercase mb-1">Dropoff</p>
                         <h3 className="text-2xl font-bold">{activeRide.destination}</h3>
                      </div>
                   </div>

                   <button 
                     onClick={() => setSelectedRide(activeRide)}
                     className="w-full bg-white text-green-700 py-4 rounded-xl font-bold text-lg hover:bg-green-50 transition shadow-lg flex items-center justify-center gap-2"
                   >
                     <Navigation className="w-5 h-5"/> Manage Journey
                   </button>
                </div>
             </div>
           ) : nextRide ? (
             <div 
               onClick={() => setSelectedRide(nextRide)}
               className="bg-white border border-slate-200 p-8 rounded-[2rem] hover:border-black transition cursor-pointer group shadow-sm"
             >
                <div className="flex justify-between items-start mb-6">
                   <div>
                      <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-1">Up Next</p>
                      <h3 className="text-slate-900 text-xl font-bold flex items-center gap-2">
                         {isToday(new Date(nextRide.departure_time)) ? 'Today' : format(new Date(nextRide.departure_time), 'MMM dd')}, 
                         {format(new Date(nextRide.departure_time), ' h:mm a')}
                      </h3>
                   </div>
                   <div className="bg-slate-100 p-3 rounded-full group-hover:bg-black group-hover:text-white transition">
                      <Calendar className="w-6 h-6"/>
                   </div>
                </div>
                
                <div className="flex items-center gap-4 mb-6">
                   <div className="flex-1 p-4 bg-slate-50 rounded-2xl">
                      <p className="text-slate-400 text-xs font-bold uppercase">Passengers</p>
                      <p className="text-slate-900 font-bold text-lg">{nextRide.bookings.length} / {nextRide.total_seats}</p>
                   </div>
                   <div className="flex-1 p-4 bg-slate-50 rounded-2xl">
                      <p className="text-slate-400 text-xs font-bold uppercase">Est. Earn</p>
                      <p className="text-slate-900 font-bold text-lg">{APP_CONFIG.currency}{nextRide.bookings.length * nextRide.price_per_seat}</p>
                   </div>
                </div>

                <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                   <span className="truncate max-w-[45%]">{nextRide.origin}</span>
                   <span className="text-slate-300">→</span>
                   <span className="truncate max-w-[45%]">{nextRide.destination}</span>
                </div>
             </div>
           ) : (
             <div className="bg-white border border-dashed border-slate-300 p-12 rounded-[2rem] text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-400">
                   <Navigation className="w-8 h-8"/>
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">No active missions</h3>
                <p className="text-slate-500 max-w-sm mb-6">Your schedule is clear. Create a trip to start earning money on your commute.</p>
                {isVerified ? (
                   <button onClick={() => setShowCreateModal(true)} className="text-black font-bold underline hover:text-slate-700">Schedule a Trip</button>
                ) : (
                   <Link href="/driver/settings" className="text-orange-600 font-bold underline">Verify Account First</Link>
                )}
             </div>
           )}
        </div>

        {/* 4. Right Column: Quick Status */}
        <div className="space-y-6">
           <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4">Vehicle Status</h3>
              <div className="space-y-4">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600"><Car className="w-5 h-5"/></div>
                    <div>
                       <p className="font-bold text-slate-900 text-sm">{profile?.vehicle_model || 'No Vehicle'}</p>
                       <p className="text-xs text-slate-500">{profile?.vehicle_plate}</p>
                    </div>
                 </div>
                 <div className="h-px bg-slate-50 w-full"></div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Insurance</span>
                    <span className="text-green-600 font-bold flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> Active</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Road Worthiness</span>
                    <span className="text-green-600 font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Valid</span>
                 </div>
              </div>
           </div>
        </div>

      </div>

      {/* Modals */}
      {showCreateModal && profile && (
        <CreateTripModal driverId={profile.id} onClose={() => setShowCreateModal(false)} onSuccess={fetchDashboardData} />
      )}
      {selectedRide && (
        <RideManagerModal ride={selectedRide} bookings={selectedRide.bookings} onClose={() => setSelectedRide(null)} onUpdate={fetchDashboardData} />
      )}
    </div>
  );
}