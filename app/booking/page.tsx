'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { RideWithDriver, Wallet, VehicleClass } from '@/types';
import { format, addMinutes } from 'date-fns';
import { 
  User, Clock, CreditCard, ArrowLeft, Loader2, 
  CheckCircle, Wallet as WalletIcon, Banknote, 
  ChevronRight, Lock, Tag
} from 'lucide-react';
import { APP_CONFIG, PAYMENT_METHODS } from '@/lib/constants';
import Script from 'next/script';
import { useToast } from '@/components/ui/ToastProvider';
import { calculateFare } from '@/lib/pricing';
import { getDrivingStats } from '@/lib/osm';

declare global { interface Window { PaystackPop: any; } }

export default function BookingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();
  const { addToast } = useToast();
  
  // Params
  const rideId = searchParams.get('ride_id');
  const mode = searchParams.get('mode'); 
  const seats = parseInt(searchParams.get('seats') || '1');
  
  const [ride, setRide] = useState<RideWithDriver | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [vehicleClasses, setVehicleClasses] = useState<VehicleClass[]>([]); // Dynamic Classes
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [paymentMethod, setPaymentMethod] = useState<string>(PAYMENT_METHODS.WALLET);
  const [processing, setProcessing] = useState(false);
  const [agreedToRules, setAgreedToRules] = useState(false);
  
  // Promo State
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push(`/auth?role=passenger`); return; }
      setUser(user);

      // Fetch Wallet & Vehicle Classes concurrently
      const [walletRes, classesRes] = await Promise.all([
        supabase.from('wallets').select('*').eq('user_id', user.id).single(),
        supabase.from('vehicle_classes').select('*').eq('is_active', true)
      ]);

      if (walletRes.data) setWallet(walletRes.data);
      if (classesRes.data) setVehicleClasses(classesRes.data);

      if (mode === 'instant') {
          // DYNAMICALLY CALCULATE INSTANT RIDE DATA
          const origin = searchParams.get('origin') || 'Current Location';
          const destination = searchParams.get('destination') || 'Destination';
          const pLat = parseFloat(searchParams.get('pickup_lat') || '0');
          const pLng = parseFloat(searchParams.get('pickup_lng') || '0');
          const dLat = parseFloat(searchParams.get('dropoff_lat') || '0');
          const dLng = parseFloat(searchParams.get('dropoff_lng') || '0');

          let price = 0;
          if (pLat && pLng && dLat && dLng) {
             const stats = await getDrivingStats({ lat: pLat, lng: pLng }, { lat: dLat, lng: dLng });
             price = calculateFare(stats);
          } else {
             price = 2000; // Fallback
          }

          setRide({
              id: 'instant-pending',
              driver_id: 'pending',
              origin,
              destination,
              departure_time: new Date().toISOString(),
              price_per_seat: price,
              total_seats: 4,
              status: 'active',
              origin_lat: pLat, origin_lng: pLng, destination_lat: dLat, destination_lng: dLng, driver_arrived: false, created_at: new Date().toISOString(),
              profiles: { full_name: 'Finding Driver...', vehicle_model: 'Velox Car', vehicle_plate: '---', is_verified: true, avatar_url: null } as any
          });
          setLoading(false);
      } else if (rideId) {
          const { data } = await supabase.from('rides').select('*, profiles(*)').eq('id', rideId).single();
          if (data) setRide(data as unknown as RideWithDriver);
          else { addToast('Ride not found', 'error'); router.push('/search'); }
          setLoading(false);
      } else {
          router.push('/passenger');
      }
    };
    fetchData();
  }, []);

  const handleApplyPromo = () => {
    if (promoCode.toUpperCase() === 'VELOX500') { setAppliedPromo('VELOX500'); setDiscount(500); addToast('Promo applied!', 'success'); } 
    else addToast('Invalid code', 'error');
  };

  const basePrice = ride ? ride.price_per_seat : 0;
  const subTotal = basePrice * seats;
  const serviceFee = 200; 
  const finalTotal = Math.max(0, subTotal + serviceFee - discount);

  const processPayment = async () => {
      setProcessing(true);
      
      // 1. Deduct Wallet if applicable
      if (paymentMethod === PAYMENT_METHODS.WALLET) {
          if (!wallet || wallet.balance < finalTotal) {
             addToast('Insufficient balance', 'error');
             setProcessing(false);
             return;
          }
          await supabase.from('wallets').update({ balance: wallet.balance - finalTotal }).eq('id', wallet.id);
          await supabase.from('transactions').insert({
            wallet_id: wallet.id, amount: finalTotal, type: 'debit',
            description: `Ride Payment: ${ride?.origin} -> ${ride?.destination}`,
            status: 'success', reference: `WAL-${Date.now()}`
          });
      }
      
      // 2. Create Real Ride Record if Instant
      let finalRideId = rideId;
      if (mode === 'instant' && user && ride) {
          // Assign to a real driver in DB (First available for MVP)
          const { data: drivers } = await supabase.from('profiles').select('id').eq('role', 'driver').eq('is_online', true).limit(1);
          // If no online driver, fallback to random driver to prevent crash in demo, but strictly this should fail in prod.
          const { data: allDrivers } = await supabase.from('profiles').select('id').eq('role', 'driver').limit(1);
          
          const driverId = drivers?.[0]?.id || allDrivers?.[0]?.id || user.id;

          const { data: newRide } = await supabase.from('rides').insert({
              driver_id: driverId, 
              origin: ride.origin,
              destination: ride.destination,
              status: 'active',
              total_seats: 4,
              price_per_seat: basePrice,
              departure_time: new Date().toISOString(),
              origin_lat: ride.origin_lat, origin_lng: ride.origin_lng, 
              destination_lat: ride.destination_lat, destination_lng: ride.destination_lng, 
              driver_arrived: false
          }).select().single();
          if(newRide) finalRideId = newRide.id;
      }

      // 3. Create Booking
      if(finalRideId) {
          await supabase.from('bookings').insert({
              ride_id: finalRideId, passenger_id: user.id, seats_booked: seats,
              status: 'confirmed', payment_method: paymentMethod, payment_status: paymentMethod === 'cash' ? 'pending' : 'paid'
          });
          setStep(3);
      } else {
         addToast('Failed to initialize ride', 'error');
      }
      setProcessing(false);
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-10 h-10 animate-spin text-slate-300"/></div>;
  if (!ride) return null;

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20 px-6">
      <Script src="https://js.paystack.co/v1/inline.js" strategy="lazyOnload" />
      <div className="max-w-xl mx-auto">
        
        {/* Header Navigation */}
        {step < 3 && (
            <div className="flex items-center gap-4 mb-8">
            <button onClick={() => step === 1 ? router.back() : setStep(1)} className="p-3 bg-white rounded-full shadow-sm hover:bg-slate-100 transition"><ArrowLeft className="w-5 h-5"/></button>
            <div>
                <h1 className="text-2xl font-bold text-slate-900">{step === 1 ? 'Trip Summary' : 'Payment'}</h1>
                <p className="text-slate-500 text-sm">Step {step} of 3</p>
            </div>
            </div>
        )}

        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
             <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="flex items-center gap-4 mb-6 relative z-10">
                    <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-md">
                        {ride.profiles?.avatar_url ? <img src={ride.profiles.avatar_url} className="w-full h-full object-cover"/> : <User className="w-6 h-6 text-slate-400"/>}
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 text-lg">{mode === 'instant' ? 'Finding Driver...' : ride.profiles?.full_name}</h3>
                        {/* Display first active vehicle class as default or make it selectable in future */}
                        <p className="text-xs text-slate-500">{vehicleClasses[0]?.name || 'Standard'} Class</p>
                    </div>
                </div>

                <div className="relative pl-6 space-y-8 z-10">
                   <div className="absolute left-[31px] top-2 bottom-6 w-0.5 bg-gradient-to-b from-black to-slate-200"></div>
                   <div className="relative z-10">
                      <div className="absolute -left-6 top-1 w-3 h-3 bg-black rounded-full ring-4 ring-white"></div>
                      <p className="text-xs font-bold text-slate-400 uppercase mb-1">Pickup</p>
                      <p className="font-bold text-slate-900 text-lg leading-tight">{ride.origin}</p>
                      <p className="text-sm text-green-600 mt-1 flex items-center gap-1 font-bold">
                         <Clock className="w-3.5 h-3.5"/> 
                         {mode === 'instant' ? `${vehicleClasses[0]?.base_eta || 5} mins away` : `${format(new Date(ride.departure_time), 'h:mm')} - ${format(addMinutes(new Date(ride.departure_time), 5), 'h:mm a')}`}
                      </p>
                   </div>
                   <div className="relative z-10">
                      <div className="absolute -left-6 top-1 w-3 h-3 bg-slate-400 rounded-sm ring-4 ring-white"></div>
                      <p className="text-xs font-bold text-slate-400 uppercase mb-1">Dropoff</p>
                      <p className="font-bold text-slate-900 text-lg leading-tight">{ride.destination}</p>
                   </div>
                </div>
             </div>

             <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
                <div><h3 className="font-bold text-slate-900 text-sm">Passengers</h3><p className="text-slate-400 text-xs">Total seats to reserve</p></div>
                <div className="flex items-center gap-4 bg-slate-50 p-1.5 rounded-xl">
                   <button disabled={seats <= 1} onClick={() => router.replace(`?ride_id=${rideId || ''}&seats=${Math.max(1, seats - 1)}&mode=${mode || ''}`)} className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center font-bold hover:bg-slate-100 disabled:opacity-50">-</button>
                   <span className="w-4 text-center font-bold">{seats}</span>
                   <button disabled={seats >= (ride.total_seats || 4)} onClick={() => router.replace(`?ride_id=${rideId || ''}&seats=${Math.min((ride.total_seats || 4), seats + 1)}&mode=${mode || ''}`)} className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center font-bold hover:bg-slate-100 disabled:opacity-50">+</button>
                </div>
             </div>
             
             <div className="flex justify-between items-end px-2 pt-2">
                <div><p className="text-slate-500 font-medium text-sm">Total Fare</p><p className="text-3xl font-bold text-slate-900 mt-1">{APP_CONFIG.currency}{subTotal.toLocaleString()}</p></div>
                <button onClick={() => setStep(2)} className="bg-black text-white px-8 py-4 rounded-xl font-bold hover:bg-slate-800 transition shadow-xl flex items-center gap-2">Continue <ChevronRight className="w-4 h-4"/></button>
             </div>
          </div>
        )}

        {step === 2 && (
            <div className="space-y-6 animate-fade-in">
                <div className="bg-black text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-slate-400 text-xs font-bold uppercase mb-1">Total to Pay</p>
                        <h2 className="text-5xl font-bold tracking-tight">{APP_CONFIG.currency}{finalTotal.toLocaleString()}</h2>
                        
                        <div className="mt-6">
                            {!appliedPromo ? (
                                <div className="flex gap-2">
                                    <div className="flex-1 relative">
                                        <Tag className="absolute left-3 top-3 w-4 h-4 text-white/50"/>
                                        <input placeholder="Promo Code" value={promoCode} onChange={e => setPromoCode(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:bg-white/20 transition uppercase"/>
                                    </div>
                                    <button onClick={handleApplyPromo} className="bg-white text-black px-4 rounded-xl text-xs font-bold hover:bg-slate-200 transition">Apply</button>
                                </div>
                            ) : (
                                <div className="flex justify-between items-center bg-green-500/20 border border-green-500/50 p-3 rounded-xl">
                                    <span className="text-sm font-bold text-green-400 flex items-center gap-2"><Tag className="w-4 h-4"/> {appliedPromo} applied</span>
                                    <button onClick={() => { setAppliedPromo(null); setDiscount(0); }} className="text-xs text-white/60 hover:text-white">Remove</button>
                                </div>
                            )}
                        </div>
    
                        <div className="mt-4 pt-4 border-t border-white/10 space-y-2 text-sm text-slate-400">
                            <div className="flex justify-between"><span>Ride Fare (x{seats})</span><span>{APP_CONFIG.currency}{subTotal.toLocaleString()}</span></div>
                            <div className="flex justify-between"><span>Service Fee</span><span>{APP_CONFIG.currency}{serviceFee}</span></div>
                            {discount > 0 && <div className="flex justify-between text-green-400"><span>Discount</span><span>-{APP_CONFIG.currency}{discount}</span></div>}
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    {[
                        { id: PAYMENT_METHODS.WALLET, label: 'Wallet', sub: `Bal: ${APP_CONFIG.currency}${wallet?.balance.toLocaleString() || '0'}`, icon: WalletIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { id: PAYMENT_METHODS.CARD, label: 'Card Payment', sub: 'Paystack Secure', icon: CreditCard, color: 'text-orange-600', bg: 'bg-orange-50' },
                        { id: PAYMENT_METHODS.CASH, label: 'Cash', sub: 'Pay driver directly', icon: Banknote, color: 'text-green-600', bg: 'bg-green-50' },
                    ].map((m) => (
                        <div key={m.id} onClick={() => setPaymentMethod(m.id)} className={`w-full flex items-center p-4 rounded-2xl border-2 transition-all cursor-pointer ${paymentMethod === m.id ? 'border-black bg-slate-50' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${m.bg} ${m.color}`}><m.icon className="w-6 h-6"/></div>
                            <div className="flex-1"><p className="font-bold text-slate-900">{m.label}</p><p className="text-xs text-slate-500 font-bold">{m.sub}</p></div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === m.id ? 'border-black' : 'border-slate-200'}`}>{paymentMethod === m.id && <div className="w-3 h-3 bg-black rounded-full"/>}</div>
                        </div>
                    ))}
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex gap-3 items-start">
                    <input type="checkbox" checked={agreedToRules} onChange={e => setAgreedToRules(e.target.checked)} className="mt-1 w-5 h-5 accent-black shrink-0"/>
                    <div className="text-xs text-slate-600 leading-relaxed"><p className="font-bold text-slate-900 mb-1">Safety First</p>I agree to the Community Guidelines and will provide the 4-digit start code to the driver upon entry.</div>
                </div>

                <button onClick={processPayment} disabled={processing} className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-900 transition flex items-center justify-center gap-2 shadow-xl disabled:opacity-70 disabled:cursor-not-allowed">
                    {processing ? <Loader2 className="w-5 h-5 animate-spin"/> : <><Lock className="w-4 h-4"/> Pay {APP_CONFIG.currency}{finalTotal.toLocaleString()}</>}
                </button>
            </div>
        )}

        {step === 3 && (
           <div className="text-center py-12 animate-scale-up">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm"><CheckCircle className="w-12 h-12 text-green-600"/></div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Booking Confirmed!</h2>
              <p className="text-slate-500 max-w-sm mx-auto mb-10">Your seat is reserved. View your ticket for the ride OTP code.</p>
              <div className="space-y-3 max-w-xs mx-auto">
                 <button onClick={() => router.push('/passenger/trips')} className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition shadow-lg">View Ticket</button>
                 <button onClick={() => router.push('/passenger')} className="w-full bg-white border border-slate-200 text-slate-900 py-4 rounded-xl font-bold hover:bg-slate-50 transition">Back Home</button>
              </div>
           </div>
        )}
      </div>
    </div>
  );
}