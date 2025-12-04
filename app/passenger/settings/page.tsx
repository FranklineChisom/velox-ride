'use client';
import { useState, useEffect } from 'react';
import { 
  User, Bell, Shield, MapPin, ChevronRight, Mail, Phone, Lock, 
  Loader2, Save, Trash2, Plus, X, LogOut, AlertTriangle,
  Heart, FileText, CheckCircle
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { SavedPlace, Profile, EmergencyContact } from '@/types';
import { useRouter } from 'next/navigation';
import LocationInput from '@/components/LocationInput';

// Helper for phone validation
const validatePhoneInput = (value: string) => {
  // Allow only digits, +, -, spaces, and parentheses
  if (/^[0-9+\-\s()]*$/.test(value)) {
    return true;
  }
  return false;
};

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

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (validatePhoneInput(val)) {
      setNewContact({ ...newContact, phone_number: val });
    }
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
             <input 
               placeholder="Name" 
               className="w-full p-2 rounded-lg border text-sm outline-none focus:border-black" 
               value={newContact.name} 
               onChange={e => setNewContact({...newContact, name: e.target.value})} 
             />
             <input 
               type="tel" 
               placeholder="Phone Number" 
               className="w-full p-2 rounded-lg border text-sm outline-none focus:border-black" 
               value={newContact.phone_number} 
               onChange={handlePhoneChange} 
             />
             <input 
               placeholder="Relationship (e.g. Sister)" 
               className="w-full p-2 rounded-lg border text-sm outline-none focus:border-black" 
               value={newContact.relationship} 
               onChange={e => setNewContact({...newContact, relationship: e.target.value})} 
             />
             <div className="flex gap-2">
                <button onClick={handleAdd} disabled={loading} className="flex-1 bg-black text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Save Contact'}
                </button>
                <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-slate-600 text-sm font-bold bg-white rounded-lg border hover:bg-slate-50">Cancel</button>
             </div>
          </div>
        )}
      </div>
    </section>
  );
};

// --- Profile Component ---
const ProfileSection = ({ profile, onUpdate }: { profile: Profile | null, onUpdate: (data: Partial<Profile>) => Promise<void> }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ full_name: '', phone_number: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({ 
        full_name: profile.full_name || '', 
        phone_number: profile.phone_number || '' 
      });
    }
  }, [profile]);

  const handleSave = async () => {
    setLoading(true);
    await onUpdate(formData);
    setLoading(false);
    setIsEditing(false);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (validatePhoneInput(val)) {
      setFormData({ ...formData, phone_number: val });
    }
  };

  return (
    <section className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm mb-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <User className="w-5 h-5"/> Profile Details
        </h2>
        {!isEditing ? (
          <button onClick={() => setIsEditing(true)} className="text-sm font-bold text-black hover:text-slate-600">Edit</button>
        ) : (
          <div className="flex gap-3">
            <button onClick={() => setIsEditing(false)} className="text-sm font-bold text-slate-400 hover:text-slate-600">Cancel</button>
            <button onClick={handleSave} disabled={loading} className="text-sm font-bold text-green-600 hover:text-green-700 flex items-center gap-1">
              {loading ? <Loader2 className="w-3 h-3 animate-spin"/> : <Save className="w-3 h-3"/>} Save
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Full Name</label>
            {isEditing ? (
              <input 
                className="w-full bg-white p-2 rounded-lg border border-slate-200 text-sm font-bold focus:border-black outline-none"
                value={formData.full_name}
                onChange={e => setFormData({...formData, full_name: e.target.value})}
              />
            ) : (
              <p className="font-bold text-slate-900">{profile?.full_name}</p>
            )}
          </div>
          
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Email Address</label>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400"/>
              <p className="font-bold text-slate-500">{profile?.email}</p> 
              <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold ml-auto">Verified</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Phone Number</label>
            {isEditing ? (
              <input 
                type="tel"
                className="w-full bg-white p-2 rounded-lg border border-slate-200 text-sm font-bold focus:border-black outline-none"
                value={formData.phone_number}
                onChange={handlePhoneChange}
                placeholder="+234..."
              />
            ) : (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400"/>
                <p className="font-bold text-slate-900">{profile?.phone_number || 'Not set'}</p>
              </div>
            )}
          </div>
        </div>
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

// --- Saved Places Component ---
const SavedPlacesSection = ({ places, onAdd, onRemove }: { places: SavedPlace[], onAdd: (place: Omit<SavedPlace, 'id' | 'user_id'>) => Promise<void>, onRemove: (id: string) => Promise<void> }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newPlace, setNewPlace] = useState({ label: '', address: '' });
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!newPlace.label || !newPlace.address) return;
    setLoading(true);
    await onAdd(newPlace);
    setLoading(false);
    setIsAdding(false);
    setNewPlace({ label: '', address: '' });
  };

  return (
    <section className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm mb-6">
      <div className="flex justify-between items-center mb-6">
         <h3 className="font-bold text-slate-900 flex items-center gap-2 text-lg"><MapPin className="w-5 h-5"/> Saved Places</h3>
         {!isAdding && <button onClick={() => setIsAdding(true)} className="bg-slate-100 p-2 rounded-lg hover:bg-slate-200"><Plus className="w-4 h-4"/></button>}
      </div>
      <div className="space-y-3">
         {places.map(p => (
            <div key={p.id} className="flex justify-between items-center p-3 border rounded-xl">
               <div>
                  <div className="font-bold text-sm">{p.label}</div>
                  <div className="text-xs text-slate-500 truncate max-w-[150px]">{p.address}</div>
               </div>
               <button onClick={() => onRemove(p.id)}><Trash2 className="w-4 h-4 text-slate-300 hover:text-red-500"/></button>
            </div>
         ))}
         {isAdding && (
            <div className="space-y-2 animate-fade-in">
               <input 
                 className="w-full p-2 border rounded-lg text-sm outline-none focus:border-black" 
                 placeholder="Label (e.g. Work)" 
                 value={newPlace.label} 
                 onChange={e => setNewPlace({...newPlace, label: e.target.value})} 
               />
               <LocationInput 
                 value={newPlace.address} 
                 onChange={val => setNewPlace({...newPlace, address: val})} 
                 placeholder="Address" 
               />
               <div className="flex gap-2">
                  <button onClick={handleAdd} disabled={loading} className="flex-1 bg-black text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center">
                    {loading ? <Loader2 className="w-3 h-3 animate-spin"/> : 'Save'}
                  </button>
                  <button onClick={() => setIsAdding(false)} className="px-4 py-2 bg-white border rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
               </div>
            </div>
         )}
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

  const updateProfile = async () => {
    if (!profile) return;
    const { error } = await supabase.from('profiles').update(formData).eq('id', profile.id);
    if (!error) {
      setProfile({ ...profile, ...formData });
      setIsEditingProfile(false);
    } else {
        alert("Failed to update profile.");
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

  const addPlace = async (place: Omit<SavedPlace, 'id' | 'user_id'>) => {
    if (!profile) return;
    const { data, error } = await supabase.from('saved_places').insert({ user_id: profile.id, ...place }).select().single();
    if (!error && data) setPlaces([...places, data]);
  };

  const removePlace = async (id: string) => {
    await supabase.from('saved_places').delete().eq('id', id);
    setPlaces(places.filter(p => p.id !== id));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-black"/></div>;

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto pt-32 min-h-screen">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Settings</h1>

      <ProfileSection profile={profile} onUpdate={updateProfile} />
      
      <div className="grid md:grid-cols-2 gap-6">
         <SavedPlacesSection places={places} onAdd={addPlace} onRemove={removePlace} />
         <PreferencesSection prefs={profile?.preferences || {}} onUpdate={updatePreferences} />
      </div>

      <EmergencyContactsSection contacts={contacts} onAdd={addContact} onRemove={removeContact} />

      <section className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm mb-8 mt-6">
         <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><FileText className="w-5 h-5"/> Legal & Support</h3>
         <div className="space-y-1">
            {['Terms of Service', 'Privacy Policy', 'Community Guidelines'].map(item => (
               <button key={item} className="w-full text-left p-3 hover:bg-slate-50 rounded-xl text-sm font-medium text-slate-600 flex justify-between items-center group">
                  {item}
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-black"/>
               </button>
            ))}
         </div>
      </section>

      <button onClick={handleLogout} className="w-full bg-slate-100 text-slate-900 py-4 rounded-2xl font-bold hover:bg-slate-200 transition flex items-center justify-center gap-2 mt-8">
         <LogOut className="w-5 h-5" /> Log Out
      </button>
    </div>
  );
}