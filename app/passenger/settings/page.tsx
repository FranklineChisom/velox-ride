'use client';
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { Profile, SavedPlace } from '@/types';
import { 
  Loader2, MapPin, Plus, Trash2, ChevronRight, FileText, 
  AlertCircle, CheckCircle, LogOut, CreditCard, Bell, Smartphone, Mail, ShieldCheck, Home, Briefcase, Edit2
} from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LocationInput from '@/components/LocationInput';
import Modal from '@/components/ui/Modal';
import { deleteMyAccount } from '@/app/actions';
import ImageUpload from '@/components/ui/ImageUpload';

// --- Sections ---

const ShortcutsSection = ({ places, onSave }: { places: SavedPlace[], onSave: (label: string, address: string, lat: number, lng: number) => Promise<void> }) => {
    const [editing, setEditing] = useState<'home' | 'work' | null>(null);
    const [tempAddress, setTempAddress] = useState('');
    const [tempCoords, setTempCoords] = useState<{lat: number, lng: number} | null>(null);
    const [loading, setLoading] = useState(false);

    const home = places.find(p => p.label.toLowerCase() === 'home');
    const work = places.find(p => p.label.toLowerCase() === 'work');

    const handleSave = async () => {
        if (!editing || !tempAddress || !tempCoords) return;
        setLoading(true);
        await onSave(editing, tempAddress, tempCoords.lat, tempCoords.lng);
        setLoading(false);
        setEditing(null);
    };

    return (
        <section className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm mb-6">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-lg mb-4"><MapPin className="w-5 h-5"/> Quick Access</h3>
            <div className="space-y-3">
                {/* Home Row */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="bg-blue-100 p-2 rounded-full text-blue-600"><Home className="w-4 h-4"/></div>
                        <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-500 uppercase">Home</p>
                            <p className="text-sm font-bold text-slate-900 truncate">{home?.address || 'Not set'}</p>
                        </div>
                    </div>
                    <button onClick={() => setEditing('home')} className="p-2 text-slate-400 hover:text-black bg-white rounded-lg shadow-sm border border-slate-100"><Edit2 className="w-3 h-3"/></button>
                </div>

                {/* Work Row */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="bg-orange-100 p-2 rounded-full text-orange-600"><Briefcase className="w-4 h-4"/></div>
                        <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-500 uppercase">Work</p>
                            <p className="text-sm font-bold text-slate-900 truncate">{work?.address || 'Not set'}</p>
                        </div>
                    </div>
                    <button onClick={() => setEditing('work')} className="p-2 text-slate-400 hover:text-black bg-white rounded-lg shadow-sm border border-slate-100"><Edit2 className="w-3 h-3"/></button>
                </div>
            </div>

            {/* Edit Modal inside section for simplicity */}
            {editing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-2xl animate-scale-up">
                        <h3 className="font-bold text-lg mb-4 capitalize">Set {editing} Address</h3>
                        <LocationInput 
                            value={tempAddress} 
                            onChange={(val, c) => { setTempAddress(val); if(c) setTempCoords(c); }} 
                            placeholder="Search location..." 
                        />
                        <div className="flex gap-2 mt-4">
                            <button onClick={() => setEditing(null)} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 text-sm">Cancel</button>
                            <button onClick={handleSave} disabled={loading || !tempAddress} className="flex-1 py-3 bg-black text-white rounded-xl font-bold hover:bg-slate-900 text-sm flex justify-center items-center gap-2">
                                {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

const SavedPlacesSection = ({ places, onAdd, onRemove }: any) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newPlace, setNewPlace] = useState({ label: '', address: '', lat: 0, lng: 0 });
  const [loading, setLoading] = useState(false);

  const otherPlaces = places.filter((p: SavedPlace) => !['home', 'work'].includes(p.label.toLowerCase()));

  const handleAdd = async () => {
    if (!newPlace.label || !newPlace.address) return;
    setLoading(true);
    await onAdd(newPlace);
    setLoading(false);
    setIsAdding(false);
    setNewPlace({ label: '', address: '', lat: 0, lng: 0 });
  };

  return (
    <section className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm mb-6">
      <div className="flex justify-between items-center mb-6">
         <h3 className="font-bold text-slate-900 flex items-center gap-2 text-lg"><MapPin className="w-5 h-5"/> Other Places</h3>
         {!isAdding && <button onClick={() => setIsAdding(true)} className="text-xs font-bold bg-slate-100 text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition flex items-center gap-1"><Plus className="w-3 h-3"/> Add</button>}
      </div>
      <div className="space-y-3">
         {otherPlaces.map((p: SavedPlace) => (
            <div key={p.id} className="flex justify-between items-center p-3 border border-slate-100 bg-slate-50 rounded-xl">
               <div className="overflow-hidden">
                   <div className="font-bold text-sm text-slate-900 truncate">{p.label}</div>
                   <div className="text-xs text-slate-500 truncate">{p.address}</div>
               </div>
               <button onClick={() => onRemove(p.id)} className="p-2 text-slate-300 hover:text-red-500 transition"><Trash2 className="w-4 h-4"/></button>
            </div>
         ))}
         {otherPlaces.length === 0 && !isAdding && <p className="text-sm text-slate-400 italic text-center py-4">No other places saved.</p>}
         {isAdding && (
            <div className="space-y-2 animate-fade-in p-4 bg-slate-50 rounded-2xl border border-slate-200">
               <input className="w-full p-3 border rounded-xl text-sm outline-none focus:border-black" placeholder="Label (e.g. Gym)" value={newPlace.label} onChange={e => setNewPlace({...newPlace, label: e.target.value})} />
               <LocationInput value={newPlace.address} onChange={(val, c) => { setNewPlace(prev => ({...prev, address: val, lat: c?.lat || 0, lng: c?.lng || 0})); }} placeholder="Search Address" />
               <div className="flex gap-2 mt-2">
                  <button onClick={handleAdd} disabled={loading} className="flex-1 bg-black text-white py-2.5 rounded-xl text-sm font-bold flex justify-center items-center gap-2">{loading ? <Loader2 className="w-3 h-3 animate-spin"/> : 'Save Place'}</button>
                  <button onClick={() => setIsAdding(false)} className="px-4 py-2.5 bg-white border rounded-xl text-sm font-bold hover:bg-slate-50">Cancel</button>
               </div>
            </div>
         )}
      </div>
    </section>
  );
};

const PaymentSection = () => {
    const [cards, setCards] = useState([{ id: 1, last4: '4242', brand: 'Visa' }]);
    return (
        <section className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm mb-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-900 flex items-center gap-2 text-lg"><CreditCard className="w-5 h-5"/> Payment Methods</h3>
                <button className="text-xs font-bold bg-slate-100 text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition flex items-center gap-1"><Plus className="w-3 h-3"/> Add Card</button>
            </div>
            <div className="space-y-3">
                {cards.map(c => (
                    <div key={c.id} className="flex justify-between items-center p-4 bg-slate-50 border border-slate-100 rounded-xl">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-6 bg-slate-200 rounded flex items-center justify-center text-[10px] font-bold text-slate-500 uppercase">{c.brand}</div>
                            <span className="text-sm font-bold text-slate-700">•••• {c.last4}</span>
                        </div>
                        <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded">Default</span>
                    </div>
                ))}
            </div>
        </section>
    );
};

const PreferencesSection = () => {
    const [toggles, setToggles] = useState({ push: true, email: true });
    const toggle = (key: keyof typeof toggles) => setToggles(prev => ({ ...prev, [key]: !prev[key] }));

    return (
        <section className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm mb-6">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-lg mb-6"><Bell className="w-5 h-5"/> Notifications</h3>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-50 rounded-lg"><Smartphone className="w-4 h-4 text-slate-500"/></div>
                        <div><p className="text-sm font-bold text-slate-900">Push Notifications</p><p className="text-xs text-slate-500">Ride updates & drivers</p></div>
                    </div>
                    <button onClick={() => toggle('push')} className={`w-10 h-6 rounded-full transition-colors ${toggles.push ? 'bg-black' : 'bg-slate-200'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform transform ${toggles.push ? 'translate-x-5' : 'translate-x-1'}`}></div>
                    </button>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-50 rounded-lg"><Mail className="w-4 h-4 text-slate-500"/></div>
                        <div><p className="text-sm font-bold text-slate-900">Email Updates</p><p className="text-xs text-slate-500">Receipts & promos</p></div>
                    </div>
                    <button onClick={() => toggle('email')} className={`w-10 h-6 rounded-full transition-colors ${toggles.email ? 'bg-black' : 'bg-slate-200'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform transform ${toggles.email ? 'translate-x-5' : 'translate-x-1'}`}></div>
                    </button>
                </div>
            </div>
        </section>
    );
};

export default function PassengerSettings() {
  const supabase = createClient();
  const { addToast } = useToast();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [places, setPlaces] = useState<SavedPlace[]>([]);
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [formData, setFormData] = useState({ full_name: '', phone_number: '', address: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth'); return; }

      const [profileRes, placesRes] = await Promise.all([
         supabase.from('profiles').select('*').eq('id', user.id).single(),
         supabase.from('saved_places').select('*').eq('user_id', user.id),
      ]);

      if (profileRes.data) {
        setProfile(profileRes.data);
        setFormData({ full_name: profileRes.data.full_name || '', phone_number: profileRes.data.phone_number || '', address: profileRes.data.address || '' });
      }
      if (placesRes.data) setPlaces(placesRes.data);
    } catch (e) {
      addToast("Failed to load settings", 'error');
    } finally {
      setLoading(false);
    }
  }, [supabase, router, addToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAvatarUpload = async (url: string) => {
    if (!profile) return;
    const { error } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', profile.id);
    if (!error) {
        setProfile({ ...profile, avatar_url: url });
        addToast("Profile photo updated", 'success');
    }
  };

  const updateProfile = async () => {
    if (!profile) return;
    setSavingProfile(true);
    const { error } = await supabase.from('profiles').update(formData).eq('id', profile.id);
    if (!error) {
      setProfile({ ...profile, ...formData });
      setIsEditingProfile(false);
      addToast("Profile updated", 'success');
    }
    setSavingProfile(false);
  };

  const addPlace = async (p: any) => { 
      if (!profile) return; 
      // Ensure label is unique or update existing
      const existing = places.find(pl => pl.label.toLowerCase() === p.label.toLowerCase());
      
      let error;
      if (existing) {
          // Update
          const { error: updateError } = await supabase.from('saved_places').update(p).eq('id', existing.id);
          error = updateError;
          if(!error) setPlaces(places.map(pl => pl.id === existing.id ? { ...pl, ...p } : pl));
      } else {
          // Insert
          const { data, error: insertError } = await supabase.from('saved_places').insert({ user_id: profile.id, ...p }).select().single();
          error = insertError;
          if (!error && data) setPlaces([...places, data]);
      }

      if (error) addToast('Failed to save place', 'error');
      else addToast('Place saved', 'success');
  };

  const saveShortcut = async (label: string, address: string, lat: number, lng: number) => {
      await addPlace({ label, address, lat, lng });
  };

  const removePlace = async (id: string) => { 
      const { error } = await supabase.from('saved_places').delete().eq('id', id); 
      if (!error) setPlaces(places.filter(p => p.id !== id)); 
  };

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/'); };
  const handleDeleteAccount = async () => { setDeleting(true); const res = await deleteMyAccount(); if (!res.error) { await supabase.auth.signOut(); router.push('/'); } else { addToast(res.error, 'error'); setDeleting(false); } };

  if (loading) return <div className="flex justify-center items-center h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-slate-300"/></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 pt-32 px-6">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Settings</h1>

      <div className="grid lg:grid-cols-2 gap-8">
         {/* Left Col */}
         <div className="space-y-8">
             <section className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                   <div className="flex items-center gap-6 w-full">
                      <div className="w-24 h-24 shrink-0">
                         <ImageUpload uid={profile?.id || ''} url={profile?.avatar_url} onUpload={handleAvatarUpload} />
                      </div>
                      <div className="flex-1">
                         <h2 className="text-2xl font-bold text-slate-900">{profile?.full_name}</h2>
                         <p className="text-slate-500">{profile?.email}</p>
                         
                         <div className="mt-3">
                            {profile?.is_verified && (
                                <span className="text-[10px] bg-green-100 text-green-700 px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5 w-fit border border-green-200">
                                    <ShieldCheck className="w-3.5 h-3.5 fill-green-600 text-white"/> Verified Account
                                </span>
                            )}
                         </div>
                      </div>
                   </div>
                   <button onClick={() => setIsEditingProfile(!isEditingProfile)} className="text-sm font-bold text-black underline hover:text-slate-600 transition whitespace-nowrap">{isEditingProfile ? 'Cancel' : 'Edit'}</button>
                </div>

                {isEditingProfile ? (
                  <div className="space-y-5 animate-fade-in max-w-xl mt-6">
                     <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-1"><label className="text-xs font-bold text-slate-400 uppercase">Full Name</label><input className="w-full p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-sm outline-none focus:border-black" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} /></div>
                        <div className="space-y-1"><label className="text-xs font-bold text-slate-400 uppercase">Phone</label><input type="tel" className="w-full p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-sm outline-none focus:border-black" value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} /></div>
                     </div>
                     <button onClick={updateProfile} disabled={savingProfile} className="bg-black text-white px-8 py-3 rounded-xl text-sm font-bold hover:bg-slate-800 transition shadow-lg flex items-center gap-2">{savingProfile && <Loader2 className="w-3 h-3 animate-spin"/>} Save Changes</button>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100 mt-6">
                     <div><label className="text-xs font-bold text-slate-400 uppercase block mb-1">Phone</label><p className="font-bold text-slate-900">{profile?.phone_number || '-'}</p></div>
                     <div><label className="text-xs font-bold text-slate-400 uppercase block mb-1">Home Address</label><p className="font-bold text-slate-900 truncate">{profile?.address || '-'}</p></div>
                  </div>
                )}
             </section>
             
             <PaymentSection />
         </div>

         {/* Right Col */}
         <div className="space-y-8">
             <ShortcutsSection places={places} onSave={saveShortcut} />
             <SavedPlacesSection places={places} onAdd={addPlace} onRemove={removePlace} />
             <PreferencesSection />
             
             <section className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm">
                 <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-lg"><FileText className="w-5 h-5"/> Legal & Support</h3>
                 <div className="divide-y divide-slate-50">
                    <Link href="/terms" className="w-full text-left p-4 hover:bg-slate-50 rounded-xl text-sm font-bold text-slate-600 flex justify-between items-center group transition">Terms of Service <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-black"/></Link>
                    <Link href="/privacy" className="w-full text-left p-4 hover:bg-slate-50 rounded-xl text-sm font-bold text-slate-600 flex justify-between items-center group transition">Privacy Policy <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-black"/></Link>
                    <Link href="/passenger/support" className="w-full text-left p-4 hover:bg-slate-50 rounded-xl text-sm font-bold text-slate-600 flex justify-between items-center group transition">Help Center <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-black"/></Link>
                 </div>
             </section>

             <div className="pt-4">
                 <button onClick={() => setLogoutModalOpen(true)} className="w-full bg-slate-100 text-slate-900 py-4 rounded-2xl font-bold hover:bg-slate-200 transition flex items-center justify-center gap-2 border border-slate-200"><LogOut className="w-5 h-5" /> Log Out</button>
                 <button onClick={() => setDeleteModalOpen(true)} className="w-full py-4 text-red-500 font-bold text-xs hover:text-red-700 transition">Delete Account</button>
             </div>
         </div>
      </div>

      {/* Modals */}
      <Modal isOpen={logoutModalOpen} onClose={() => setLogoutModalOpen(false)} title="Sign Out">
        <div className="text-center space-y-6"><p className="text-slate-600">Are you sure you want to end your session?</p><div className="flex gap-3"><button onClick={() => setLogoutModalOpen(false)} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition">Cancel</button><button onClick={handleLogout} className="flex-1 py-3 bg-black text-white rounded-xl font-bold hover:bg-slate-800 transition shadow-lg">Sign Out</button></div></div>
      </Modal>

      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Delete Account">
        <div className="space-y-6"><div className="bg-red-50 p-4 rounded-xl flex items-start gap-3 border border-red-100"><AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" /><p className="text-xs text-red-800 font-medium leading-relaxed"><strong>Warning:</strong> This action is permanent. All your ride history, wallet balance, and saved preferences will be erased immediately.</p></div><div className="flex gap-3 pt-2"><button onClick={() => setDeleteModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-900 rounded-xl font-bold hover:bg-slate-200 transition">Cancel</button><button onClick={handleDeleteAccount} disabled={deleting} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition flex items-center justify-center gap-2 shadow-lg shadow-red-600/20">{deleting ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Confirm Delete'}</button></div></div>
      </Modal>
    </div>
  );
}