'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, LogOut, Loader2, Users } from 'lucide-react';
import UserCreateForm from '@/components/UserCreateForm';
import UserList from '@/components/UserList';

export default function ManagerDashboard() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      // Superadmin can also view manager dashboard
      if (!user || (user.user_metadata.role !== 'manager' && user.user_metadata.role !== 'superadmin')) {
        router.push('/');
        return;
      }
      setLoading(false);
    };
    checkUser();
  }, [router, supabase]);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin w-8 h-8"/></div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex">
      <aside className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col fixed h-full">
        <div className="flex items-center gap-3 mb-10">
           <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center font-bold">V</div>
           <span className="font-bold text-lg text-slate-900">Manager</span>
        </div>
        <nav className="flex-1 space-y-2">
           <button className="flex items-center gap-3 p-3 bg-slate-100 rounded-xl w-full font-bold text-slate-900"><LayoutDashboard className="w-5 h-5"/> Dashboard</button>
        </nav>
        <button onClick={async () => { await supabase.auth.signOut(); router.push('/'); }} className="flex items-center gap-3 p-3 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition mt-auto">
          <LogOut className="w-5 h-5"/> Sign Out
        </button>
      </aside>

      <main className="ml-64 p-10 w-full">
         <h1 className="text-3xl font-bold text-slate-900 mb-8">Manager Dashboard</h1>
         
         <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Users className="w-5 h-5"/> Onboard Staff & Drivers</h2>
                <UserCreateForm currentUserRole="manager" />
            </div>
            
            <div className="lg:col-span-2">
               <h2 className="text-xl font-bold mb-4">User Oversight</h2>
               <UserList currentUserRole="manager" />
            </div>
         </div>
      </main>
    </div>
  );
}