
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { LayoutDashboard, Map, DollarSign, Settings, LogOut } from 'lucide-react';
import { useState } from 'react';
import Modal from '@/components/ui/Modal';

const DRIVER_NAV = [
  { label: 'Overview', href: '/driver', icon: LayoutDashboard },
  { label: 'My Trips', href: '/driver/trips', icon: Map },
  { label: 'Earnings', href: '/driver/earnings', icon: DollarSign },
  { label: 'Settings', href: '/driver/settings', icon: Settings },
];

export default function DriverSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [logoutOpen, setLogoutOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <>
      <aside className="hidden lg:flex w-72 flex-col bg-white border-r border-slate-100 h-screen sticky top-0 z-40 shadow-nav">
        
        {/* Brand Area */}
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-black/10">V</div>
          <span className="font-bold text-xl text-slate-900 tracking-tight">Driver Portal</span>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-4 space-y-2 py-4">
          {DRIVER_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-300 group font-bold text-sm ${
                  isActive 
                    ? 'bg-black text-white shadow-lg shadow-black/10 translate-x-1' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-900'}`} />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-50">
          <button 
            onClick={() => setLogoutOpen(true)}
            className="flex items-center gap-3 p-4 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 w-full transition-all group font-bold text-sm"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      <Modal isOpen={logoutOpen} onClose={() => setLogoutOpen(false)} title="Confirm Logout">
        <div className="text-center space-y-6">
          <p className="text-slate-600">Are you sure you want to end your session?</p>
          <div className="flex gap-4">
            <button onClick={() => setLogoutOpen(false)} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition">Cancel</button>
            <button onClick={handleLogout} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition shadow-lg shadow-red-600/20">Log Out</button>
          </div>
        </div>
      </Modal>
    </>
  );
}