'use client';
import { useState, useEffect, useTransition } from 'react';
import { User, Bell, Shield, MapPin, ChevronRight, Mail, Phone, Lock, Loader2, Save, Trash2, Plus, X } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { SavedPlace } from '@/types';

// --- Sub-Components ---

const ProfileSection = ({ profile, onUpdate }: { profile: any, onUpdate: (data: any) => Promise<void> }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ full_name: profile?.full_name || '', phone_number: profile?.phone_number || '' });
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      await onUpdate(formData);
      setIsEditing(false);
    });
  };

  return (
    <section className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center text-white text-2xl font-bold uppercase shadow-md">
          {profile?.full_name?.[0] || 'U'}
        </div>
        <div className="flex-1">
          {isEditing ? (
            <input
              className="text-xl font-bold text-slate-900 border-b-2 border-black outline-none w-full mb-1 bg-transparent py-1"
              value={formData.full_name}
              onChange={e => setFormData({ ...formData, full_name: e.target.value })}
              autoFocus
            />
          ) : (
            <h2 className="text-xl font-bold text-slate-900">{profile?.full_name}</h2>
          )}
          <p className="text-slate-500 text-sm capitalize font-medium">{profile?.role}</p>
        </div>

        {isEditing ? (
          <div className="flex gap-2">
             <button onClick={() => setIsEditing(false)} disabled={isPending} className="text-slate-500 hover:text-slate-800 p-2 rounded-lg transition">
                <X className="w-5 h-5" />
             </button>
             <button onClick={handleSave} disabled={isPending} className="bg-black text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition shadow-lg disabled:opacity-50">
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
             </button>
          </div>
        ) : (
          <button onClick={() => setIsEditing(true)} className="text-sm font-bold text-black border border-slate-200 px-5 py-2.5 rounded-xl hover:bg-slate-50 transition">Edit</button>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <Mail className="w-5 h-5 text-slate-400" />
          <span className="text-sm font-medium text-slate-700">{profile?.email}</span>
        </div>
        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <Phone className="w-5 h-5 text-slate-400" />
          {isEditing ? (
            <input
              className="bg-transparent border-b border-slate-300 outline-none w-full text-sm font-medium text-slate-900 placeholder:text-slate-400"
              value={formData.phone_number}
              placeholder="+234..."
              onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
            />
          ) : (
            <span className="text-sm font-medium text-slate-700">{profile?.phone_number || 'No phone number added'}</span>
          )}
        </div>
      </div>
    </section>
  );
};

const SavedPlacesSection = ({ places, onAdd, onRemove }: { places: SavedPlace[], onAdd: (place: Omit<SavedPlace, 'id' | 'user_id'>) => Promise<void>, onRemove: (id: string) => Promise<void> }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newPlace, setNewPlace] = useState({ label: '', address: '' });
  const [isPending, startTransition] = useTransition();

  const handleAdd = () => {
    if (!newPlace.label || !newPlace.address) return;
    startTransition(async () => {
      await onAdd(newPlace);
      setIsAdding(false);
      setNewPlace({ label: '', address: '' });
    });
  };

  return (
    <section className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
         <h3 className="font-bold text-slate-900 flex items-center gap-2 text-lg">
            <MapPin className="w-5 h-5 text-slate-900" /> Saved Places
         </h3>
         {!isAdding && (
            <button onClick={() => setIsAdding(true)} className="text-xs font-bold bg-black text-white px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-slate-800 transition">
               <Plus className="w-3 h-3" /> Add
            </button>
         )}
      </div>
      
      <div className="space-y-3">
        {places.length === 0 && !isAdding ? <p className="text-slate-400 italic text-sm text-center py-4">No saved places yet.</p> : null}
        
        {places.map(p => (
          <div key={p.id} className="flex justify-between items-center p-4 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-slate-200 transition">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-500 shadow-sm border border-slate-100">
                  <MapPin className="w-5 h-5" />
               </div>
               <div>
                  <div className="font-bold text-sm text-slate-900">{p.label}</div>
                  <div className="text-xs text-slate-500 font-medium truncate max-w-[200px]">{p.address}</div>
               </div>
            </div>
            <button 
               onClick={() => onRemove(p.id)} 
               className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100"
               title="Remove"
            >
               <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}

        {isAdding && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl animate-fade-in">
            <div className="space-y-3 mb-4">
               <input 
                  placeholder="Label (e.g. Home, Gym)" 
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-black transition"
                  value={newPlace.label}
                  onChange={e => setNewPlace({...newPlace, label: e.target.value})}
                  autoFocus
               />
               <input 
                  placeholder="Address" 
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-black transition"
                  value={newPlace.address}
                  onChange={e => setNewPlace({...newPlace, address: e.target.value})}
               />
            </div>
            <div className="flex gap-2">
               <button onClick={handleAdd} disabled={isPending} className="flex-1 bg-black text-white py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition flex justify-center">
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Save Place'}
               </button>
               <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-slate-600 font-bold text-sm hover:bg-slate-200 rounded-lg transition">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

// --- Main Page Component ---

export default function SettingsPage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<any>(null);
  const [places, setPlaces] = useState<SavedPlace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Use Promise.all for parallel fetching
    const [profileRes, placesRes] = await Promise.all([
       supabase.from('profiles').select('*').eq('id', user.id).single(),
       supabase.from('saved_places').select('*').eq('user_id', user.id)
    ]);

    if (profileRes.data) setProfile(profileRes.data);
    if (placesRes.data) setPlaces(placesRes.data);
    setLoading(false);
  };

  const updateProfile = async (data: any) => {
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: data.full_name, phone_number: data.phone_number })
      .eq('id', profile.id);
    
    if (error) {
       alert('Failed to update profile'); 
    } else {
       setProfile({ ...profile, ...data });
    }
  };

  const addPlace = async (place: Omit<SavedPlace, 'id' | 'user_id'>) => {
     const { data: { user } } = await supabase.auth.getUser();
     if (!user) return;

     const { data, error } = await supabase.from('saved_places').insert({
        user_id: user.id,
        label: place.label,
        address: place.address
     }).select().single();

     if (error) alert('Failed to add place');
     else if (data) setPlaces([...places, data]);
  };

  const removePlace = async (id: string) => {
     const { error } = await supabase.from('saved_places').delete().eq('id', id);
     if (error) alert('Failed to remove place');
     else setPlaces(places.filter(p => p.id !== id));
  };

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-slate-300"/></div>;

  return (
    <div className="p-6 lg:p-10 max-w-3xl mx-auto pt-32 min-h-screen">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Settings</h1>

      <div className="space-y-8">
        <ProfileSection profile={profile} onUpdate={updateProfile} />
        
        <SavedPlacesSection places={places} onAdd={addPlace} onRemove={removePlace} />

        {/* Security & Preferences (Static for now, but UI ready) */}
        <section className="space-y-3">
           <h3 className="font-bold text-slate-900 ml-1 mb-2 text-sm uppercase tracking-wider">Preferences</h3>
           
           <button className="w-full bg-white border border-slate-100 p-4 rounded-2xl flex items-center justify-between hover:border-slate-300 transition group shadow-sm">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center"><Bell className="w-5 h-5"/></div>
                 <div className="text-left">
                    <div className="font-bold text-slate-900 text-sm">Notifications</div>
                    <div className="text-xs text-slate-500">Push, Email, and SMS settings</div>
                 </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-black transition" />
           </button>

           <button className="w-full bg-white border border-slate-100 p-4 rounded-2xl flex items-center justify-between hover:border-slate-300 transition group shadow-sm">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center"><Lock className="w-5 h-5"/></div>
                 <div className="text-left">
                    <div className="font-bold text-slate-900 text-sm">Security</div>
                    <div className="text-xs text-slate-500">Password and 2FA</div>
                 </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-black transition" />
           </button>
        </section>
      </div>
    </div>
  );
}