'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Ride } from '@/types';
import { format } from 'date-fns';
import { MapPin, Search, Clock, CreditCard, Loader2, LogOut, Home as HomeIcon, Briefcase, Star, Settings, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { searchLocation, getRoute } from '@/lib/osm';
import dynamic from 'next/dynamic';

const LeafletMap = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-gray-50 flex items-center justify-center text-slate-400">Loading Map...</div>
});

export default function PassengerDashboard() {
  const supabase = createClient();
  const router = useRouter();
  const [activeView, setActiveView] = useState<'home' | 'trips' | 'wallet'>('home');
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  // Map State
  const [pickupCoords, setPickupCoords] = useState<{lat: number, lng: number} | undefined>(undefined);
  const [dropoffCoords, setDropoffCoords] = useState<{lat: number, lng: number} | undefined>(undefined);
  const [routePath, setRoutePath] = useState<[number, number][] | undefined>(undefined);

  useEffect(() => {
    getUser();
  }, []);

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if(user) setUserProfile(user);
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const SavedPlace = ({ icon, label, address }: { icon: any, label: string, address: string }) => (
    <div className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition">
      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-700">
        {icon}
      </div>
      <div>
        <div className="font-bold text-slate-900 text-sm">{label}</div>
        <div className="text-xs text-slate-500">{address}</div>
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-white flex overflow-hidden font-sans">
      
      {/* Sidebar Navigation */}
      <div className="w-20 bg-white border-r border-slate-100 flex flex-col items-center py-8 z-30">
         <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center font-bold text-xl mb-12">V</div>
         
         <div className="space-y-8 flex-1">
            <NavIcon icon={<HomeIcon />} label="Home" active={activeView === 'home'} onClick={() => setActiveView('home')} />
            <NavIcon icon={<Clock />} label="Trips" active={activeView === 'trips'} onClick={() => setActiveView('trips')} />
            <NavIcon icon={<CreditCard />} label="Wallet" active={activeView === 'wallet'} onClick={() => setActiveView('wallet')} />
            <NavIcon icon={<Settings />} label="Settings" active={false} onClick={() => {}} />
         </div>

         <button onClick={handleLogout} className="p-3 text-slate-400 hover:text-red-600 transition">
           <LogOut className="w-6 h-6" />
         </button>
      </div>

      {/* Main Content Panel */}
      <div className="w-[400px] bg-white border-r border-slate-100 flex flex-col z-20 shadow-xl">
         
         {/* User Header */}
         <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-xl text-slate-900">Good Afternoon</h2>
              <p className="text-sm text-slate-500">{userProfile?.user_metadata?.full_name || 'Passenger'}</p>
            </div>
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-slate-600" />
            </div>
         </div>

         {/* Scrollable Content */}
         <div className="flex-1 overflow-y-auto p-6">
            
            {activeView === 'home' && (
              <>
                {/* Search Trigger */}
                <div 
                  onClick={() => router.push('/search')}
                  className="bg-slate-50 p-4 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-slate-100 transition mb-8 ring-1 ring-slate-200"
                >
                   <Search className="w-5 h-5 text-slate-900" />
                   <span className="font-bold text-slate-700">Where are you going?</span>
                </div>

                {/* Saved Places */}
                <div className="mb-8">
                   <SavedPlace icon={<HomeIcon className="w-5 h-5" />} label="Home" address="Set your home address" />
                   <SavedPlace icon={<Briefcase className="w-5 h-5" />} label="Work" address="Set your work address" />
                </div>

                {/* Recent Activity Mock */}
                <div>
                   <h3 className="font-bold text-slate-900 mb-4">Recent</h3>
                   <div className="space-y-4">
                      {[1,2].map(i => (
                        <div key={i} className="flex gap-4 items-center">
                           <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center"><MapPin className="w-5 h-5 text-slate-500"/></div>
                           <div className="flex-1 border-b border-slate-50 pb-4">
                              <div className="font-bold text-slate-900 text-sm">Gwarinpa Estate</div>
                              <div className="text-xs text-slate-500">Abuja • 12km</div>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              </>
            )}

            {activeView === 'trips' && (
               <div className="text-center py-20 text-slate-400">
                 <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
                 <p>Your ride history will appear here.</p>
               </div>
            )}

            {activeView === 'wallet' && (
               <div className="bg-black text-white p-6 rounded-2xl mb-6 shadow-xl">
                  <div className="text-sm opacity-70 mb-1">Velox Balance</div>
                  <div className="text-3xl font-bold mb-4">₦0.00</div>
                  <button className="bg-white/20 hover:bg-white/30 w-full py-2 rounded-lg text-sm font-bold transition">Add Funds</button>
               </div>
            )}

         </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 h-full relative bg-slate-50">
         <LeafletMap 
            pickup={pickupCoords} 
            dropoff={dropoffCoords} 
            routeCoordinates={routePath} 
         />
      </div>
    </div>
  );
}

function NavIcon({ icon, label, active, onClick }: any) {
  return (
    <div onClick={onClick} className={`flex flex-col items-center gap-1 cursor-pointer transition group ${active ? 'text-black' : 'text-slate-400 hover:text-slate-600'}`}>
       <div className={`p-2 rounded-xl ${active ? 'bg-slate-100' : 'group-hover:bg-slate-50'}`}>
         {icon}
       </div>
       <span className="text-[10px] font-bold">{label}</span>
    </div>
  )
}