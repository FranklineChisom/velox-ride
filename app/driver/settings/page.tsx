'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Profile } from '@/types';
import { Loader2, Save, Car, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import ImageUpload from '@/components/ui/ImageUpload';

export default function DriverSettings() {
  const supabase = createClient();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({ vehicle_model: '', vehicle_plate: '', vehicle_color: '', phone_number: '' });

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) { setProfile(data); setFormData({ vehicle_model: data.vehicle_model || '', vehicle_plate: data.vehicle_plate || '', vehicle_color: data.vehicle_color || '', phone_number: data.phone_number || '' }); }
      setLoading(false);
    };
    getProfile();
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update(formData).eq('id', profile.id);
    if (error) addToast('Failed to update settings', 'error'); else addToast('Settings saved successfully', 'success');
    setSaving(false);
  };

  const handleAvatarUpload = async (url: string) => {
    if (!profile) return;
    const { error } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', profile.id);
    if (!error) { setProfile({ ...profile, avatar_url: url }); addToast("Profile photo updated", 'success'); }
  };

  const handleDocUpload = (docType: string, url: string) => { addToast(`${docType} uploaded successfully (Simulated)`, 'success'); };

  if (loading) return <div className="flex justify-center pt-20"><Loader2 className="w-8 h-8 animate-spin text-slate-300"/></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      <h1 className="text-3xl font-bold text-slate-900">Driver Profile</h1>
      <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6">
         <div className="w-24 h-24 shrink-0"><ImageUpload uid={profile?.id || ''} url={profile?.avatar_url} onUpload={handleAvatarUpload} /></div>
         <div><h2 className="font-bold text-2xl text-slate-900">{profile?.full_name}</h2><p className="text-slate-500">{profile?.email}</p><div className="flex gap-2 mt-2">{profile?.is_verified ? <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Verified Driver</span> : <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Verification Pending</span>}</div></div>
      </section>
      <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
         <h3 className="font-bold text-lg text-slate-900 mb-6 flex items-center gap-2"><Car className="w-5 h-5"/> Vehicle Details</h3>
         <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2"><label className="text-xs font-bold text-slate-400 uppercase">Model</label><input value={formData.vehicle_model} onChange={e => setFormData({...formData, vehicle_model: e.target.value})} placeholder="Toyota Camry" className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:border-black transition font-medium"/></div>
            <div className="space-y-2"><label className="text-xs font-bold text-slate-400 uppercase">Plate</label><input value={formData.vehicle_plate} onChange={e => setFormData({...formData, vehicle_plate: e.target.value})} placeholder="ABC-123DE" className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:border-black transition font-medium uppercase"/></div>
            <div className="space-y-2"><label className="text-xs font-bold text-slate-400 uppercase">Color</label><input value={formData.vehicle_color} onChange={e => setFormData({...formData, vehicle_color: e.target.value})} placeholder="Silver" className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:border-black transition font-medium"/></div>
            <div className="space-y-2"><label className="text-xs font-bold text-slate-400 uppercase">Phone</label><input value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:border-black transition font-medium"/></div>
         </div>
      </section>
      <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
         <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-lg text-slate-900 flex items-center gap-2"><FileText className="w-5 h-5"/> Documents</h3></div>
         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {['License', 'Insurance', 'Road Worthiness'].map((doc) => (<div key={doc} className="space-y-2"><p className="text-xs font-bold text-slate-500 uppercase">{doc}</p><ImageUpload uid={profile?.id || ''} onUpload={(url) => handleDocUpload(doc, url)} type="document" /></div>))}
         </div>
      </section>
      <button onClick={handleSave} disabled={saving} className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-slate-900 transition flex items-center justify-center gap-2 shadow-lg">{saving ? <Loader2 className="w-5 h-5 animate-spin"/> : <><Save className="w-5 h-5"/> Save Changes</>}</button>
    </div>
  );
}