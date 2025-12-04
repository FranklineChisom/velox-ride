'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, Users, LogOut, Loader2, MessageSquare } from 'lucide-react';

export default function StaffDashboard() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      // Superadmins can also access staff view
      const allowed = user?.user_metadata.role === 'employee' || user?.user_metadata.role === 'superadmin';
      
      if (!allowed) {
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
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col fixed h-full">
        <div className="flex items-center gap-3 mb-10">
           <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center font-bold">V</div>
           <span className="font-bold text-lg tracking-tight text-slate-900">Staff Portal</span>
        </div>
        
        <nav className="flex-1 space-y-2">
           <button className="flex items-center gap-3 p-3 bg-slate-100 rounded-xl w-full font-bold text-slate-900"><LayoutDashboard className="w-5 h-5"/> Dashboard</button>
           <button className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl w-full text-slate-500 hover:text-slate-900 transition"><Users className="w-5 h-5"/> Customer Support</button>
           <button className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl w-full text-slate-500 hover:text-slate-900 transition"><MessageSquare className="w-5 h-5"/> Tickets</button>
        </nav>

        <button 
          onClick={async () => { await supabase.auth.signOut(); router.push('/'); }} 
          className="flex items-center gap-3 p-3 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition"
        >
          <LogOut className="w-5 h-5"/> Sign Out
        </button>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-10 w-full">
         <h1 className="text-3xl font-bold text-slate-900 mb-8">Employee Workspace</h1>
         
         <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold mb-4">Pending Tasks</h2>
            <div className="space-y-4">
                {[1,2,3].map(i => (
                    <div key={i} className="p-4 border border-slate-100 rounded-xl flex justify-between items-center hover:bg-slate-50 transition cursor-pointer">
                        <div>
                            <div className="font-bold text-slate-900">Verify Driver Documents</div>
                            <div className="text-sm text-slate-500">Application #429{i} • 2 hours ago</div>
                        </div>
                        <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">Pending</span>
                    </div>
                ))}
            </div>
         </div>
      </main>
    </div>
  );
}