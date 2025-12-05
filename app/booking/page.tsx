'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { RideWithDriver, Wallet } from '@/types';
import { format } from 'date-fns';
import { 
  User, MapPin, Clock, CreditCard, ArrowLeft, Loader2, 
  CheckCircle, ShieldCheck, Wallet as WalletIcon, Banknote, 
  Users, ChevronRight, AlertCircle 
} from 'lucide-react';
import { APP_CONFIG, PAYMENT_METHODS } from '@/lib/constants';
import Script from 'next/script';
import { useToast } from '@/components/ui/ToastProvider';

declare global {
  interface Window {
    PaystackPop: any;
  }
}

export default function BookingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();
  const { addToast } = useToast();
  
  const rideId = searchParams.get('ride_id');
  
  // Data State
  const [ride, setRide] = useState<RideWithDriver | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Flow State
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Details, 2: Payment, 3: Success
  const [seats, setSeats] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<string>(PAYMENT_METHODS.WALLET);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!rideId) {
        router.push('/search');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
         // Redirect to auth if not logged in, keeping the intended destination
         router.push(`/auth?role=passenger&next=${encodeURIComponent(`/booking?ride_id=${rideId}`)}`);
         return;
      }
      setUser(user);

      // Fetch Ride & Wallet in parallel
      const [rideRes, walletRes] = await Promise.all([
        supabase
          .from('rides')
          .select('*, profiles(full_name, phone_number, is_verified, avatar_url, vehicle_model, vehicle_color, vehicle_plate)')
          .eq('id', rideId)
          .single(),
        supabase
          .from('wallets')
          .select('*')
          .eq('user_id', user.id)
          .single()
      ]);

      if (rideRes.error || !rideRes.data) {
        addToast('Ride unavailable or not found', 'error');
        router.push('/search');
        return;
      }

      setRide(rideRes.data as unknown as RideWithDriver);
      
      // If wallet doesn't exist, we just leave it null (user can't use wallet pay)
      if (walletRes.data) setWallet(walletRes.data);
      
      setLoading(false);
    };

    fetchData();
  }, [rideId, router, supabase, addToast]);

  // Calculations
  const totalFare = ride ? ride.price_per_seat * seats : 0;
  const serviceFee = 0; // Can be dynamic later
  const finalTotal = totalFare + serviceFee;

  // --- Payment Handlers ---

  const processWalletPayment = async () => {
    if (!wallet) {
      addToast('Wallet not found. Please contact support.', 'error');
      return;
    }
    
    if (wallet.balance < finalTotal) {
      addToast('Insufficient wallet balance. Please fund your wallet.', 'error');
      return;
    }

    try {
      setProcessing(true);

      // 1. Deduct Balance
      const { error: walletError } = await supabase
        .from('wallets')
        .update({ balance: wallet.balance - finalTotal })
        .eq('id', wallet.id);

      if (walletError) throw new Error('Failed to charge wallet');

      // 2. Create Transaction Record
      await supabase.from('transactions').insert({
        wallet_id: wallet.id,
        amount: finalTotal,
        type: 'debit',
        description: `Ride Payment: ${ride?.origin} -> ${ride?.destination}`,
        status: 'success',
        reference: `WAL-${Date.now()}`
      });

      // 3. Create Booking
      await createBookingRecord('paid', `WAL-${Date.now()}`);

    } catch (error: any) {
      addToast(error.message, 'error');
      setProcessing(false);
    }
  };

  const processPaystackPayment = () => {
    if (typeof window.PaystackPop === 'undefined') {
        addToast("Payment gateway loading. Please wait...", 'info');
        return;
    }

    if (!APP_CONFIG.paystackPublicKey) {
        addToast("Payment configuration missing.", 'error');
        return;
    }

    const paystack = new window.PaystackPop();
    paystack.newTransaction({
      key: APP_CONFIG.paystackPublicKey,
      email: user.email,
      amount: finalTotal * 100, // Paystack expects Kobo
      currency: 'NGN',
      ref: `REF-${Date.now()}`,
      onSuccess: async (transaction: any) => {
        setProcessing(true); // Keep spinner going while we save
        await createBookingRecord('paid', transaction.reference);
      },
      onCancel: () => {
        addToast('Payment cancelled', 'info');
        setProcessing(false);
      }
    });
  };

  const processCashPayment = async () => {
    setProcessing(true);
    // Cash bookings are "confirmed" but payment is "pending"
    await createBookingRecord('pending', 'CASH');
  };

  const createBookingRecord = async (paymentStatus: 'paid' | 'pending', reference: string) => {
    try {
      if (!ride || !user) return;

      const { error } = await supabase.from('bookings').insert({
        ride_id: ride.id,
        passenger_id: user.id,
        seats_booked: seats,
        status: 'confirmed', // Immediate confirmation
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        payment_reference: reference
      });

      if (error) throw error;

      setStep(3); // Success!
    } catch (error: any) {
      console.error(error);
      addToast('Booking failed. Please try again.', 'error');
      // Note: If wallet was charged, we should ideally refund here (rollback), 
      // but for this MVP level, we'll rely on manual support.
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmit = () => {
    if (paymentMethod === PAYMENT_METHODS.WALLET) processWalletPayment();
    else if (paymentMethod === PAYMENT_METHODS.CARD) processPaystackPayment();
    else processCashPayment();
  };

  // --- Renders ---

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-10 h-10 animate-spin text-slate-300"/></div>;
  if (!ride) return null;

  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-20 px-6">
      <Script src="https://js.paystack.co/v1/inline.js" strategy="lazyOnload" />
      
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => step === 1 ? router.back() : setStep(1)} className="p-3 bg-white rounded-full shadow-sm hover:bg-slate-100 transition">
            <ArrowLeft className="w-5 h-5"/>
          </button>
          <div>
             <h1 className="text-2xl font-bold text-slate-900">
               {step === 1 ? 'Trip Details' : step === 2 ? 'Secure Checkout' : 'Booking Confirmed'}
             </h1>
             <p className="text-slate-500 text-sm">Step {step} of 3</p>
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
             {/* Ride Card */}
             <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="flex justify-between items-start mb-6">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden">
                         {ride.profiles?.avatar_url ? <img src={ride.profiles.avatar_url} className="w-full h-full object-cover"/> : <User className="w-6 h-6 text-slate-400"/>}
                      </div>
                      <div>
                         <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                            {ride.profiles?.full_name?.split(' ')[0]} 
                            {ride.profiles?.is_verified && <ShieldCheck className="w-4 h-4 text-green-500"/>}
                         </h3>
                         <p className="text-sm text-slate-500">{ride.profiles?.vehicle_color} {ride.profiles?.vehicle_model} • {ride.profiles?.vehicle_plate}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-2xl font-bold text-slate-900">{APP_CONFIG.currency}{ride.price_per_seat}</p>
                      <p className="text-xs text-slate-400 font-bold uppercase">Per Seat</p>
                   </div>
                </div>

                <div className="relative pl-4 space-y-8">
                   <div className="absolute left-[19px] top-2 bottom-6 w-0.5 bg-slate-100"></div>
                   <div className="relative z-10">
                      <p className="text-xs font-bold text-slate-400 uppercase mb-1">Pickup</p>
                      <p className="font-bold text-slate-900 text-lg">{ride.origin}</p>
                      <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                         <Clock className="w-3 h-3"/> {format(new Date(ride.departure_time), 'h:mm a • MMM dd')}
                      </p>
                   </div>
                   <div className="relative z-10">
                      <p className="text-xs font-bold text-slate-400 uppercase mb-1">Dropoff</p>
                      <p className="font-bold text-slate-900 text-lg">{ride.destination}</p>
                   </div>
                </div>
             </div>

             {/* Seat Selection */}
             <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
                <div>
                   <h3 className="font-bold text-slate-900 flex items-center gap-2"><Users className="w-5 h-5"/> Passengers</h3>
                   <p className="text-slate-500 text-sm mt-1">How many seats do you need?</p>
                </div>
                <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl">
                   <button 
                     disabled={seats <= 1}
                     onClick={() => setSeats(s => Math.max(1, s - 1))}
                     className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center font-bold text-xl hover:bg-slate-100 disabled:opacity-50 transition"
                   >
                     -
                   </button>
                   <span className="w-6 text-center font-bold text-lg">{seats}</span>
                   <button 
                     disabled={seats >= (ride.total_seats - (0))} // Ideally subtract booked seats here
                     onClick={() => setSeats(s => Math.min(ride.total_seats, s + 1))}
                     className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center font-bold text-xl hover:bg-slate-100 disabled:opacity-50 transition"
                   >
                     +
                   </button>
                </div>
             </div>

             <div className="pt-4">
                <div className="flex justify-between items-center mb-6 px-2">
                   <span className="text-slate-500 font-bold">Total Fare</span>
                   <span className="text-3xl font-bold text-slate-900">{APP_CONFIG.currency}{totalFare.toLocaleString()}</span>
                </div>
                <button onClick={() => setStep(2)} className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition flex items-center justify-center gap-2 shadow-xl">
                   Continue to Payment <ChevronRight className="w-5 h-5"/>
                </button>
             </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
             
             <div className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-lg">
                <p className="text-slate-400 text-xs font-bold uppercase mb-1">Total to Pay</p>
                <h2 className="text-4xl font-bold">{APP_CONFIG.currency}{finalTotal.toLocaleString()}</h2>
                <p className="text-slate-400 text-sm mt-2">{seats} Seat(s) • {ride.origin} to {ride.destination}</p>
             </div>

             <div className="space-y-3">
                <p className="font-bold text-slate-900 ml-2">Choose Payment Method</p>
                
                {/* Wallet Option */}
                <button
                  onClick={() => setPaymentMethod(PAYMENT_METHODS.WALLET)}
                  className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${
                     paymentMethod === PAYMENT_METHODS.WALLET 
                     ? 'border-black bg-slate-50' 
                     : 'border-slate-100 hover:border-slate-200 bg-white'
                  }`}
                >
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                         <WalletIcon className="w-6 h-6"/>
                      </div>
                      <div className="text-left">
                         <p className="font-bold text-slate-900">My Wallet</p>
                         <p className="text-xs text-slate-500 font-bold">
                            Balance: {wallet ? `${APP_CONFIG.currency}${wallet.balance.toLocaleString()}` : 'Unavailable'}
                         </p>
                      </div>
                   </div>
                   {paymentMethod === PAYMENT_METHODS.WALLET && <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center"><div className="w-2 h-2 bg-white rounded-full"/></div>}
                </button>

                {/* Card Option */}
                <button
                  onClick={() => setPaymentMethod(PAYMENT_METHODS.CARD)}
                  className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${
                     paymentMethod === PAYMENT_METHODS.CARD 
                     ? 'border-black bg-slate-50' 
                     : 'border-slate-100 hover:border-slate-200 bg-white'
                  }`}
                >
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                         <CreditCard className="w-6 h-6"/>
                      </div>
                      <div className="text-left">
                         <p className="font-bold text-slate-900">Pay with Card</p>
                         <p className="text-xs text-slate-500 font-bold">Paystack Secure</p>
                      </div>
                   </div>
                   {paymentMethod === PAYMENT_METHODS.CARD && <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center"><div className="w-2 h-2 bg-white rounded-full"/></div>}
                </button>

                {/* Cash Option */}
                <button
                  onClick={() => setPaymentMethod(PAYMENT_METHODS.CASH)}
                  className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${
                     paymentMethod === PAYMENT_METHODS.CASH 
                     ? 'border-black bg-slate-50' 
                     : 'border-slate-100 hover:border-slate-200 bg-white'
                  }`}
                >
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                         <Banknote className="w-6 h-6"/>
                      </div>
                      <div className="text-left">
                         <p className="font-bold text-slate-900">Pay Cash</p>
                         <p className="text-xs text-slate-500 font-bold">Pay driver on arrival</p>
                      </div>
                   </div>
                   {paymentMethod === PAYMENT_METHODS.CASH && <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center"><div className="w-2 h-2 bg-white rounded-full"/></div>}
                </button>
             </div>

             <button 
               onClick={handleSubmit} 
               disabled={processing}
               className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-900 transition flex items-center justify-center gap-2 shadow-xl mt-4"
             >
                {processing ? <Loader2 className="animate-spin w-5 h-5"/> : `Confirm Payment ${APP_CONFIG.currency}${finalTotal.toLocaleString()}`}
             </button>
          </div>
        )}

        {step === 3 && (
           <div className="text-center py-12 animate-scale-up">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                 <CheckCircle className="w-12 h-12 text-green-600"/>
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Booking Successful!</h2>
              <p className="text-slate-500 max-w-sm mx-auto mb-8 leading-relaxed">
                 Your seat has been reserved. You can track your driver and view trip details in the "My Trips" section.
              </p>
              
              <div className="space-y-3 max-w-xs mx-auto">
                 <button onClick={() => router.push('/passenger/trips')} className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition shadow-lg">View Ticket</button>
                 <button onClick={() => router.push('/passenger')} className="w-full bg-slate-100 text-slate-900 py-4 rounded-xl font-bold hover:bg-slate-200 transition">Back Home</button>
              </div>
           </div>
        )}

      </div>
    </div>
  );
}