'use client';
import { useState, useEffect, useTransition } from 'react';
import { 
  User, Bell, Shield, MapPin, ChevronRight, Mail, Phone, Lock, 
  Loader2, Save, Trash2, Plus, X, LogOut, AlertTriangle, CreditCard,
  Heart, FileText, CheckCircle
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { SavedPlace, Profile, EmergencyContact, Coordinates } from '@/types';
import { useRouter } from 'next/navigation';
import LocationInput from '@/components/LocationInput';

// --- Emergency Contacts Component ---
const EmergencyContactsSection = ({ contacts, onAdd, onRemove }: { contacts: EmergencyContact[], onAdd: (c: any) => Promise<void>, onRemove: (id: string) => Promise<void> }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone_number: '', relationship: '' });
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if(!newContact.name || !newContact.phone_number) return;
    setLoading(true);
    await onAdd(newContact);
    setLoading(false);
    setIsAdding(false);
    setNewContact({ name: '', phone_number: '', relationship: '' });
  };

  return (
    <section className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm mb-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-slate-900 flex items-center gap-2 text-lg">
          <Heart className="w-5 h-5 text-red-500" /> Emergency Contacts
        </h3>
        {!isAdding && (
          <button onClick={() => setIsAdding(true)} className="text-xs font-bold bg-slate-100 text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition">
            <Plus className="w-3 h-3 inline mr-1"/> Add
          </button>
        )}
      </div>

      <div className="space-y-3">
        {contacts.map(c => (
          <div key={c.id} className="flex justify-between items-center p-4 bg-slate-50 border border-slate-100 rounded-2xl">
             <div>
               <p className="font-bold text-slate-900 text-sm">{c.name}</p>
               <p className="text-xs text-slate-500">{c.relationship} • {c.phone_number}</p>
             </div>
             <button onClick={() => onRemove(c.id)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
          </div>
        ))}
        {contacts.length === 0 && !isAdding && <p className="text-sm text-slate-400 italic">No contacts added. Essential for safety.</p>}

        {isAdding && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 animate-fade-in">
             <input placeholder="Name" className="w-full p-2 rounded-lg border text-sm" value={newContact.name} onChange={e => setNewContact({...newContact, name: e.target.value})} />
             <input placeholder="Phone Number" className="w-full p-2 rounded-lg border text-sm" value={newContact.phone_number} onChange={e => setNewContact({...newContact, phone_number: e.target.value})} />
             <input placeholder="Relationship (e.g. Sister)" className="w-full p-2 rounded-lg border text-sm" value={newContact.relationship} onChange={e => setNewContact({...newContact, relationship: e.target.value})} />
             <div className="flex gap-2">
                <button onClick={handleAdd} disabled={loading} className="flex-1 bg-black text-white py-2 rounded-lg text-sm font-bold">{loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto"/> : 'Save Contact'}</button>
                <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-slate-600 text-sm font-bold bg-white rounded-lg border">Cancel</button>
             </div>
          </div>
        )}
      </div>
    </section>
  );
};

// --- Preferences Component ---
const PreferencesSection = ({ prefs, onUpdate }: { prefs: any, onUpdate: (p: any) => Promise<void> }) => {
  const toggle = async (key: string) => {
    await onUpdate({ ...prefs, [key]: !prefs?.[key] });
  };

  return (
    <section className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm mb-6">
      <h3 className="font-bold text-slate-900 flex items-center gap-2 text-lg mb-6">
        <Bell className="w-5 h-5" /> Notifications
      </h3>
      <div className="space-y-4">
        {[
          { key: 'email_updates', label: 'Email Updates', desc: 'Ride receipts and promotions' },
          { key: 'sms_notifications', label: 'SMS Notifications', desc: 'Driver arrival alerts' },
          { key: 'security_alerts', label: 'Security Alerts', desc: 'Login attempts and safety' },
        ].map(item => (
          <div key={item.key} className="flex items-center justify-between">
             <div>
                <p className="font-bold text-slate-900 text-sm">{item.label}</p>
                <p className="text-xs text-slate-500">{item.desc}</p>
             </div>
             <button 
               onClick={() => toggle(item.key)} 
               className={`w-12 h-6 rounded-full transition-colors relative ${prefs?.[item.key] ? 'bg-black' : 'bg-slate-200'}`}
             >
               <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${prefs?.[item.key] ? 'left-7' : 'left-1'}`}></div>
             </button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default function SettingsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [places, setPlaces] = useState<SavedPlace[]>([]);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [formData, setFormData] = useState({ full_name: '', phone_number: '', address: '' });

  // Place Add State
  const [isAddingPlace, setIsAddingPlace] = useState(false);
  const [newPlace, setNewPlace] = useState({ label: '', address: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth'); return; }

    const [profileRes, placesRes, contactsRes] = await Promise.all([
       supabase.from('profiles').select('*').eq('id', user.id).single(),
       supabase.from('saved_places').select('*').eq('user_id', user.id),
       supabase.from('emergency_contacts').select('*').eq('user_id', user.id)
    ]);

    if (profileRes.data) {
      setProfile(profileRes.data);
      setFormData({
        full_name: profileRes.data.full_name || '',
        phone_number: profileRes.data.phone_number || '',
        address: profileRes.data.address || ''
      });
    }
    if (placesRes.data) setPlaces(placesRes.data);
    if (contactsRes.data) setContacts(contactsRes.data);
    setLoading(false);
  };

  // --- Actions ---
  const updateProfile = async () => {
    if (!profile) return;
    const { error } = await supabase.from('profiles').update(formData).eq('id', profile.id);
    if (!error) {
      setProfile({ ...profile, ...formData });
      setIsEditingProfile(false);
    }
  };

  const updatePreferences = async (newPrefs: any) => {
    if (!profile) return;
    const { error } = await supabase.from('profiles').update({ preferences: newPrefs }).eq('id', profile.id);
    if (!error) setProfile({ ...profile, preferences: newPrefs });
  };

  const addContact = async (c: any) => {
    if (!profile) return;
    const { data, error } = await supabase.from('emergency_contacts').insert({ user_id: profile.id, ...c }).select().single();
    if (!error && data) setContacts([...contacts, data]);
  };

  const removeContact = async (id: string) => {
    await supabase.from('emergency_contacts').delete().eq('id', id);
    setContacts(contacts.filter(c => c.id !== id));
  };

  const addPlace = async () => {
    if (!profile || !newPlace.label || !newPlace.address) return;
    const { data, error } = await supabase.from('saved_places').insert({ user_id: profile.id, ...newPlace }).select().single();
    if (!error && data) {
      setPlaces([...places, data]);
      setIsAddingPlace(false);
      setNewPlace({ label: '', address: '' });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-black"/></div>;

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto pt-32 min-h-screen">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Settings</h1>

      {/* Main Profile Card */}
      <section className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm mb-6">
        <div className="flex justify-between items-start mb-6">
           <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center text-2xl font-bold uppercase">
                 {profile?.full_name?.[0]}
              </div>
              <div>
                 <h2 className="text-xl font-bold text-slate-900">{profile?.full_name}</h2>
                 <p className="text-slate-500 text-sm">{profile?.email}</p>
                 {profile?.is_verified ? (
                   <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 w-fit mt-1"><CheckCircle className="w-3 h-3"/> Verified Passenger</span>
                 ) : (
                   <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 w-fit mt-1"><AlertTriangle className="w-3 h-3"/> Unverified</span>
                 )}
              </div>
           </div>
           <button onClick={() => setIsEditingProfile(!isEditingProfile)} className="text-sm font-bold underline hover:text-slate-600">
             {isEditingProfile ? 'Cancel' : 'Edit'}
           </button>
        </div>

        <div className="space-y-4">
           {isEditingProfile ? (
             <div className="space-y-4 animate-fade-in">
                <div className="grid md:grid-cols-2 gap-4">
                   <input className="p-3 bg-slate-50 rounded-xl border text-sm" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} placeholder="Full Name" />
                   <input className="p-3 bg-slate-50 rounded-xl border text-sm" value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} placeholder="Phone" />
                </div>
                <LocationInput value={formData.address} onChange={(val) => setFormData({...formData, address: val})} placeholder="Home Address (Required for verification)" />
                <button onClick={updateProfile} className="bg-black text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition">Save Changes</button>
             </div>
           ) : (
             <div className="grid md:grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                   <label className="text-xs font-bold text-slate-400 uppercase">Phone</label>
                   <p className="font-bold text-slate-900">{profile?.phone_number || 'Not Set'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                   <label className="text-xs font-bold text-slate-400 uppercase">Address</label>
                   <p className="font-bold text-slate-900">{profile?.address || 'Not Set'}</p>
                </div>
             </div>
           )}
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-6">
         {/* Saved Places */}
         <section className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm mb-6">
            <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold text-slate-900 flex items-center gap-2 text-lg"><MapPin className="w-5 h-5"/> Saved Places</h3>
               {!isAddingPlace && <button onClick={() => setIsAddingPlace(true)} className="bg-slate-100 p-2 rounded-lg hover:bg-slate-200"><Plus className="w-4 h-4"/></button>}
            </div>
            <div className="space-y-3">
               {places.map(p => (
                  <div key={p.id} className="flex justify-between items-center p-3 border rounded-xl">
                     <div>
                        <div className="font-bold text-sm">{p.label}</div>
                        <div className="text-xs text-slate-500 truncate max-w-[150px]">{p.address}</div>
                     </div>
                     <button onClick={() => { 
                        supabase.from('saved_places').delete().eq('id', p.id).then(() => setPlaces(places.filter(x => x.id !== p.id))) 
                     }}><Trash2 className="w-4 h-4 text-slate-300 hover:text-red-500"/></button>
                  </div>
               ))}
               {isAddingPlace && (
                  <div className="space-y-2 animate-fade-in">
                     <input className="w-full p-2 border rounded-lg text-sm" placeholder="Label (e.g. Work)" value={newPlace.label} onChange={e => setNewPlace({...newPlace, label: e.target.value})} />
                     <LocationInput value={newPlace.address} onChange={val => setNewPlace({...newPlace, address: val})} placeholder="Address" />
                     <button onClick={addPlace} className="w-full bg-black text-white py-2 rounded-lg text-sm font-bold">Save</button>
                  </div>
               )}
            </div>
         </section>

         {/* Preferences */}
         <PreferencesSection prefs={profile?.preferences || {}} onUpdate={updatePreferences} />
      </div>

      <EmergencyContactsSection contacts={contacts} onAdd={addContact} onRemove={removeContact} />

      <button onClick={async () => { await supabase.auth.signOut(); router.push('/'); }} className="w-full bg-slate-100 text-slate-900 py-4 rounded-2xl font-bold hover:bg-slate-200 transition flex items-center justify-center gap-2 mt-8">
         <LogOut className="w-5 h-5" /> Log Out
      </button>
    </div>
  );
}