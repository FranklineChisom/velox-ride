'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { RideWithDriver, Wallet, VehicleClass } from '@/types';
import { format } from 'date-fns';
import { 
  User, MapPin, Clock, CreditCard, ArrowLeft, Loader2, 
  CheckCircle, ShieldCheck, Wallet as WalletIcon, Banknote, 
  Users, ChevronRight, AlertTriangle, FileText, Lock, Tag, Info
} from 'lucide-react';
import { APP_CONFIG, PAYMENT_METHODS } from '@/lib/constants';
import Script from 'next/script';
import { useToast } from '@/components/ui/ToastProvider';

declare global {
  interface Window {
    PaystackPop: any;
  }
}

const VEHICLE_CLASSES: VehicleClass[] = [
  { id: 'standard', name: 'Saver', multiplier: 1, image: 'https://cdn-icons-png.flaticon.com/512/3202/3202926.png', description: 'Affordable everyday rides', eta: 4 },
  { id: 'comfort', name: 'Comfort', multiplier: 1.4, image: 'https://cdn-icons-png.flaticon.com/512/75/75780.png', description: 'Newer cars, extra legroom', eta: 8 },
  { id: 'exec', name: 'Exec', multiplier: 2.2, image: 'https://cdn-icons-png.flaticon.com/512/55/55283.png', description: 'Premium business class', eta: 12 },
];

export default function BookingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();
  const { addToast } = useToast();
  
  const rideId = searchParams.get('ride_id');
  const requestedSeats = parseInt(searchParams.get('seats') || '1');
  const initialClass = searchParams.get('class') || 'standard';
  
  const [ride, setRide] = useState<RideWithDriver | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Flow State
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Review, 2: Payment, 3: Success
  const [seats, setSeats] = useState(requestedSeats);
  const [selectedClass, setSelectedClass] = useState<string>(initialClass);
  const [paymentMethod, setPaymentMethod] = useState<string>(PAYMENT_METHODS.WALLET);
  const [processing, setProcessing] = useState(false);
  const [agreedToRules, setAgreedToRules] = useState(false);
  
  // Promo State
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!rideId) { router.push('/search'); return; }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
         router.push(`/auth?role=passenger&next=${encodeURIComponent(`/booking?ride_id=${rideId}`)}`);
         return;
      }
      setUser(user);

      const [rideRes, walletRes] = await Promise.all([
        supabase.from('rides').select('*, profiles(*)').eq('id', rideId).single(),
        supabase.from('wallets').select('*').eq('user_id', user.id).single()
      ]);

      if (rideRes.error || !rideRes.data) {
        addToast('Ride unavailable', 'error');
        router.push('/search');
        return;
      }

      setRide(rideRes.data as unknown as RideWithDriver);
      if (walletRes.data) setWallet(walletRes.data);
      setLoading(false);
    };

    fetchData();
  }, [rideId, router, supabase, addToast]);

  const handleApplyPromo = () => {
    if (promoCode.toUpperCase() === 'VELOX500') {
        setAppliedPromo('VELOX500');
        setDiscount(500);
        addToast('Promo applied successfully!', 'success');
    } else {
        addToast('Invalid promo code', 'error');
    }
  };

  // Calculations
  const classMultiplier = VEHICLE_CLASSES.find(c => c.id === selectedClass)?.multiplier || 1;
  const basePrice = ride ? ride.price_per_seat : 0;
  const seatPrice = basePrice * classMultiplier;
  const subTotal = seatPrice * seats;
  const serviceFee = 200; 
  const finalTotal = Math.max(0, subTotal + serviceFee - discount);

  // --- Payment Handlers ---
  const processWalletPayment = async () => {
    if (!wallet || wallet.balance < finalTotal) {
      addToast('Insufficient wallet balance.', 'error');
      return;
    }
    try {
      setProcessing(true);
      await supabase.from('wallets').update({ balance: wallet.balance - finalTotal }).eq('id', wallet.id);
      await supabase.from('transactions').insert({
        wallet_id: wallet.id, amount: finalTotal, type: 'debit',
        description: `Ride Payment: ${ride?.origin} -> ${ride?.destination}`,
        status: 'success', reference: `WAL-${Date.now()}`
      });
      await createBookingRecord('paid', `WAL-${Date.now()}`);
    } catch (error: any) {
      addToast(error.message, 'error');
      setProcessing(false);
    }
  };

  const processPaystackPayment = () => {
    if (typeof window.PaystackPop === 'undefined') { addToast("Gateway loading...", 'info'); return; }
    const paystack = new window.PaystackPop();
    paystack.newTransaction({
      key: APP_CONFIG.paystackPublicKey, email: user.email, amount: finalTotal * 100, currency: 'NGN',
      ref: `REF-${Date.now()}`,
      onSuccess: async (transaction: any) => {
        setProcessing(true);
        await createBookingRecord('paid', transaction.reference);
      },
      onCancel: () => { addToast('Payment cancelled', 'info'); setProcessing(false); }
    });
  };

  const createBookingRecord = async (paymentStatus: 'paid' | 'pending', reference: string) => {
    if (!ride || !user) return;
    const { error } = await supabase.from('bookings').insert({
      ride_id: ride.id, passenger_id: user.id, seats_booked: seats,
      status: 'confirmed', payment_method: paymentMethod, payment_status: paymentStatus, payment_reference: reference
    });
    if (error) { addToast('Booking failed', 'error'); setProcessing(false); }
    else { setStep(3); setProcessing(false); }
  };

  const handleSubmit = () => {
    if (!agreedToRules) { addToast('Please accept the safety rules', 'error'); return; }
    if (paymentMethod === PAYMENT_METHODS.WALLET) processWalletPayment();
    else if (paymentMethod === PAYMENT_METHODS.CARD) processPaystackPayment();
    else { setProcessing(true); createBookingRecord('pending', 'CASH'); }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-10 h-10 animate-spin text-slate-300"/></div>;
  if (!ride) return null;

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20 px-6">
      <Script src="https://js.paystack.co/v1/inline.js" strategy="lazyOnload" />
      
      <div className="max-w-xl mx-auto">
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
                <div className="flex justify-between items-start mb-6 relative z-10">
                   <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-md">
                         {ride.profiles?.avatar_url ? <img src={ride.profiles.avatar_url} className="w-full h-full object-cover"/> : <User className="w-6 h-6 text-slate-400"/>}
                      </div>
                      <div>
                         <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                            {ride.profiles?.full_name}
                            {ride.profiles?.is_verified && <ShieldCheck className="w-4 h-4 text-green-500 fill-current"/>}
                         </h3>
                         <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">{ride.profiles?.vehicle_plate}</span>
                            <span>{ride.profiles?.vehicle_model}</span>
                         </div>
                      </div>
                   </div>
                </div>
                <div className="relative pl-6 space-y-8 z-10">
                   <div className="absolute left-[31px] top-2 bottom-6 w-0.5 bg-gradient-to-b from-black to-slate-200"></div>
                   <div className="relative z-10">
                      <div className="absolute -left-6 top-1 w-3 h-3 bg-black rounded-full ring-4 ring-white"></div>
                      <p className="text-xs font-bold text-slate-400 uppercase mb-1">Pickup</p>
                      <p className="font-bold text-slate-900 text-lg leading-tight">{ride.origin}</p>
                      <p className="text-sm text-green-600 mt-1 flex items-center gap-1 font-bold"><Clock className="w-3.5 h-3.5"/> {format(new Date(ride.departure_time), 'h:mm a • MMM dd')}</p>
                   </div>
                   <div className="relative z-10">
                      <div className="absolute -left-6 top-1 w-3 h-3 bg-slate-400 rounded-sm ring-4 ring-white"></div>
                      <p className="text-xs font-bold text-slate-400 uppercase mb-1">Dropoff</p>
                      <p className="font-bold text-slate-900 text-lg leading-tight">{ride.destination}</p>
                   </div>
                </div>
             </div>

             {/* Vehicle Class Selector (Upgrade Option) */}
             <div className="space-y-3">
                <p className="text-sm font-bold text-slate-500 uppercase ml-2">Ride Class</p>
                <div className="grid grid-cols-3 gap-3">
                    {VEHICLE_CLASSES.map(vc => (
                        <div 
                            key={vc.id} 
                            onClick={() => setSelectedClass(vc.id)}
                            className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedClass === vc.id ? 'border-black bg-slate-900 text-white' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                        >
                            <p className="text-xs font-bold text-center mb-1">{vc.name}</p>
                            <p className={`text-xs text-center ${selectedClass === vc.id ? 'text-slate-300' : 'text-slate-500'}`}>x{vc.multiplier}</p>
                        </div>
                    ))}
                </div>
             </div>

             <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
                <div><h3 className="font-bold text-slate-900 text-sm">Passengers</h3><p className="text-slate-400 text-xs">Total seats to reserve</p></div>
                <div className="flex items-center gap-4 bg-slate-50 p-1.5 rounded-xl">
                   <button disabled={seats <= 1} onClick={() => setSeats(s => Math.max(1, s - 1))} className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center font-bold hover:bg-slate-100 disabled:opacity-50">-</button>
                   <span className="w-4 text-center font-bold">{seats}</span>
                   <button disabled={seats >= ride.total_seats} onClick={() => setSeats(s => Math.min(ride.total_seats, s + 1))} className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center font-bold hover:bg-slate-100 disabled:opacity-50">+</button>
                </div>
             </div>

             <div className="flex justify-between items-end px-2 pt-2">
                <div><p className="text-slate-500 font-medium text-sm">Subtotal</p><p className="text-3xl font-bold text-slate-900 mt-1">{APP_CONFIG.currency}{subTotal.toLocaleString()}</p></div>
                <button onClick={() => setStep(2)} className="bg-black text-white px-8 py-4 rounded-xl font-bold hover:bg-slate-800 transition shadow-xl flex items-center gap-2">Checkout <ChevronRight className="w-4 h-4"/></button>
             </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
             <div className="bg-black text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                    <p className="text-slate-400 text-xs font-bold uppercase mb-1">Total to Pay</p>
                    <h2 className="text-5xl font-bold tracking-tight">{APP_CONFIG.currency}{finalTotal.toLocaleString()}</h2>
                    
                    {/* Promo Code Logic Here */}
                    <div className="mt-6">
                        {!appliedPromo ? (
                            <div className="flex gap-2">
                                <div className="flex-1 relative">
                                    <Tag className="absolute left-3 top-3 w-4 h-4 text-white/50"/>
                                    <input 
                                        placeholder="Promo Code" 
                                        value={promoCode}
                                        onChange={e => setPromoCode(e.target.value)}
                                        className="w-full bg-white/10 border border-white/20 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:bg-white/20 transition uppercase"
                                    />
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
                    <div 
                        key={m.id}
                        onClick={() => setPaymentMethod(m.id)}
                        className={`w-full flex items-center p-4 rounded-2xl border-2 transition-all cursor-pointer ${paymentMethod === m.id ? 'border-black bg-slate-50' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                    >
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

             <button onClick={handleSubmit} disabled={processing} className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-900 transition flex items-center justify-center gap-2 shadow-xl disabled:opacity-70 disabled:cursor-not-allowed">
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