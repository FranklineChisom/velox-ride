'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Shield, Users, AlertTriangle, Activity, Database, CheckCircle } from 'lucide-react';
import UserCreateForm from '@/components/UserCreateForm';
import UserList from '@/components/UserList';
import StatCard from '@/components/ui/StatCard';

export default function AdminDashboard() {
  const supabase = createClient();
  const [stats, setStats] = useState({ users: 0, rides: 0, pending: 0 });

  useEffect(() => {
    const fetchStats = async () => {
       const [u, r, p] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('rides').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'driver').eq('is_verified', false)
       ]);
       setStats({ users: u.count || 0, rides: r.count || 0, pending: p.count || 0 });
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
       {/* Stats */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard label="Total Users" value={stats.users.toString()} icon={Users} color="white" />
          <StatCard label="Total Rides" value={stats.rides.toString()} icon={Activity} color="white" />
          <StatCard label="Pending Drivers" value={stats.pending.toString()} icon={AlertTriangle} color={stats.pending > 0 ? "black" : "green"} />
       </div>

       <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Shield className="w-5 h-5 text-blue-600"/> Quick Actions</h3>
                <UserCreateForm currentUserRole="superadmin" />
             </div>
             
             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Database className="w-5 h-5 text-purple-600"/> System Health</h3>
                <div className="space-y-3">
                   <div className="flex justify-between items-center text-sm"><span className="text-slate-500">Database</span><span className="text-green-600 font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Healthy</span></div>
                   <div className="flex justify-between items-center text-sm"><span className="text-slate-500">Storage</span><span className="text-green-600 font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Healthy</span></div>
                   <div className="flex justify-between items-center text-sm"><span className="text-slate-500">API Latency</span><span className="text-slate-900 font-bold">45ms</span></div>
                </div>
             </div>
          </div>

          <div className="lg:col-span-2">
             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                   <h3 className="font-bold text-lg">User Management</h3>
                </div>
                <div className="p-0">
                   <UserList currentUserRole="superadmin" />
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}