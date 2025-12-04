'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Shield, Users, LogOut, Loader2 } from 'lucide-react';
import UserCreateForm from '@/components/UserCreateForm';
import UserList from '@/components/UserList';

export default function AdminDashboard() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
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
      <aside className="w-64 bg-slate-900 text-white p-6 flex flex-col fixed h-full overflow-y-auto">
        <div className="flex items-center gap-3 mb-10">
           <div className="w-8 h-8 bg-white text-black rounded-lg flex items-center justify-center font-bold">V</div>
           <span className="font-bold text-lg">Superadmin</span>
        </div>
        <nav className="flex-1 space-y-2">
           <button className="flex items-center gap-3 p-3 bg-white/10 rounded-xl w-full font-medium"><Shield className="w-5 h-5"/> Master Control</button>
        </nav>
        <button onClick={async () => { await supabase.auth.signOut(); router.push('/'); }} className="flex items-center gap-3 p-3 text-red-400 hover:bg-white/5 rounded-xl transition mt-auto">
          <LogOut className="w-5 h-5"/> Sign Out
        </button>
      </aside>

      <main className="ml-64 p-10 w-full">
         <h1 className="text-3xl font-bold text-slate-900 mb-8">System Administration</h1>
         
         <div className="grid lg:grid-cols-3 gap-8">
            {/* Create User Column */}
            <div className="lg:col-span-1">
               <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Users className="w-5 h-5"/> Create User</h2>
               <p className="text-slate-500 mb-4 text-sm">Create any user role directly. Requires Service Role Key.</p>
               <UserCreateForm currentUserRole="superadmin" />
            </div>
            
            {/* User List Column */}
            <div className="lg:col-span-2">
               <h2 className="text-xl font-bold mb-4">Manage Users</h2>
               <UserList currentUserRole="superadmin" />
            </div>
         </div>
      </main>
    </div>
  );
}