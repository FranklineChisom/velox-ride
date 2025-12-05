'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase';
import { Loader2, Camera, Car, MapPin, CheckCircle, ArrowRight, User } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import ImageUpload from '@/components/ui/ImageUpload';
import LocationInput from '@/components/LocationInput';

export default function OnboardingPage() {
  const { user, profile, refreshProfile } = useAuth();
  const supabase = createClient();
  const router = useRouter();
  const { addToast } = useToast();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>({});

  // Initialize form with existing data if available
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone_number: profile.phone_number || '',
        vehicle_model: profile.vehicle_model || '',
        vehicle_plate: profile.vehicle_plate || '',
        vehicle_color: profile.vehicle_color || '',
        address: profile.address || '',
      });
    }
  }, [profile]);

  const handleUpdate = async (updates: any) => {
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user?.id);

    if (error) {
      addToast('Failed to save details.', 'error');
    } else {
      await refreshProfile();
      setStep(step + 1);
    }
    setLoading(false);
  };

  const handleComplete = async () => {
    setLoading(true);
    await refreshProfile();
    const dashboard = profile?.role === 'driver' ? '/driver' : '/passenger';
    router.push(dashboard);
  };

  if (!profile) return <div className="flex justify-center p-8"><Loader2 className="animate-spin w-8 h-8 text-slate-300"/></div>;

  // --- STEP 1: Identity & Avatar (Common for both roles) ---
  if (step === 1) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 relative">
             <ImageUpload 
                uid={user?.id || ''} 
                url={profile.avatar_url || undefined}
                onUpload={async (url) => {
                   await supabase.from('profiles').update({ avatar_url: url }).eq('id', user?.id);
                   await refreshProfile();
                   addToast('Photo uploaded!', 'success');
                }}
             />
             <div className="absolute -bottom-2 right-0 bg-black text-white p-1.5 rounded-full border-2 border-white">
                <Camera className="w-3 h-3" />
             </div>
          </div>
          <h3 className="font-bold text-slate-900 text-lg">Upload a Profile Photo</h3>
          <p className="text-slate-500 text-sm">Help others recognize you. Clear photos build trust.</p>
        </div>

        <div className="space-y-3">
           <div>
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Full Name</label>
              <input 
                value={formData.full_name} 
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-black transition"
                placeholder="Your Name"
              />
           </div>
           <div>
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Phone Number</label>
              <input 
                value={formData.phone_number} 
                onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-black transition"
                placeholder="+234..."
              />
           </div>
        </div>

        <button 
          onClick={() => handleUpdate({ full_name: formData.full_name, phone_number: formData.phone_number })}
          disabled={!formData.full_name || !formData.phone_number || loading}
          className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition flex items-center justify-center gap-2 shadow-lg"
        >
          {loading ? <Loader2 className="animate-spin w-5 h-5"/> : <>Next Step <ArrowRight className="w-5 h-5"/></>}
        </button>
      </div>
    );
  }

  // --- STEP 2: Role Specific Data Collection ---
  
  // DRIVER FLOW: Vehicle Details
  if (profile.role === 'driver' && step === 2) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center mb-6">
           <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Car className="w-8 h-8" />
           </div>
           <h3 className="font-bold text-slate-900 text-lg">Vehicle Details</h3>
           <p className="text-slate-500 text-sm">Tell us about the car you'll be driving.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div className="col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Vehicle Model</label>
              <input 
                value={formData.vehicle_model} 
                onChange={(e) => setFormData({...formData, vehicle_model: e.target.value})}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-black transition"
                placeholder="e.g. Toyota Camry 2018"
              />
           </div>
           <div>
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Plate Number</label>
              <input 
                value={formData.vehicle_plate} 
                onChange={(e) => setFormData({...formData, vehicle_plate: e.target.value})}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-black transition uppercase"
                placeholder="ABC-123DE"
              />
           </div>
           <div>
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Color</label>
              <input 
                value={formData.vehicle_color} 
                onChange={(e) => setFormData({...formData, vehicle_color: e.target.value})}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-black transition"
                placeholder="Silver"
              />
           </div>
        </div>

        <button 
          onClick={() => handleUpdate({ 
             vehicle_model: formData.vehicle_model, 
             vehicle_plate: formData.vehicle_plate, 
             vehicle_color: formData.vehicle_color 
          })}
          disabled={!formData.vehicle_model || !formData.vehicle_plate || loading}
          className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition flex items-center justify-center gap-2 shadow-lg"
        >
          {loading ? <Loader2 className="animate-spin w-5 h-5"/> : 'Complete Setup'}
        </button>
      </div>
    );
  }

  // PASSENGER FLOW: Location Preferences
  if (profile.role === 'passenger' && step === 2) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center mb-6">
           <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8" />
           </div>
           <h3 className="font-bold text-slate-900 text-lg">Where are you based?</h3>
           <p className="text-slate-500 text-sm">We'll optimize ride suggestions for your area.</p>
        </div>

        <div className="space-y-2">
           <label className="text-xs font-bold text-slate-500 uppercase ml-1">Home Address (Optional)</label>
           <LocationInput 
             value={formData.address} 
             onChange={(val) => setFormData({...formData, address: val})}
             placeholder="Search for your area..."
           />
        </div>

        <div className="bg-blue-50 p-4 rounded-xl text-blue-800 text-xs leading-relaxed border border-blue-100 flex gap-2">
           <CheckCircle className="w-4 h-4 shrink-0" />
           <strong>Tip:</strong> Adding your location helps us recommend the best pickup points for your daily commute.
        </div>

        <button 
          onClick={() => handleUpdate({ address: formData.address })}
          disabled={loading}
          className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition flex items-center justify-center gap-2 shadow-lg"
        >
          {loading ? <Loader2 className="animate-spin w-5 h-5"/> : 'Finish Setup'}
        </button>
        
        <button onClick={handleComplete} className="w-full py-2 text-sm font-bold text-slate-400 hover:text-slate-600">Skip for now</button>
      </div>
    );
  }

  // --- STEP 3: Success & Redirect ---
  return (
    <div className="text-center space-y-6 animate-scale-up py-8">
       <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-100">
          <CheckCircle className="w-12 h-12" />
       </div>
       <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">You're all set!</h2>
          <p className="text-slate-500">Welcome to the future of commuting with Veluxeride.</p>
       </div>
       <button 
          onClick={handleComplete} 
          className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition shadow-xl"
       >
          Go to Dashboard
       </button>
    </div>
  );
}