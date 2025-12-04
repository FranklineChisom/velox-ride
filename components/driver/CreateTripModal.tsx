'use client';
import { useState } from 'react';
import { X, Loader2, Calendar, Clock, MapPin, DollarSign, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useToast } from '@/components/ui/ToastProvider';
import { APP_CONFIG } from '@/lib/constants';

interface Props {
  driverId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateTripModal({ driverId, onClose, onSuccess }: Props) {
  const supabase = createClient();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    origin: '', 
    destination: '', 
    date: '', 
    time: '', 
    seats: 3, 
    price: '' // Changed to string for easier input handling
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
        if (!formData.origin || !formData.destination || !formData.date || !formData.time || !formData.price) {
            throw new Error("Please fill in all fields");
        }

        const departureTime = new Date(`${formData.date}T${formData.time}`);
        
        if (departureTime < new Date()) throw new Error("Departure time must be in the future");

        const { error } = await supabase.from('rides').insert({
          driver_id: driverId,
          origin: formData.origin,
          destination: formData.destination,
          departure_time: departureTime.toISOString(),
          total_seats: formData.seats,
          price_per_seat: parseInt(formData.price),
          status: 'scheduled'
        });

        if (error) throw error;

        addToast('Trip published successfully!', 'success');
        onSuccess();
        onClose();
    } catch (err: any) {
        addToast(err.message, 'error');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-white p-8 rounded-3xl w-full max-w-lg relative animate-scale-up shadow-2xl">
            <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-black transition"><X/></button>
            
            <div className="mb-8">
                <h3 className="text-2xl font-bold text-slate-900">Post a Trip</h3>
                <p className="text-slate-500">Fill your empty seats for your next journey.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><MapPin className="w-3 h-3"/> Origin</label>
                        <input className="w-full p-3.5 bg-slate-50 rounded-xl font-medium outline-none focus:ring-2 focus:ring-black border border-slate-200 transition" required placeholder="Gwarinpa" value={formData.origin} onChange={e => setFormData({...formData, origin: e.target.value})}/>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><MapPin className="w-3 h-3"/> Destination</label>
                        <input className="w-full p-3.5 bg-slate-50 rounded-xl font-medium outline-none focus:ring-2 focus:ring-black border border-slate-200 transition" required placeholder="Wuse 2" value={formData.destination} onChange={e => setFormData({...formData, destination: e.target.value})}/>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Calendar className="w-3 h-3"/> Date</label>
                        <input type="date" className="w-full p-3.5 bg-slate-50 rounded-xl font-medium outline-none focus:ring-2 focus:ring-black border border-slate-200 transition" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}/>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Clock className="w-3 h-3"/> Time</label>
                        <input type="time" className="w-full p-3.5 bg-slate-50 rounded-xl font-medium outline-none focus:ring-2 focus:ring-black border border-slate-200 transition" required value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})}/>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Users className="w-3 h-3"/> Seats</label>
                        <input type="number" min="1" max="6" className="w-full p-3.5 bg-slate-50 rounded-xl font-medium outline-none focus:ring-2 focus:ring-black border border-slate-200 transition" required value={formData.seats} onChange={e => setFormData({...formData, seats: parseInt(e.target.value) || 0})}/>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><DollarSign className="w-3 h-3"/> Price ({APP_CONFIG.currency})</label>
                        <input type="number" min="0" step="100" className="w-full p-3.5 bg-slate-50 rounded-xl font-medium outline-none focus:ring-2 focus:ring-black border border-slate-200 transition" required placeholder="2500" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})}/>
                    </div>
                </div>

                <button type="submit" disabled={loading} className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition mt-4 shadow-xl flex justify-center items-center gap-2">
                    {loading ? <Loader2 className="animate-spin"/> : 'Publish Trip'}
                </button>
            </form>
        </div>
    </div>
  );
}