'use client';
import { useState, useEffect, useCallback } from 'react';
import { 
  User, Bell, MapPin, ChevronRight, Mail, Phone, 
  Loader2, Save, Trash2, Plus, LogOut, AlertTriangle,
  Heart, FileText, CheckCircle, AlertCircle
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { SavedPlace, Profile, EmergencyContact } from '@/types';
import { useRouter } from 'next/navigation';
import LocationInput from '@/components/LocationInput';
import Link from 'next/link';
import { deleteMyAccount } from '@/app/actions';
import { useToast } from '@/components/ui/ToastProvider';
import Modal from '@/components/ui/Modal';

// --- Sub-components (kept in same file for single-file requirement) ---

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
             <button onClick={() => onRemove(c.id)} className="text-slate-400 hover:text-red-500 p-2"><Trash2 className="w-4 h-4"/></button>
          </div>
        ))}
        {contacts.length === 0 && !isAdding && <p className="text-sm text-slate-400 italic">No contacts added. Essential for safety.</p>}

        {isAdding && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 animate-fade-in">
             <input placeholder="Name" className="w-full p-2.5 rounded-xl border text-sm outline-none focus:border-black" value={newContact.name} onChange={e => setNewContact({...newContact, name: e.target.value})} />
             <input type="tel" placeholder="Phone Number" className="w-full p-2.5 rounded-xl border text-sm outline-none focus:border-black" value={newContact.phone_number} onChange={e => setNewContact({...newContact, phone_number: e.target.value})} />
             <input placeholder="Relationship (e.g. Sister)" className="w-full p-2.5 rounded-xl border text-sm outline-none focus:border-black" value={newContact.relationship} onChange={e => setNewContact({...newContact, relationship: e.target.value})} />
             <div className="flex gap-2">
                <button onClick={handleAdd} disabled={loading} className="flex-1 bg-black text-white py-2.5 rounded-xl text-sm font-bold">{loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto"/> : 'Save Contact'}</button>
                <button onClick={() => setIsAdding(false)} className="px-4 py-2.5 text-slate-600 text-sm font-bold bg-white rounded-xl border">Cancel</button>
             </div>
          </div>
        )}
      </div>
    </section>
  );
};

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
               <div className="overflow-hidden">
                  <div className="font-bold text-sm truncate">{p.label}</div>
                  <div className="text-xs text-slate-500 truncate">{p.address}</div>
               </div>
               <button onClick={() => onRemove(p.id)} className="p-2"><Trash2 className="w-4 h-4 text-slate-300 hover:text-red-500"/></button>
            </div>
         ))}
         {isAdding && (
            <div className="space-y-2 animate-fade-in">
               <input className="w-full p-2.5 border rounded-xl text-sm outline-none focus:border-black" placeholder="Label (e.g. Work)" value={newPlace.label} onChange={e => setNewPlace({...newPlace, label: e.target.value})} />
               <LocationInput value={newPlace.address} onChange={val => setNewPlace({...newPlace, address: val})} placeholder="Address" />
               <div className="flex gap-2">
                  <button onClick={handleAdd} disabled={loading} className="flex-1 bg-black text-white py-2.5 rounded-xl text-sm font-bold">{loading ? <Loader2 className="w-3 h-3 animate-spin mx-auto"/> : 'Save'}</button>
                  <button onClick={() => setIsAdding(false)} className="px-4 py-2.5 bg-white border rounded-xl text-sm font-bold text-slate-600">Cancel</button>
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
  const { addToast } = useToast();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [places, setPlaces] = useState<SavedPlace[]>([]);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  // Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [formData, setFormData] = useState({ full_name: '', phone_number: '', address: '' });

  const fetchData = useCallback(async () => {
    try {
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
    } catch (e) {
      console.error(e);
      addToast("Failed to load settings", 'error');
    } finally {
      setLoading(false);
    }
  }, [supabase, router, addToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateProfile = async () => {
    if (!profile) return;
    const { error } = await supabase.from('profiles').update(formData).eq('id', profile.id);
    if (!error) {
      setProfile({ ...profile, ...formData });
      setIsEditingProfile(false);
      addToast("Profile updated successfully", 'success');
    } else {
      addToast("Failed to update profile", 'error');
    }
  };

  const addContact = async (c: any) => {
    if (!profile) return;
    const { data, error } = await supabase.from('emergency_contacts').insert({ user_id: profile.id, ...c }).select().single();
    if (!error && data) {
      setContacts([...contacts, data]);
      addToast("Contact added", 'success');
    } else {
      addToast("Failed to add contact", 'error');
    }
  };

  const removeContact = async (id: string) => {
    const { error } = await supabase.from('emergency_contacts').delete().eq('id', id);
    if (!error) {
      setContacts(contacts.filter(c => c.id !== id));
      addToast("Contact removed", 'info');
    }
  };

  const addPlace = async (place: Omit<SavedPlace, 'id' | 'user_id'>) => {
    if (!profile) return;
    const { data, error } = await supabase.from('saved_places').insert({ user_id: profile.id, ...place }).select().single();
    if (!error && data) {
      setPlaces([...places, data]);
      addToast("Place saved", 'success');
    } else {
      addToast("Failed to save place", 'error');
    }
  };

  const removePlace = async (id: string) => {
    const { error } = await supabase.from('saved_places').delete().eq('id', id);
    if (!error) {
      setPlaces(places.filter(p => p.id !== id));
      addToast("Place removed", 'info');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    const res = await deleteMyAccount();
    if (res.error) {
        addToast(res.error, 'error');
        setDeleting(false);
        setDeleteModalOpen(false);
    } else {
        await supabase.auth.signOut();
        router.push('/');
    }
  };

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-black"/></div>;

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto pt-32 min-h-screen">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Settings</h1>

      {/* Profile Section */}
      <section className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm mb-6">
        <div className="flex justify-between items-start mb-6">
           <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center text-2xl font-bold uppercase shrink-0">
                 {profile?.full_name?.[0]}
              </div>
              <div>
                 <h2 className="text-xl font-bold text-slate-900">{profile?.full_name}</h2>
                 <p className="text-slate-500 text-sm">{profile?.email}</p>
                 {profile?.is_verified ? (
                   <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 w-fit mt-1"><CheckCircle className="w-3 h-3"/> Verified</span>
                 ) : (
                   <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 w-fit mt-1"><AlertTriangle className="w-3 h-3"/> Unverified</span>
                 )}
              </div>
           </div>
           <button onClick={() => setIsEditingProfile(!isEditingProfile)} className="text-sm font-bold underline hover:text-slate-600">
             {isEditingProfile ? 'Cancel' : 'Edit'}
           </button>
        </div>

        {isEditingProfile ? (
          <div className="space-y-4 animate-fade-in">
             <div className="grid md:grid-cols-2 gap-4">
                <input className="p-3 bg-slate-50 rounded-xl border text-sm outline-none focus:border-black" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} placeholder="Full Name" />
                <input type="tel" className="p-3 bg-slate-50 rounded-xl border text-sm outline-none focus:border-black" value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} placeholder="Phone" />
             </div>
             <LocationInput value={formData.address} onChange={(val) => setFormData({...formData, address: val})} placeholder="Home Address" />
             <button onClick={updateProfile} className="bg-black text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition">Save Changes</button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
             <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Phone</label>
                <p className="font-bold text-slate-900">{profile?.phone_number || 'Not Set'}</p>
             </div>
             <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Address</label>
                <p className="font-bold text-slate-900">{profile?.address || 'Not Set'}</p>
             </div>
          </div>
        )}
      </section>

      <div className="grid md:grid-cols-2 gap-6">
         <SavedPlacesSection places={places} onAdd={addPlace} onRemove={removePlace} />
         <div className="space-y-6">
            <EmergencyContactsSection contacts={contacts} onAdd={addContact} onRemove={removeContact} />
         </div>
      </div>

      <section className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm mb-8 mt-6">
         <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><FileText className="w-5 h-5"/> Legal & Support</h3>
         <div className="space-y-1">
            <Link href="/terms" className="w-full text-left p-3 hover:bg-slate-50 rounded-xl text-sm font-medium text-slate-600 flex justify-between items-center group">
               Terms of Service <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-black"/>
            </Link>
            <Link href="/privacy" className="w-full text-left p-3 hover:bg-slate-50 rounded-xl text-sm font-medium text-slate-600 flex justify-between items-center group">
               Privacy Policy <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-black"/>
            </Link>
         </div>
      </section>

      <div className="flex flex-col gap-4">
         <button onClick={() => setLogoutModalOpen(true)} className="w-full bg-slate-100 text-slate-900 py-4 rounded-2xl font-bold hover:bg-slate-200 transition flex items-center justify-center gap-2 mt-8">
            <LogOut className="w-5 h-5" /> Log Out
         </button>
         
         <button 
            onClick={() => setDeleteModalOpen(true)}
            className="w-full py-4 text-red-500 font-bold text-sm hover:underline opacity-80 hover:opacity-100"
         >
            Delete Account
         </button>
      </div>

      {/* Logout Confirmation Modal */}
      <Modal isOpen={logoutModalOpen} onClose={() => setLogoutModalOpen(false)} title="Log Out">
        <div className="text-center space-y-6">
          <p className="text-slate-600">Are you sure you want to log out of Veluxeride?</p>
          <div className="flex gap-4">
            <button onClick={() => setLogoutModalOpen(false)} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold hover:bg-slate-50">Cancel</button>
            <button onClick={handleLogout} className="flex-1 py-3 bg-black text-white rounded-xl font-bold hover:bg-slate-800">Log Out</button>
          </div>
        </div>
      </Modal>

      {/* Delete Account Modal */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Delete Account">
        <div className="text-center space-y-6">
          <div className="bg-red-50 p-4 rounded-xl flex items-start gap-3 text-left">
            <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
            <p className="text-sm text-red-800 font-medium">Warning: This action is permanent. All your ride history, wallet balance, and saved preferences will be erased immediately.</p>
          </div>
          <div className="flex gap-4 pt-2">
            <button onClick={() => setDeleteModalOpen(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold hover:bg-slate-200">Cancel</button>
            <button onClick={handleDeleteAccount} disabled={deleting} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
              {deleting && <Loader2 className="w-4 h-4 animate-spin"/>} Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}