'use client';
import { useState } from 'react';
import { AuthService } from '@/lib/services/auth.service';
import { useToast } from '@/components/ui/ToastProvider';
import { Loader2, ArrowRight, User, Camera } from 'lucide-react';
import ImageUpload from '@/components/ui/ImageUpload';
import { Profile } from '@/types';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface Props { user: SupabaseUser; profile: Profile; onNext: () => void; }

export default function OnboardingProfile({ user, profile, onNext }: Props) {
  const [formData, setFormData] = useState({ full_name: profile.full_name || '', phone_number: profile.phone_number || '' });
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async () => {
    if(!formData.full_name || !formData.phone_number) return;
    setLoading(true);
    const { error } = await AuthService.updateProfile(user.id, formData);
    setLoading(false);
    if(error) addToast('Failed to save details', 'error'); else onNext();
  };

  return (
    <div className="space-y-6">
       <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900">Let's start with the basics</h2>
          <p className="text-slate-500 text-sm mt-2">We need your real identity to verify your account.</p>
       </div>

       <div className="flex justify-center mb-6">
          <div className="w-24 h-24 relative">
             <ImageUpload uid={user.id} url={profile.avatar_url || undefined} onUpload={async (url) => { await AuthService.updateProfile(user.id, { avatar_url: url }); }} />
             <div className="absolute -bottom-1 -right-1 bg-black text-white p-1.5 rounded-full"><Camera className="w-3 h-3"/></div>
          </div>
       </div>

       <div className="space-y-4">
          <div>
             <label className="text-xs font-bold text-slate-500 uppercase ml-1">Legal Name</label>
             <input value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-black font-medium" placeholder="As it appears on ID"/>
          </div>
          <div>
             <label className="text-xs font-bold text-slate-500 uppercase ml-1">Mobile Number</label>
             <input value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-black font-medium" placeholder="+234..."/>
          </div>
       </div>

       <button onClick={handleSubmit} disabled={loading} className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition flex items-center justify-center gap-2">
          {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : <>Continue <ArrowRight className="w-5 h-5"/></>}
       </button>
    </div>
  );
}