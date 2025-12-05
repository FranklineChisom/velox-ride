'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { APP_CONFIG } from '@/lib/constants';
import { Loader2, ArrowUpRight, TrendingUp, DollarSign, Wallet, FileText } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';

export default function DriverEarningsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [stats, setStats] = useState({ gross: 0, net: 0, commission: 0, levy: 0 });

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Wallet Balance
      const { data: wallet } = await supabase.from('wallets').select('*').eq('user_id', user.id).single();
      if (wallet) setBalance(wallet.balance);

      // 2. Earnings Calculation
      const { data: rides } = await supabase
        .from('rides')
        .select('price_per_seat, bookings(seats_booked)')
        .eq('driver_id', user.id)
        .eq('status', 'completed')
        .eq('bookings.status', 'confirmed');

      let gross = 0;
      if (rides) {
        rides.forEach((ride: any) => {
           gross += ride.bookings.reduce((sum: number, b: any) => sum + (ride.price_per_seat * b.seats_booked), 0);
        });
      }

      // Hardcoded platform logic for display (15% commission, 2% levy)
      const commission = gross * 0.15;
      const levy = gross * 0.02;
      const net = gross - commission - levy;

      setStats({ gross, commission, levy, net });
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <div className="flex justify-center items-center h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-slate-300"/></div>;

  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 gap-8">
         {/* Balance Card */}
         <div className="bg-black text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
               <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Available for Withdrawal</p>
               <h2 className="text-6xl font-bold mb-10 tracking-tight">{APP_CONFIG.currency}{balance.toLocaleString()}</h2>
               <div className="flex gap-4">
                  <button className="flex-1 bg-white text-black py-4 rounded-xl font-bold hover:bg-slate-200 transition flex items-center justify-center gap-2">
                     Request Payout <ArrowUpRight className="w-5 h-5"/>
                  </button>
               </div>
            </div>
            {/* Decor */}
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-slate-800/50 rounded-full blur-3xl"></div>
            <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-blue-900/20 rounded-full blur-3xl"></div>
         </div>

         {/* Breakdown */}
         <div className="space-y-6">
            <h3 className="font-bold text-slate-900 text-xl">Earnings Breakdown</h3>
            <div className="bg-white border border-slate-100 p-6 rounded-[2rem] space-y-4 shadow-sm">
               <div className="flex justify-between items-center p-2">
                  <span className="text-slate-500 font-medium">Gross Revenue</span>
                  <span className="font-bold text-slate-900">{APP_CONFIG.currency}{stats.gross.toLocaleString()}</span>
               </div>
               <div className="flex justify-between items-center p-2 text-red-500">
                  <span className="font-medium">Platform Fee (15%)</span>
                  <span className="font-bold">-{APP_CONFIG.currency}{stats.commission.toLocaleString()}</span>
               </div>
               <div className="flex justify-between items-center p-2 text-red-500">
                  <span className="font-medium">Govt Levy (2%)</span>
                  <span className="font-bold">-{APP_CONFIG.currency}{stats.levy.toLocaleString()}</span>
               </div>
               <div className="h-px bg-slate-100 w-full my-2"></div>
               <div className="flex justify-between items-center p-2 text-lg">
                  <span className="font-bold text-slate-900">Net Profit</span>
                  <span className="font-bold text-green-600">{APP_CONFIG.currency}{stats.net.toLocaleString()}</span>
               </div>
            </div>
         </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-[2rem] p-8">
         <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-900 text-lg">Recent Payouts</h3>
            <button className="text-slate-500 text-sm font-bold hover:text-black">View All</button>
         </div>
         <div className="text-center py-10 text-slate-400 italic bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            No payout history available.
         </div>
      </div>
    </div>
  );
}