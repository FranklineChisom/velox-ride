'use client';
import { useState } from 'react';
import { X, Loader2, Calendar, Clock, MapPin, DollarSign, Users, AlertCircle } from 'lucide-react';
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
    origin: '', destination: '', date: '', time: '', seats: 3, price: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
        const departureTime = new Date(`${formData.date}T${formData.time}`);
        if (isNaN(departureTime.getTime())) throw new Error("Invalid date/time");
        if (departureTime < new Date()) throw new Error("Trip time must be in the future");

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
        <div className="bg-white p-8 rounded-[2.5rem] w-full max-w-lg relative animate-scale-up shadow-2xl">
            <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 transition"><X className="w-5 h-5"/></button>
            
            <div className="mb-8">
                <h3 className="text-2xl font-bold text-slate-900">Post a Trip</h3>
                <p className="text-slate-500 text-sm">Fill your empty seats for your next journey.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 gap-4">
                    <div className="relative">
                        <MapPin className="absolute top-3.5 left-4 w-5 h-5 text-slate-400"/>
                        <input className="w-full p-3.5 pl-12 bg-slate-50 rounded-xl font-medium outline-none focus:ring-2 focus:ring-black border border-slate-200 transition" required placeholder="Origin (e.g. Lekki)" value={formData.origin} onChange={e => setFormData({...formData, origin: e.target.value})}/>
                    </div>
                    <div className="relative">
                        <MapPin className="absolute top-3.5 left-4 w-5 h-5 text-slate-400"/>
                        <input className="w-full p-3.5 pl-12 bg-slate-50 rounded-xl font-medium outline-none focus:ring-2 focus:ring-black border border-slate-200 transition" required placeholder="Destination (e.g. VI)" value={formData.destination} onChange={e => setFormData({...formData, destination: e.target.value})}/>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                        <Calendar className="absolute top-3.5 left-4 w-5 h-5 text-slate-400"/>
                        <input type="date" className="w-full p-3.5 pl-12 bg-slate-50 rounded-xl font-medium outline-none focus:ring-2 focus:ring-black border border-slate-200 transition" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}/>
                    </div>
                    <div className="relative">
                        <Clock className="absolute top-3.5 left-4 w-5 h-5 text-slate-400"/>
                        <input type="time" className="w-full p-3.5 pl-12 bg-slate-50 rounded-xl font-medium outline-none focus:ring-2 focus:ring-black border border-slate-200 transition" required value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})}/>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Seats</label>
                        <div className="relative">
                           <Users className="absolute top-3.5 left-4 w-5 h-5 text-slate-400"/>
                           <input type="number" min="1" max="6" className="w-full p-3.5 pl-12 bg-slate-50 rounded-xl font-medium outline-none focus:ring-2 focus:ring-black border border-slate-200 transition" required value={formData.seats} onChange={e => setFormData({...formData, seats: parseInt(e.target.value) || 0})}/>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Price / Seat</label>
                        <div className="relative">
                           <DollarSign className="absolute top-3.5 left-4 w-5 h-5 text-slate-400"/>
                           <input type="number" min="0" step="100" className="w-full p-3.5 pl-12 bg-slate-50 rounded-xl font-medium outline-none focus:ring-2 focus:ring-black border border-slate-200 transition" required placeholder="2500" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})}/>
                        </div>
                    </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl flex gap-3 border border-blue-100">
                   <AlertCircle className="w-5 h-5 text-blue-600 shrink-0"/>
                   <p className="text-xs text-blue-800 leading-relaxed">
                      <strong>Platform Fee:</strong> 15% commission is deducted from total earnings.
                   </p>
                </div>

                <button type="submit" disabled={loading} className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-slate-900 transition shadow-xl flex justify-center items-center gap-2">
                    {loading ? <Loader2 className="animate-spin"/> : 'Publish Trip'}
                </button>
            </form>
        </div>
    </div>
  );
}