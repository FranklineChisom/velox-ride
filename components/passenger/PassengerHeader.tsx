'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Menu, Wallet } from 'lucide-react';
import { Profile } from '@/types';
import { APP_CONFIG } from '@/lib/constants';
import Link from 'next/link';
import NotificationsPanel from '@/components/NotificationsPanel'; // Integrated

interface Props {
  onMenuClick: () => void;
}

export default function PassengerHeader({ onMenuClick }: Props) {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [profileRes, walletRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('wallets').select('balance').eq('user_id', user.id).single()
      ]);
      if (profileRes.data) setProfile(profileRes.data);
      if (walletRes.data) setBalance(walletRes.data.balance);
    };
    fetchData();
  }, [supabase]);

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 h-20 sticky top-0 z-30 px-6 lg:px-10 flex items-center justify-between">
      <div className="flex items-center gap-4 lg:hidden">
        <button onClick={onMenuClick} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"><Menu className="w-6 h-6" /></button>
        <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center font-bold">V</div>
      </div>
      <div className="hidden lg:block"><h2 className="font-bold text-slate-900 text-lg">{profile?.full_name ? `Hi, ${profile.full_name.split(' ')[0]}` : 'Welcome'}</h2></div>
      <div className="flex items-center gap-4 md:gap-6">
        <Link href="/passenger/wallet" className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-full border border-slate-200 hover:bg-slate-200 transition group">
           <Wallet className="w-4 h-4 text-slate-500 group-hover:text-black"/>
           <span className="text-xs font-bold text-slate-900">{APP_CONFIG.currency}{balance.toLocaleString()}</span>
        </Link>
        <NotificationsPanel />
        <Link href="/passenger/settings" className="w-9 h-9 bg-slate-200 rounded-full overflow-hidden border border-slate-100 ring-2 ring-transparent hover:ring-slate-200 transition">
           {profile?.avatar_url && <img src={profile.avatar_url} className="w-full h-full object-cover" />}
        </Link>
      </div>
    </header>
  );
}