'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Home, Clock, CreditCard, Settings, HelpCircle, LogOut } from 'lucide-react';
import { useState } from 'react';
import Modal from '@/components/ui/Modal';

const NAV_ITEMS = [
  { label: 'Home', href: '/passenger', icon: Home },
  { label: 'My Trips', href: '/passenger/trips', icon: Clock },
  { label: 'Wallet', href: '/passenger/wallet', icon: CreditCard },
  { label: 'Settings', href: '/passenger/settings', icon: Settings },
  { label: 'Help & Support', href: '/passenger/support', icon: HelpCircle },
];

export default function PassengerSidebar({ mobile, close }: { mobile?: boolean, close?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [logoutOpen, setLogoutOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className={`flex flex-col h-full bg-white ${mobile ? '' : 'border-r border-slate-100'}`}>
      <div className="p-8 flex items-center gap-3">
        <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center font-bold text-xl shadow-lg">V</div>
        <span className="font-bold text-xl text-slate-900 tracking-tight">Veluxeride</span>
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
          onClick={() => setLogoutOpen(true)}
          className="flex items-center gap-3 p-4 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 w-full transition-all group font-bold text-sm"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>

      <Modal isOpen={logoutOpen} onClose={() => setLogoutOpen(false)} title="Sign Out">
        <div className="text-center space-y-6">
          <p className="text-slate-600">Are you sure you want to log out?</p>
          <div className="flex gap-4">
            <button onClick={() => setLogoutOpen(false)} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold hover:bg-slate-50">Cancel</button>
            <button onClick={handleLogout} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700">Log Out</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}