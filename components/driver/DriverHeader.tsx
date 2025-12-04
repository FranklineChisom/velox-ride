'use client';
import { LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface DriverHeaderProps {
  isOnline: boolean;
  setIsOnline: (status: boolean) => void;
}

export default function DriverHeader({ isOnline, setIsOnline }: DriverHeaderProps) {
  const supabase = createClient();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center font-bold text-lg">V</div>
           <h1 className="font-bold text-slate-900">Driver Portal</h1>
        </div>
        
        <div className="flex items-center gap-6">
           <div className="flex items-center gap-3 bg-slate-100 px-1 py-1 rounded-full">
              <button 
                className={`text-xs font-bold px-3 py-1.5 rounded-full cursor-pointer transition ${!isOnline ? 'bg-white shadow text-black' : 'text-slate-500'}`} 
                onClick={() => setIsOnline(false)}
              >
                Offline
              </button>
              <button 
                className={`text-xs font-bold px-3 py-1.5 rounded-full cursor-pointer transition ${isOnline ? 'bg-green-500 text-white shadow' : 'text-slate-500'}`} 
                onClick={() => setIsOnline(true)}
              >
                Online
              </button>
           </div>
           <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition" title="Sign Out">
             <LogOut className="w-5 h-5"/>
           </button>
        </div>
      </div>
    </nav>
  );
}