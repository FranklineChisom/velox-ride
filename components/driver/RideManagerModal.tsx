'use client';
import { useState } from 'react';
import { 
  X, MapPin, Phone, MessageSquare, Navigation, 
  CheckCircle, Play, Flag, Users, User, ShieldCheck, Loader2,
  Clock, AlertTriangle
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { Ride, Booking, Profile } from '@/types';
import { useToast } from '@/components/ui/ToastProvider';
import { APP_CONFIG } from '@/lib/constants';

interface ExtendedBooking extends Booking {
  profiles: Profile;
}

interface Props {
  ride: Ride;
  bookings: ExtendedBooking[];
  onClose: () => void;
  onUpdate: () => void;
}

export default function RideManagerModal({ ride, bookings, onClose, onUpdate }: Props) {
  const supabase = createClient();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  // Calculate earnings for this specific trip
  const currentEarnings = ride.price_per_seat * bookings.length;

  const updateStatus = async (newStatus: string, arrived: boolean = false) => {
    if (!confirm(`Are you sure you want to change trip status to: ${newStatus.toUpperCase()}?`)) return;
    
    setLoading(true);
    try {
      const updates: any = { status: newStatus };
      if (arrived) updates.driver_arrived = true;

      // Reset arrival flag if completing or cancelling
      if (newStatus === 'completed' || newStatus === 'cancelled') {
          updates.driver_arrived = false; 
      }

      const { error } = await supabase
        .from('rides')
        .update(updates)
        .eq('id', ride.id);

      if (error) throw error;

      addToast(`Trip status updated: ${newStatus}`, 'success');
      onUpdate();
      
      if (newStatus === 'completed') {
        onClose();
      }
    } catch (error: any) {
      addToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigation = (location: string) => {
    // Open Google Maps Search
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white z-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Manage Ride</h2>
            <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    ride.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                }`}>
                    {ride.status}
                </span>
                <p className="text-slate-500 text-sm">
                    {bookings.length} Passenger{bookings.length !== 1 ? 's' : ''} • {APP_CONFIG.currency}{currentEarnings}
                </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition"><X className="w-6 h-6"/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/50">
          
          {/* Route Section */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
             <div className="flex gap-4 relative">
                <div className="flex flex-col items-center pt-2">
                   <div className="w-3 h-3 bg-black rounded-full shadow-[0_0_0_4px_white]"></div>
                   <div className="w-0.5 bg-slate-200 h-full -my-2"></div>
                   <div className="w-3 h-3 bg-slate-500 rounded-sm shadow-[0_0_0_4px_white]"></div>
                </div>
                <div className="flex-1 space-y-8">
                   <div className="flex justify-between items-start">
                      <div>
                         <p className="text-xs font-bold text-slate-400 uppercase mb-1">Pickup Point</p>
                         <p className="font-bold text-lg text-slate-900">{ride.origin}</p>
                      </div>
                      <button 
                        onClick={() => handleNavigation(ride.origin)} 
                        className="p-3 bg-slate-50 rounded-xl hover:bg-black hover:text-white transition group"
                        title="Navigate to Pickup"
                      >
                        <Navigation className="w-5 h-5 text-slate-600 group-hover:text-white"/>
                      </button>
                   </div>
                   <div className="flex justify-between items-start">
                      <div>
                         <p className="text-xs font-bold text-slate-400 uppercase mb-1">Dropoff Point</p>
                         <p className="font-bold text-lg text-slate-900">{ride.destination}</p>
                      </div>
                      <button 
                        onClick={() => handleNavigation(ride.destination)} 
                        className="p-3 bg-slate-50 rounded-xl hover:bg-black hover:text-white transition group"
                        title="Navigate to Dropoff"
                      >
                        <Navigation className="w-5 h-5 text-slate-600 group-hover:text-white"/>
                      </button>
                   </div>
                </div>
             </div>
          </div>

          {/* Passenger Manifest */}
          <div>
             <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider"><Users className="w-4 h-4"/> Passenger Manifest</h3>
             {bookings.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-slate-300">
                   <User className="w-10 h-10 text-slate-300 mx-auto mb-2"/>
                   <p className="text-slate-500 font-medium">No confirmed passengers yet.</p>
                   <p className="text-xs text-slate-400 mt-1">Wait for bookings to start trip.</p>
                </div>
             ) : (
                <div className="space-y-3">
                   {bookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden">
                               {booking.profiles?.avatar_url ? (
                                  <img src={booking.profiles.avatar_url} className="w-full h-full object-cover"/>
                               ) : (
                                  <User className="w-6 h-6 text-slate-400"/>
                               )}
                            </div>
                            <div>
                               <p className="font-bold text-slate-900 text-lg">{booking.profiles?.full_name}</p>
                               <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                                  <span className="bg-slate-100 px-2 py-0.5 rounded">{booking.seats_booked} Seat(s)</span>
                                  {booking.profiles?.is_verified && <span className="text-green-600 flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> Verified</span>}
                               </div>
                            </div>
                         </div>
                         <div className="flex gap-2">
                            <a href={`tel:${booking.profiles?.phone_number}`} className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition border border-slate-100 text-slate-600"><Phone className="w-5 h-5"/></a>
                         </div>
                      </div>
                   ))}
                </div>
             )}
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-6 border-t border-slate-100 bg-white z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
           <div className="grid grid-cols-2 gap-3">
              {ride.status === 'scheduled' && (
                 <>
                    <button 
                      onClick={() => updateStatus('scheduled', true)} 
                      disabled={loading || (ride as any).driver_arrived}
                      className={`col-span-1 py-4 rounded-xl font-bold transition flex items-center justify-center gap-2 disabled:opacity-50 ${
                          (ride as any).driver_arrived 
                          ? 'bg-green-100 text-green-700 cursor-default' 
                          : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                      }`}
                    >
                       {(ride as any).driver_arrived ? <CheckCircle className="w-5 h-5"/> : <MapPin className="w-5 h-5"/>}
                       {(ride as any).driver_arrived ? 'Arrived at Pickup' : 'I Have Arrived'}
                    </button>
                    <button 
                      onClick={() => updateStatus('active')} 
                      disabled={loading}
                      className="col-span-1 bg-black text-white py-4 rounded-xl font-bold hover:bg-slate-900 transition flex items-center justify-center gap-2 shadow-lg shadow-black/20"
                    >
                       {loading ? <Loader2 className="animate-spin"/> : <><Play className="w-5 h-5"/> Start Trip</>}
                    </button>
                 </>
              )}
              
              {ride.status === 'active' && (
                 <button 
                   onClick={() => updateStatus('completed')} 
                   disabled={loading}
                   className="col-span-2 bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 transition flex items-center justify-center gap-2 shadow-lg shadow-green-600/20"
                 >
                    {loading ? <Loader2 className="animate-spin"/> : <><Flag className="w-5 h-5"/> Complete Trip</>}
                 </button>
              )}

              {ride.status === 'completed' && (
                 <div className="col-span-2 text-center py-3 font-bold text-green-600 flex items-center justify-center gap-2 bg-green-50 rounded-xl border border-green-100">
                    <CheckCircle className="w-5 h-5"/> Trip Completed
                 </div>
              )}
           </div>
        </div>

      </div>
    </div>
  );
}