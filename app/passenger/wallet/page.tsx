'use client';
import { CreditCard, Plus, ArrowDownLeft, ArrowUpRight, Wallet } from 'lucide-react';
import { APP_CONFIG } from '@/lib/constants';

export default function WalletPage() {
  const transactions = [
    { id: 1, type: 'debit', desc: 'Ride to Wuse 2', amount: 1200, date: 'Dec 02, 08:45 AM' },
    { id: 2, type: 'credit', desc: 'Wallet Top Up', amount: 5000, date: 'Dec 01, 10:00 AM' },
    { id: 3, type: 'debit', desc: 'Ride to Maitama', amount: 800, date: 'Nov 28, 05:45 PM' },
  ];

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Wallet</h1>

      <div className="grid md:grid-cols-3 gap-8 mb-10">
        
        {/* Main Card */}
        <div className="md:col-span-2 bg-black text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
           <div className="relative z-10 flex flex-col h-full justify-between min-h-[200px]">
              <div className="flex justify-between items-start">
                 <div>
                    <p className="text-slate-400 text-sm font-medium mb-1">Available Balance</p>
                    <h2 className="text-5xl font-bold">{APP_CONFIG.currency}2,350.00</h2>
                 </div>
                 <div className="p-3 bg-white/10 rounded-xl">
                    <Wallet className="w-6 h-6 text-white" />
                 </div>
              </div>
              <div className="flex gap-4 mt-8">
                 <button className="flex-1 bg-white text-black py-3 rounded-xl font-bold hover:bg-slate-200 transition flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" /> Add Funds
                 </button>
                 <button className="flex-1 bg-white/10 text-white py-3 rounded-xl font-bold hover:bg-white/20 transition backdrop-blur-sm">
                    Transfer
                 </button>
              </div>
           </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white border border-slate-200 p-6 rounded-[2rem] flex flex-col justify-center">
           <h3 className="font-bold text-slate-900 mb-4">Payment Method</h3>
           <div className="flex items-center gap-4 p-4 border border-slate-100 rounded-xl mb-4 bg-slate-50">
              <div className="w-10 h-6 bg-slate-800 rounded flex items-center justify-center text-white text-[8px] font-bold tracking-widest">VISA</div>
              <div>
                 <div className="text-xs text-slate-500">Ending in</div>
                 <div className="text-sm font-bold text-slate-900">•••• 4242</div>
              </div>
           </div>
           <button className="text-sm font-bold text-black underline hover:text-slate-600 text-center">Manage Cards</button>
        </div>
      </div>

      {/* Transactions */}
      <div>
         <h3 className="font-bold text-xl text-slate-900 mb-6">Recent Transactions</h3>
         <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden">
            {transactions.map((tx, i) => (
               <div key={tx.id} className={`p-5 flex items-center justify-between hover:bg-slate-50 transition ${i !== transactions.length - 1 ? 'border-b border-slate-50' : ''}`}>
                  <div className="flex items-center gap-4">
                     <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'credit' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-600'}`}>
                        {tx.type === 'credit' ? <ArrowDownLeft className="w-5 h-5"/> : <ArrowUpRight className="w-5 h-5"/>}
                     </div>
                     <div>
                        <div className="font-bold text-slate-900 text-sm">{tx.desc}</div>
                        <div className="text-xs text-slate-500">{tx.date}</div>
                     </div>
                  </div>
                  <div className={`font-bold ${tx.type === 'credit' ? 'text-green-600' : 'text-slate-900'}`}>
                     {tx.type === 'credit' ? '+' : '-'}{APP_CONFIG.currency}{tx.amount}
                  </div>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
}