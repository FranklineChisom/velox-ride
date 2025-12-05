'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Menu } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import { Profile } from '@/types';
import Link from 'next/link';
import NotificationsPanel from '@/components/NotificationsPanel'; // Integrated

interface Props {
  onMenuClick: () => void;
}

export default function DriverHeader({ onMenuClick }: Props) {
  const supabase = createClient();
  const { addToast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) setProfile(data);
    };
    fetchProfile();
  }, [supabase]);

  const toggleStatus = async (newStatus: boolean) => {
    if (!profile) return;
    setLoading(true);
    const previousStatus = profile.is_online;
    setProfile({ ...profile, is_online: newStatus });
    const { error } = await supabase.from('profiles').update({ is_online: newStatus }).eq('id', profile.id);
    if (error) {
      setProfile({ ...profile, is_online: previousStatus }); 
      addToast('Failed to update status', 'error');
    } else {
      addToast(newStatus ? 'You are now Online' : 'You are now Offline', 'info');
    }
    setLoading(false);
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 h-20 sticky top-0 z-30 px-6 lg:px-10 flex items-center justify-between">
      <div className="flex items-center gap-4 lg:hidden">
        <button onClick={onMenuClick} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"><Menu className="w-6 h-6" /></button>
        <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center font-bold">V</div>
      </div>
      <div className="hidden lg:block"><h2 className="font-bold text-slate-900 text-lg">{profile?.full_name ? `Welcome back, ${profile.full_name.split(' ')[0]}` : 'Dashboard'}</h2></div>
      <div className="flex items-center gap-4 md:gap-6">
        <div className="flex items-center bg-slate-100 p-1 rounded-full border border-slate-200">
           <button disabled={loading} onClick={() => toggleStatus(false)} className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 ${!profile?.is_online ? 'bg-white text-black shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Offline</button>
           <button disabled={loading} onClick={() => toggleStatus(true)} className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 flex items-center gap-2 ${profile?.is_online ? 'bg-green-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{profile?.is_online && <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>} Online</button>
        </div>
        <NotificationsPanel />
        <Link href="/driver/settings" className="lg:hidden w-8 h-8 bg-slate-200 rounded-full overflow-hidden">{profile?.avatar_url && <img src={profile.avatar_url} className="w-full h-full object-cover" />}</Link>
      </div>
    </header>
  );
}