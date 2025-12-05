'use client';
import { useState } from 'react';
import { AuthService } from '@/lib/services/auth.service';
import { useToast } from '@/components/ui/ToastProvider';
import { Loader2, ArrowRight, UserCheck } from 'lucide-react';

export default function OnboardingGuarantor({ userId, onNext }: { userId: string, onNext: () => void }) {
  const [data, setData] = useState({ full_name: '', phone_number: '', relationship: '', address: '' });
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async () => {
    if(Object.values(data).some(v => !v)) { addToast('All fields required', 'error'); return; }
    setLoading(true);
    const { error } = await AuthService.saveGuarantor(userId, data);
    setLoading(false);
    if(error) addToast('Failed to save details', 'error'); else onNext();
  };

  return (
    <div className="space-y-6">
       <div className="text-center">
          <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4"><UserCheck className="w-8 h-8"/></div>
          <h2 className="text-2xl font-bold text-slate-900">Guarantor Details</h2>
          <p className="text-slate-500 text-sm mt-2">Required for driver verification.</p>
       </div>

       <div className="space-y-4">
          <input className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-black" placeholder="Guarantor Full Name" value={data.full_name} onChange={e => setData({...data, full_name: e.target.value})}/>
          <input className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-black" placeholder="Phone Number" type="tel" value={data.phone_number} onChange={e => setData({...data, phone_number: e.target.value})}/>
          <input className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-black" placeholder="Relationship (e.g. Sibling)" value={data.relationship} onChange={e => setData({...data, relationship: e.target.value})}/>
          <textarea className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-black resize-none h-24" placeholder="Residential Address" value={data.address} onChange={e => setData({...data, address: e.target.value})}/>
       </div>

       <button onClick={handleSubmit} disabled={loading} className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition flex items-center justify-center gap-2">
          {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : <>Save & Continue <ArrowRight className="w-5 h-5"/></>}
       </button>
    </div>
  );
}