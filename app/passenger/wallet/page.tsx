'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Wallet, Transaction } from '@/types';
import { APP_CONFIG } from '@/lib/constants';
import { Loader2, Plus, ArrowDownLeft, ArrowUpRight, CreditCard, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import Modal from '@/components/ui/Modal';
import { format } from 'date-fns';
import Script from 'next/script';

declare global { interface Window { PaystackPop: any; } }

export default function PassengerWalletPage() {
  const supabase = createClient();
  const { addToast } = useToast();
  
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');
  
  // Fund Modal
  const [fundModal, setFundModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [funding, setFunding] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserEmail(user.email || '');
      setUserId(user.id);

      const { data: wallet } = await supabase.from('wallets').select('*').eq('user_id', user.id).single();
      if (wallet) {
         setBalance(wallet.balance);
         const { data: txs } = await supabase.from('transactions').select('*').eq('wallet_id', wallet.id).order('created_at', { ascending: false });
         if (txs) setTransactions(txs);
      }
      setLoading(false);
    };
    fetchData();
  }, [supabase]);

  const handleFund = () => {
    if (!amount || isNaN(Number(amount))) return;
    if (typeof window.PaystackPop === 'undefined') {
       addToast("Payment gateway loading...", "info");
       return;
    }
    setFunding(true);
    
    const paystack = new window.PaystackPop();
    paystack.newTransaction({
      key: APP_CONFIG.paystackPublicKey,
      email: userEmail,
      amount: Number(amount) * 100,
      currency: 'NGN',
      onSuccess: async (tx: any) => {
         // 1. Get Wallet ID
         const { data: wallet } = await supabase.from('wallets').select('id, balance').eq('user_id', userId).single();
         
         if(wallet) {
             const newBal = wallet.balance + Number(amount);
             
             // 2. Update Balance
             const { error: walletError } = await supabase.from('wallets').update({ balance: newBal }).eq('id', wallet.id);
             
             if (!walletError) {
                 // 3. Insert Transaction
                 const { data: txRecord, error: txError } = await supabase.from('transactions').insert({
                     wallet_id: wallet.id, 
                     amount: Number(amount), 
                     type: 'credit', 
                     description: 'Wallet Deposit', 
                     status: 'success', 
                     reference: tx.reference
                 }).select().single();

                 if (!txError) {
                     setBalance(newBal);
                     if (txRecord) setTransactions([txRecord, ...transactions]);
                     addToast("Wallet funded successfully!", "success");
                     setFundModal(false);
                     setAmount('');
                 } else {
                     addToast("Funded but failed to record transaction.", "error");
                 }
             } else {
                 addToast("Failed to update wallet balance.", "error");
             }
         }
         setFunding(false);
      },
      onCancel: () => { setFunding(false); }
    });
  };

  if (loading) return <div className="flex justify-center items-center h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-slate-300"/></div>;

  return (
    <div className="space-y-8 pb-20 px-6 max-w-4xl mx-auto">
      <Script src="https://js.paystack.co/v1/inline.js" strategy="lazyOnload" />
      
      <div className="bg-black text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
         <div className="relative z-10">
            <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">My Balance</p>
            <h2 className="text-6xl font-bold mb-10 tracking-tight">{APP_CONFIG.currency}{balance.toLocaleString()}</h2>
            <button 
               onClick={() => setFundModal(true)}
               className="bg-white text-black px-8 py-4 rounded-xl font-bold hover:bg-slate-200 transition flex items-center gap-2"
            >
               <Plus className="w-5 h-5"/> Add Funds
            </button>
         </div>
         <div className="absolute right-0 bottom-0 w-64 h-64 bg-slate-800/50 rounded-full blur-3xl -mr-16 -mb-16"></div>
      </div>

      <div>
         <h3 className="font-bold text-slate-900 text-xl mb-6">Recent Activity</h3>
         <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden min-h-[200px]">
            {transactions.length === 0 ? (
               <div className="flex items-center justify-center h-48 text-slate-400 italic">No transactions yet.</div>
            ) : (
               transactions.map((tx, i) => (
                  <div key={tx.id} className={`p-5 flex items-center justify-between hover:bg-slate-50 transition ${i !== transactions.length - 1 ? 'border-b border-slate-50' : ''}`}>
                     <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'credit' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-600'}`}>
                           {tx.type === 'credit' ? <ArrowDownLeft className="w-5 h-5"/> : <ArrowUpRight className="w-5 h-5"/>}
                        </div>
                        <div>
                           <p className="font-bold text-slate-900 text-sm">{tx.description}</p>
                           <p className="text-xs text-slate-500">{format(new Date(tx.created_at), 'MMM dd, h:mm a')}</p>
                        </div>
                     </div>
                     <span className={`font-bold ${tx.type === 'credit' ? 'text-green-600' : 'text-slate-900'}`}>
                        {tx.type === 'credit' ? '+' : '-'}{APP_CONFIG.currency}{Number(tx.amount).toLocaleString()}
                     </span>
                  </div>
               ))
            )}
         </div>
      </div>

      <Modal isOpen={fundModal} onClose={() => setFundModal(false)} title="Fund Wallet">
         <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-xl flex gap-3 border border-blue-100">
               <AlertCircle className="w-5 h-5 text-blue-600 shrink-0"/>
               <p className="text-xs text-blue-800 leading-relaxed">Secure payments powered by Paystack.</p>
            </div>
            <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Amount</label>
               <div className="relative">
                  <span className="absolute top-4 left-4 text-slate-400 font-bold">{APP_CONFIG.currency}</span>
                  <input 
                     type="number" 
                     className="w-full p-4 pl-10 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-black font-bold text-lg"
                     placeholder="5000"
                     value={amount}
                     onChange={e => setAmount(e.target.value)}
                  />
               </div>
            </div>
            <button 
               onClick={handleFund} 
               disabled={funding || !amount}
               className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-slate-900 transition flex items-center justify-center gap-2"
            >
               {funding ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Pay Now'}
            </button>
         </div>
      </Modal>
    </div>
  );
}