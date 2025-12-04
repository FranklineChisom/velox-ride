'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { PASSENGER_NAV } from '@/lib/constants';
import { 
  Home, 
  Clock, 
  CreditCard, 
  Settings, 
  HelpCircle, 
  LogOut,
  User
} from 'lucide-react';

const iconMap: Record<string, any> = {
  Home,
  Clock,
  CreditCard,
  Settings,
  HelpCircle,
};

export default function PassengerSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className="hidden md:flex w-24 lg:w-64 flex-col bg-white border-r border-slate-100 h-screen sticky top-0 z-40">
      
      {/* Logo Area */}
      <div className="p-8 flex items-center justify-center lg:justify-start gap-3">
        <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-black/10">V</div>
        <span className="font-bold text-xl text-slate-900 hidden lg:block">VeloxRide</span>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-4 space-y-2 overflow-y-auto py-4">
        {PASSENGER_NAV.map((item) => {
          const Icon = iconMap[item.icon];
          const isActive = pathname === item.href;
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center gap-4 p-3.5 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-black text-white shadow-lg shadow-black/10' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-900'}`} />
              <span className="font-bold text-sm hidden lg:block">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-50">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-4 p-3.5 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 w-full transition-all group"
        >
          <LogOut className="w-6 h-6" />
          <span className="font-bold text-sm hidden lg:block">Log Out</span>
        </button>
      </div>
    </div>
  );
}