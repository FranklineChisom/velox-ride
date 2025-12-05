'use client';
import { useState } from 'react';
import { 
  X, MapPin, Phone, CheckCircle, Play, Flag, Users, User, ShieldCheck, Loader2, Navigation, AlertTriangle, MessageSquare 
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { RideWithBookings } from '@/types';
import { useToast } from '@/components/ui/ToastProvider';
import { APP_CONFIG } from '@/lib/constants';
import Modal from '@/components/ui/Modal';

interface Props {
  ride: RideWithBookings;
  bookings: RideWithBookings['bookings'];
  onClose: () => void;
  onUpdate: () => void;
}

export default function RideManagerModal({ ride, bookings, onClose, onUpdate }: Props) {
  const supabase = createClient();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: string, action: () => void, color: string } | null>(null);

  // Lifecycle Logic
  const handleAction = async (status: string, arrived: boolean = false) => {
    setLoading(true);
    try {
      const updates: any = { status };
      if (arrived) updates.driver_arrived = true;
      if (status === 'active') updates.actual_start_time = new Date().toISOString();
      if (status === 'completed') {
          updates.actual_end_time = new Date().toISOString();
          updates.driver_arrived = false;
      }

      const { error } = await supabase.from('rides').update(updates).eq('id', ride.id);
      if (error) throw error;

      addToast('Trip updated successfully', 'success');
      onUpdate();
      if (status === 'completed') onClose();
    } catch (e: any) {
      addToast(e.message, 'error');
    } finally {
      setLoading(false);
      setConfirmAction(null);
    }
  };

  const openNav = (loc: string) => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc)}`, '_blank');
  const openCall = (phone: string) => window.open(`tel:${phone}`, '_self');

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    ride.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                }`}>
                    {ride.status.replace('_', ' ')}
                </span>
                {ride.driver_arrived && <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">At Pickup</span>}
            </div>
            <h2 className="text-xl font-bold text-slate-900">{ride.origin} → {ride.destination}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition"><X className="w-6 h-6"/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50">
          
          {/* Action Bar (Dynamic based on state) */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
             <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-wider">Next Action</h3>
             <div className="flex gap-4">
                {ride.status === 'scheduled' && !ride.driver_arrived && (
                   <button 
                     onClick={() => setConfirmAction({ type: 'Confirm Arrival', action: () => handleAction('scheduled', true), color: 'bg-blue-600' })}
                     className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                   >
                      <MapPin className="w-5 h-5"/> I Have Arrived
                   </button>
                )}
                {ride.status === 'scheduled' && ride.driver_arrived && (
                   <button 
                     onClick={() => setConfirmAction({ type: 'Start Trip', action: () => handleAction('active'), color: 'bg-black' })}
                     className="flex-1 bg-black text-white py-4 rounded-xl font-bold hover:bg-slate-900 transition flex items-center justify-center gap-2 shadow-lg shadow-black/20"
                   >
                      <Play className="w-5 h-5"/> Start Journey
                   </button>
                )}
                {ride.status === 'active' && (
                   <button 
                     onClick={() => setConfirmAction({ type: 'Complete Trip', action: () => handleAction('completed'), color: 'bg-green-600' })}
                     className="flex-1 bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 transition flex items-center justify-center gap-2 shadow-lg shadow-green-600/20"
                   >
                      <Flag className="w-5 h-5"/> Complete Trip
                   </button>
                )}
                {ride.status === 'completed' && (
                   <div className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-xl font-bold flex items-center justify-center gap-2 cursor-default">
                      <CheckCircle className="w-5 h-5"/> Trip Completed
                   </div>
                )}
             </div>
          </div>

          {/* Navigation */}
          <div className="space-y-4">
             <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">A</div>
                   <span className="font-bold text-slate-900">{ride.origin}</span>
                </div>
                <button onClick={() => openNav(ride.origin)} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-blue-600"><Navigation className="w-5 h-5"/></button>
             </div>
             <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold">B</div>
                   <span className="font-bold text-slate-900">{ride.destination}</span>
                </div>
                <button onClick={() => openNav(ride.destination)} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-blue-600"><Navigation className="w-5 h-5"/></button>
             </div>
          </div>

          {/* Passengers */}
          <div>
             <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider"><Users className="w-4 h-4"/> Manifest ({bookings.length})</h3>
             {bookings.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-2xl border border-dashed border-slate-200">
                   <p className="text-slate-400 text-sm">No passengers yet.</p>
                </div>
             ) : (
                <div className="space-y-3">
                   {bookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden">
                               {booking.profiles?.avatar_url ? (
                                  <img src={booking.profiles.avatar_url} className="w-full h-full object-cover"/>
                               ) : <User className="w-5 h-5 text-slate-400"/>}
                            </div>
                            <div>
                               <p className="font-bold text-slate-900 text-sm">{booking.profiles?.full_name}</p>
                               <span className="text-xs font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600">{booking.seats_booked} Seat(s)</span>
                            </div>
                         </div>
                         <div className="flex gap-2">
                            {booking.profiles?.phone_number && (
                               <button onClick={() => openCall(booking.profiles.phone_number!)} className="p-2.5 bg-slate-50 rounded-xl hover:bg-green-50 hover:text-green-600 transition"><Phone className="w-4 h-4"/></button>
                            )}
                         </div>
                      </div>
                   ))}
                </div>
             )}
          </div>
        </div>

        {/* Confirmation Modal */}
        <Modal isOpen={!!confirmAction} onClose={() => setConfirmAction(null)} title={confirmAction?.type || 'Confirm'}>
           <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-900">
                 <AlertTriangle className="w-8 h-8"/>
              </div>
              <p className="text-slate-600">Are you sure you want to proceed?</p>
              <div className="flex gap-4">
                 <button onClick={() => setConfirmAction(null)} className="flex-1 py-3 border rounded-xl font-bold hover:bg-slate-50">Cancel</button>
                 <button onClick={confirmAction?.action} className={`flex-1 py-3 text-white rounded-xl font-bold hover:opacity-90 flex items-center justify-center gap-2 ${confirmAction?.color}`}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Yes, Proceed'}
                 </button>
              </div>
           </div>
        </Modal>

      </div>
    </div>
  );
}