'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { 
  LayoutDashboard, Map, DollarSign, Settings, LogOut, 
  Menu, X, Bell, ShieldCheck, Car 
} from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import { Profile } from '@/types';

// --- Sidebar Component ---
const DriverSidebar = ({ mobile, close }: { mobile?: boolean, close?: () => void }) => {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const NAV_ITEMS = [
    { label: 'Overview', href: '/driver', icon: LayoutDashboard },
    { label: 'My Trips', href: '/driver/trips', icon: Map },
    { label: 'Earnings', href: '/driver/earnings', icon: DollarSign },
    { label: 'Settings', href: '/driver/settings', icon: Settings },
  ];

  return (
    <div className={`flex flex-col h-full bg-white ${mobile ? '' : 'border-r border-slate-100'}`}>
      <div className="p-8 flex items-center gap-3">
        <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center font-bold text-xl shadow-lg">V</div>
        <span className="font-bold text-xl text-slate-900 tracking-tight">Driver Portal</span>
      </div>

      <div className="flex-1 px-4 space-y-2 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              onClick={close}
              className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-300 group font-bold text-sm ${
                isActive 
                  ? 'bg-black text-white shadow-md translate-x-1' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-900'}`} />
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="p-6 border-t border-slate-50">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 p-4 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 w-full transition-all group font-bold text-sm"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

// --- Main Layout ---
export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const supabase = createClient();
  const { addToast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) setProfile(data);
    };
    fetchProfile();
  }, []);

  const toggleStatus = async () => {
    if (!profile) return;
    const newStatus = !profile.is_online;
    
    // Optimistic Update
    setProfile({ ...profile, is_online: newStatus });
    
    const { error } = await supabase.from('profiles').update({ is_online: newStatus }).eq('id', profile.id);
    
    if (error) {
      setProfile({ ...profile, is_online: !newStatus }); // Revert
      addToast('Connection failed. Please try again.', 'error');
    } else {
      addToast(newStatus ? 'You are now Online' : 'You are now Offline', 'info');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50/50 font-sans text-slate-900">
      
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-72 sticky top-0 h-screen">
        <DriverSidebar />
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl animate-slide-right">
             <DriverSidebar mobile close={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 h-20 sticky top-0 z-30 px-6 lg:px-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-2 -ml-2 hover:bg-slate-100 rounded-lg">
              <Menu className="w-6 h-6 text-slate-600" />
            </button>
            <div className="hidden md:block">
              <h2 className="font-bold text-slate-900 text-lg">
                {profile?.full_name ? `Hello, ${profile.full_name.split(' ')[0]}` : 'Dashboard'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">Drive safe today.</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Status Switch */}
            <button 
              onClick={toggleStatus}
              className={`relative px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 transition-all shadow-sm ${
                profile?.is_online 
                  ? 'bg-green-100 text-green-700 border border-green-200' 
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}
            >
              <div className={`w-2.5 h-2.5 rounded-full ${profile?.is_online ? 'bg-green-600 animate-pulse' : 'bg-slate-400'}`}></div>
              {profile?.is_online ? 'Online' : 'Offline'}
            </button>

            <button className="p-2 relative hover:bg-slate-100 rounded-full transition">
               <Bell className="w-5 h-5 text-slate-600"/>
               <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
            
            <Link href="/driver/settings" className="w-9 h-9 bg-slate-200 rounded-full overflow-hidden border border-slate-100">
               {profile?.avatar_url && <img src={profile.avatar_url} className="w-full h-full object-cover" />}
            </Link>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-10 max-w-7xl w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}