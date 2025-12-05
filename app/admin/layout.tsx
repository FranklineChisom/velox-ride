'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Shield, BarChart, Users, Server, LogOut, Menu, X, Bell } from 'lucide-react';
import NotificationsPanel from '@/components/NotificationsPanel';

const ADMIN_NAV = [
  { label: 'Overview', href: '/admin', icon: Shield },
  { label: 'Financials', href: '/admin/finance', icon: BarChart },
  { label: 'Staff & Users', href: '/admin/staff', icon: Users },
  { label: 'System Health', href: '/admin/system', icon: Server },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-slate-900">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:static lg:block`}>
         <div className="p-8 flex items-center gap-3">
            <div className="w-8 h-8 bg-white text-slate-900 rounded-lg flex items-center justify-center font-bold">V</div>
            <span className="font-bold text-xl tracking-tight">Superadmin</span>
         </div>
         <nav className="px-4 space-y-2 mt-4">
            {ADMIN_NAV.map(item => (
               <Link 
                 key={item.href} 
                 href={item.href}
                 onClick={() => setMobileOpen(false)}
                 className={`flex items-center gap-3 p-3.5 rounded-xl transition-all font-medium text-sm ${pathname === item.href ? 'bg-white/10 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
               >
                  <item.icon className="w-5 h-5"/> {item.label}
               </Link>
            ))}
         </nav>
         <div className="absolute bottom-0 w-full p-6 border-t border-white/10">
            <button onClick={handleLogout} className="flex items-center gap-3 text-red-400 hover:text-red-300 font-bold text-sm w-full p-2 rounded-lg hover:bg-red-500/10 transition">
               <LogOut className="w-5 h-5"/> Sign Out
            </button>
         </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
         <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-30">
            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg"><Menu className="w-6 h-6"/></button>
            <h2 className="font-bold text-lg text-slate-900 hidden lg:block">System Overview</h2>
            <div className="flex items-center gap-4">
               <NotificationsPanel />
               <div className="w-9 h-9 bg-slate-200 rounded-full border border-slate-300 flex items-center justify-center font-bold text-slate-600">A</div>
            </div>
         </header>
         <main className="flex-1 p-8 overflow-y-auto">
            {children}
         </main>
      </div>
      
      {/* Mobile Overlay */}
      {mobileOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)}></div>}
    </div>
  );
}