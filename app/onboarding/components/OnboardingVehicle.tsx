'use client';
import { useState } from 'react';
import { AuthService } from '@/lib/services/auth.service';
import { useToast } from '@/components/ui/ToastProvider';
import { Loader2, ArrowRight, Car } from 'lucide-react';

export default function OnboardingVehicle({ userId, onNext }: { userId: string, onNext: () => void }) {
  const [data, setData] = useState({ make: '', model: '', year: '', color: '', plate_number: '' });
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async () => {
    if(Object.values(data).some(v => !v)) { addToast('Please fill all fields', 'error'); return; }
    setLoading(true);
    const { error } = await AuthService.saveVehicle(userId, data);
    setLoading(false);
    if(error) addToast('Failed to save vehicle', 'error'); else onNext();
  };

  return (
    <div className="space-y-6">
       <div className="text-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4"><Car className="w-8 h-8"/></div>
          <h2 className="text-2xl font-bold text-slate-900">Your Vehicle</h2>
          <p className="text-slate-500 text-sm mt-2">What will you be driving?</p>
       </div>

       <div className="grid grid-cols-2 gap-4">
          <input className="col-span-2 w-full p-4 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-black" placeholder="Plate Number (e.g. ABC-123XY)" value={data.plate_number} onChange={e => setData({...data, plate_number: e.target.value.toUpperCase()})}/>
          <input className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-black" placeholder="Make (Toyota)" value={data.make} onChange={e => setData({...data, make: e.target.value})}/>
          <input className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-black" placeholder="Model (Camry)" value={data.model} onChange={e => setData({...data, model: e.target.value})}/>
          <input className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-black" placeholder="Year (2015)" type="number" value={data.year} onChange={e => setData({...data, year: e.target.value})}/>
          <input className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-black" placeholder="Color" value={data.color} onChange={e => setData({...data, color: e.target.value})}/>
       </div>

       <button onClick={handleSubmit} disabled={loading} className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition flex items-center justify-center gap-2">
          {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : <>Save Vehicle <ArrowRight className="w-5 h-5"/></>}
       </button>
    </div>
  );
}