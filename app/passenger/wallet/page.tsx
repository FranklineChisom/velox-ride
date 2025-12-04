'use client';
import { useState, useEffect } from 'react';
import { CreditCard, Plus, ArrowDownLeft, ArrowUpRight, Wallet, Loader2 } from 'lucide-react';
import { APP_CONFIG } from '@/lib/constants';
import { createClient } from '@/lib/supabase';
import { Wallet as WalletType, Transaction } from '@/types';
import { format } from 'date-fns';

export default function WalletPage() {
  const supabase = createClient();
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch wallet
      const { data: walletData } = await supabase.from('wallets').select('*').eq('user_id', user.id).single();
      if (walletData) {
        setWallet(walletData);
        // Fetch transactions
        const { data: txData } = await supabase
          .from('transactions')
          .select('*')
          .eq('wallet_id', walletData.id)
          .order('created_at', { ascending: false });
        if (txData) setTransactions(txData);
      }
      setLoading(false);
    };
    fetchData();
  }, [supabase]);

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto pt-32">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Wallet</h1>

      <div className="grid md:grid-cols-3 gap-8 mb-10">
        
        {/* Main Card */}
        <div className="md:col-span-2 bg-black text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
           <div className="relative z-10 flex flex-col h-full justify-between min-h-[200px]">
              <div className="flex justify-between items-start">
                 <div>
                    <p className="text-slate-400 text-sm font-medium mb-1">Available Balance</p>
                    <h2 className="text-5xl font-bold">
                      {loading ? '...' : `${wallet?.currency || '₦'}${wallet?.balance?.toLocaleString() || '0.00'}`}
                    </h2>
                 </div>
                 <div className="p-3 bg-white/10 rounded-xl">
                    <Wallet className="w-6 h-6 text-white" />
                 </div>
              </div>
              <div className="flex gap-4 mt-8">
                 <button className="flex-1 bg-white text-black py-3 rounded-xl font-bold hover:bg-slate-200 transition flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" /> Add Funds
                 </button>
              </div>
           </div>
        </div>

        {/* Payment Method Stub */}
        <div className="bg-white border border-slate-200 p-6 rounded-[2rem] flex flex-col justify-center text-center">
           <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-4"/>
           <p className="text-slate-500 mb-4">No cards linked yet</p>
           <button className="text-sm font-bold text-black underline hover:text-slate-600">Add Payment Method</button>
        </div>
      </div>

      {/* Transactions */}
      <div>
         <h3 className="font-bold text-xl text-slate-900 mb-6">Recent Transactions</h3>
         <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden min-h-[200px]">
            {loading ? (
                <div className="flex items-center justify-center h-full py-10"><Loader2 className="animate-spin text-slate-300"/></div>
            ) : transactions.length === 0 ? (
                <div className="text-center py-10 text-slate-400 italic">No transactions yet</div>
            ) : (
                transactions.map((tx, i) => (
                   <div key={tx.id} className={`p-5 flex items-center justify-between hover:bg-slate-50 transition ${i !== transactions.length - 1 ? 'border-b border-slate-50' : ''}`}>
                      <div className="flex items-center gap-4">
                         <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'credit' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-600'}`}>
                            {tx.type === 'credit' ? <ArrowDownLeft className="w-5 h-5"/> : <ArrowUpRight className="w-5 h-5"/>}
                         </div>
                         <div>
                            <div className="font-bold text-slate-900 text-sm">{tx.description}</div>
                            <div className="text-xs text-slate-500">{format(new Date(tx.created_at), 'MMM dd, h:mm a')}</div>
                         </div>
                      </div>
                      <div className={`font-bold ${tx.type === 'credit' ? 'text-green-600' : 'text-slate-900'}`}>
                         {tx.type === 'credit' ? '+' : '-'}{wallet?.currency}{tx.amount}
                      </div>
                   </div>
                ))
            )}
         </div>
      </div>
    </div>
  );
}