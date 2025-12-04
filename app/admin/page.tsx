'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Shield, Users, BarChart, LogOut, Loader2, DollarSign, Activity } from 'lucide-react';
import { APP_CONFIG } from '@/lib/constants';

export default function AdminDashboard() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simple verification check handled by middleware, but good to have client check
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.user_metadata.role !== 'superadmin') {
        router.push('/');
        return;
      }
      setLoading(false);
    };
    checkUser();
  }, [router, supabase]);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin w-8 h-8"/></div>;

  return (
    <div className="min-h-screen bg-slate-100 font-sans flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white p-6 flex flex-col fixed h-full">
        <div className="flex items-center gap-3 mb-10">
           <div className="w-8 h-8 bg-white text-black rounded-lg flex items-center justify-center font-bold">V</div>
           <span className="font-bold text-lg tracking-tight">Admin Panel</span>
        </div>
        
        <nav className="flex-1 space-y-2">
           <button className="flex items-center gap-3 p-3 bg-white/10 rounded-xl w-full font-medium"><Shield className="w-5 h-5"/> Overview</button>
           <button className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl w-full text-slate-400 hover:text-white transition"><Users className="w-5 h-5"/> Users</button>
           <button className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl w-full text-slate-400 hover:text-white transition"><Activity className="w-5 h-5"/> Live Rides</button>
           <button className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl w-full text-slate-400 hover:text-white transition"><BarChart className="w-5 h-5"/> Financials</button>
        </nav>

        <button 
          onClick={async () => { await supabase.auth.signOut(); router.push('/'); }} 
          className="flex items-center gap-3 p-3 text-red-400 hover:bg-white/5 rounded-xl transition"
        >
          <LogOut className="w-5 h-5"/> Sign Out
        </button>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-10 w-full">
         <h1 className="text-3xl font-bold text-slate-900 mb-8">System Overview</h1>
         
         {/* Stats Grid */}
         <div className="grid grid-cols-4 gap-6 mb-10">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
               <div className="flex items-center gap-3 text-slate-500 mb-2 font-medium text-sm"><Users className="w-4 h-4"/> Total Users</div>
               <div className="text-3xl font-bold text-slate-900">12,450</div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
               <div className="flex items-center gap-3 text-slate-500 mb-2 font-medium text-sm"><Activity className="w-4 h-4"/> Active Rides</div>
               <div className="text-3xl font-bold text-slate-900">84</div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
               <div className="flex items-center gap-3 text-slate-500 mb-2 font-medium text-sm"><DollarSign className="w-4 h-4"/> Revenue (Mo)</div>
               <div className="text-3xl font-bold text-slate-900">{APP_CONFIG.currency}4.2M</div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
               <div className="flex items-center gap-3 text-slate-500 mb-2 font-medium text-sm"><Shield className="w-4 h-4"/> Staff Online</div>
               <div className="text-3xl font-bold text-slate-900">12</div>
            </div>
         </div>

         {/* Placeholders for graphs/tables */}
         <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 min-h-[400px] flex items-center justify-center text-slate-400">
            Analytics Chart Placeholder
         </div>
      </main>
    </div>
  );
}