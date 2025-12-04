'use client';
import { useState, useEffect } from 'react';
import { CreditCard, Plus, ArrowDownLeft, ArrowUpRight, Wallet, Loader2, AlertTriangle, AlertCircle } from 'lucide-react';
import { APP_CONFIG } from '@/lib/constants';
import { createClient } from '@/lib/supabase';
import { Wallet as WalletType, Transaction } from '@/types';
import { format } from 'date-fns';
import Script from 'next/script';
import { useToast } from '@/components/ui/ToastProvider';
import Modal from '@/components/ui/Modal';

declare global {
  interface Window {
    PaystackPop: any;
  }
}

export default function WalletPage() {
  const supabase = createClient();
  const { addToast } = useToast();
  
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  
  // Funding Modal State
  const [fundModalOpen, setFundModalOpen] = useState(false);
  const [fundAmount, setFundAmount] = useState('');
  const [isFunding, setIsFunding] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserEmail(user.email || '');

      const { data: walletData } = await supabase.from('wallets').select('*').eq('user_id', user.id).single();
      if (walletData) {
        setWallet(walletData);
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

  const initPaystack = () => {
    if (!APP_CONFIG.paystackPublicKey) {
      addToast('System configuration error: Missing API Key', 'error');
      return;
    }
    if (!userEmail) return;
    
    if (typeof window.PaystackPop === 'undefined') {
      addToast('Payment system still initializing...', 'info');
      return;
    }

    const amount = Number(fundAmount);
    if (isNaN(amount) || amount <= 0) {
      addToast('Please enter a valid amount', 'error');
      return;
    }

    setIsFunding(true);
    const paystack = new window.PaystackPop();
    
    paystack.newTransaction({
      key: APP_CONFIG.paystackPublicKey,
      email: userEmail,
      amount: amount * 100, // Kobo
      currency: 'NGN',
      onSuccess: async (transaction: any) => {
        if (!wallet) return;
        
        // Optimistic update
        const newBalance = Number(wallet.balance) + amount;
        setWallet({ ...wallet, balance: newBalance });
        setFundModalOpen(false);
        setIsFunding(false);
        addToast(`Successfully funded ₦${amount.toLocaleString()}`, 'success');

        // Database Update
        await supabase.from('wallets').update({ balance: newBalance }).eq('id', wallet.id);
        
        const { data: newTx } = await supabase.from('transactions').insert({
            wallet_id: wallet.id,
            amount: amount,
            type: 'credit',
            description: 'Wallet Funding via Paystack',
            status: 'success',
            reference: transaction.reference
        }).select().single();

        if (newTx) setTransactions([newTx, ...transactions]);
      },
      onCancel: () => {
        setIsFunding(false);
        addToast('Transaction cancelled', 'info');
      }
    });
  };

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto pt-32">
      <Script src="https://js.paystack.co/v1/inline.js" strategy="lazyOnload" />
      
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Wallet</h1>

      {!APP_CONFIG.paystackPublicKey && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl mb-6 flex items-center gap-3 text-red-700 font-bold">
              <AlertTriangle className="w-5 h-5" />
              Paystack API Key is missing. Payments will not work.
          </div>
      )}

      <div className="grid md:grid-cols-3 gap-8 mb-10">
        {/* Balance Card */}
        <div className="md:col-span-2 bg-black text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
           <div className="relative z-10 flex flex-col h-full justify-between min-h-[200px]">
              <div className="flex justify-between items-start">
                 <div>
                    <p className="text-slate-400 text-sm font-medium mb-1">Available Balance</p>
                    <h2 className="text-5xl font-bold tracking-tight">
                      {loading ? '...' : `${wallet?.currency || '₦'}${Number(wallet?.balance || 0).toLocaleString()}`}
                    </h2>
                 </div>
                 <div className="p-3 bg-white/10 rounded-xl">
                    <Wallet className="w-6 h-6 text-white" />
                 </div>
              </div>
              <div className="flex gap-4 mt-8">
                 <button 
                   onClick={() => setFundModalOpen(true)}
                   className="flex-1 bg-white text-black py-3 rounded-xl font-bold hover:bg-slate-200 transition flex items-center justify-center gap-2"
                 >
                    <Plus className="w-4 h-4" /> Fund Wallet
                 </button>
              </div>
           </div>
        </div>

        {/* Info Card */}
        <div className="bg-white border border-slate-200 p-6 rounded-[2rem] flex flex-col justify-center text-center">
           <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-4"/>
           <p className="text-slate-500 mb-4">Secure payments powered by Paystack</p>
           <button onClick={() => setFundModalOpen(true)} className="text-sm font-bold text-black underline hover:text-slate-600">Add Funds Now</button>
        </div>
      </div>

      {/* Transactions List */}
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
                         {tx.type === 'credit' ? '+' : '-'}{wallet?.currency}{Number(tx.amount).toLocaleString()}
                      </div>
                   </div>
                ))
            )}
         </div>
      </div>

      {/* Funding Modal */}
      <Modal isOpen={fundModalOpen} onClose={() => setFundModalOpen(false)} title="Fund Wallet">
        <div className="space-y-6">
          <div className="bg-slate-50 p-4 rounded-xl flex gap-3 border border-slate-100">
            <AlertCircle className="w-5 h-5 text-slate-400"/>
            <p className="text-sm text-slate-600">Payments are processed securely via Paystack. Funds are added immediately.</p>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Amount (₦)</label>
            <input 
              type="number" 
              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-lg font-bold outline-none focus:border-black transition"
              placeholder="e.g. 5000"
              value={fundAmount}
              onChange={(e) => setFundAmount(e.target.value)}
              min="100"
            />
          </div>

          <button 
            onClick={initPaystack}
            disabled={isFunding || !fundAmount}
            className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-900 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isFunding ? <Loader2 className="animate-spin"/> : 'Proceed to Pay'}
          </button>
        </div>
      </Modal>
    </div>
  );
}