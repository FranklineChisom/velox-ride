'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { RideWithDriver, Booking, Wallet } from '@/types';
import { format } from 'date-fns';
import { User, MapPin, Clock, CreditCard, ArrowLeft, Loader2, CheckCircle, ShieldCheck, Wallet as WalletIcon, Banknote } from 'lucide-react';
import { APP_CONFIG, PAYMENT_METHODS } from '@/lib/constants';
import Script from 'next/script';

declare global {
  interface Window {
    PaystackPop: any;
  }
}

export default function BookingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();
  
  const rideId = searchParams.get('ride_id');
  const [ride, setRide] = useState<RideWithDriver | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [seats, setSeats] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>(PAYMENT_METHODS.CARD);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!rideId) {
        router.push('/search');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
         router.push('/auth?role=passenger');
         return;
      }
      setUserEmail(user.email || '');

      const [rideRes, walletRes] = await Promise.all([
        supabase.from('rides').select('*, profiles(full_name, phone_number, is_verified, avatar_url)').eq('id', rideId).single(),
        supabase.from('wallets').select('*').eq('user_id', user.id).single()
      ]);

      if (rideRes.error || !rideRes.data) {
        alert('Ride not found');
        router.push('/search');
      } else {
        setRide(rideRes.data as unknown as RideWithDriver);
      }

      if (walletRes.data) setWallet(walletRes.data);
      setLoading(false);
    };

    fetchData();
  }, [rideId, router, supabase]);

  const totalFare = ride ? ride.price_per_seat * seats : 0;

  const handlePaystackPayment = () => {
    if (typeof window.PaystackPop === 'undefined') {
        alert("Payment system is loading. Please try again in a moment.");
        setProcessing(false);
        return;
    }

    const paystack = new window.PaystackPop();
    paystack.newTransaction({
      key: APP_CONFIG.paystackPublicKey,
      email: userEmail,
      amount: totalFare * 100, // Paystack expects kobo
      currency: 'NGN',
      onSuccess: (transaction: any) => {
        completeBooking('paid', transaction.reference);
      },
      onCancel: () => {
        setProcessing(false);
        alert('Payment cancelled');
      }
    });
  };

  const handleWalletPayment = async () => {
    if (!wallet || Number(wallet.balance) < totalFare) {
      alert('Insufficient wallet balance. Please fund your wallet.');
      setProcessing(false);
      return;
    }
    
    // Debit Wallet
    await supabase.from('wallets').update({ balance: Number(wallet.balance) - totalFare }).eq('user_id', wallet.user_id);
    await supabase.from('transactions').insert({
        wallet_id: wallet.id,
        amount: totalFare,
        type: 'debit',
        description: `Ride Payment: ${ride?.origin} to ${ride?.destination}`,
        status: 'success',
        reference: `WAL-${Date.now()}`
    });

    completeBooking('paid', `WAL-${Date.now()}`);
  };

  const completeBooking = async (status: 'paid' | 'pending', reference?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !ride) return;

    const { error } = await supabase.from('bookings').insert({
      ride_id: ride.id,
      passenger_id: user.id,
      seats_booked: seats,
      status: 'confirmed',
      payment_method: paymentMethod,
      payment_status: status,
      payment_reference: reference
    });

    if (error) {
      alert(error.message);
      setProcessing(false);
    } else {
      setStep(3);
      setProcessing(false);
    }
  };

  const handleProcessPayment = () => {
    setProcessing(true);
    if (paymentMethod === PAYMENT_METHODS.CARD) {
      handlePaystackPayment();
    } else if (paymentMethod === PAYMENT_METHODS.WALLET) {
      handleWalletPayment();
    } else {
      // Cash
      completeBooking('pending');
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin w-8 h-8"/></div>;
  if (!ride) return null;

  return (
    <div className="min-h-screen bg-slate-50 pt-28 pb-10 px-4 font-sans">
      <Script src="https://js.paystack.co/v1/inline.js" strategy="lazyOnload" />
      
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.back()} className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-100 transition">
            <ArrowLeft className="w-5 h-5"/>
          </button>
          <h1 className="text-2xl font-bold text-slate-900">
            {step === 1 ? 'Review Trip' : step === 2 ? 'Payment' : 'Booking Confirmed'}
          </h1>
        </div>

        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            {/* Ride Details */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
               <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                       <h2 className="text-xl font-bold text-slate-900">{ride.profiles?.full_name}</h2>
                       {ride.profiles?.is_verified && <ShieldCheck className="w-5 h-5 text-green-500" />}
                    </div>
                    <p className="text-slate-500 text-sm">Toyota Camry • Silver</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500 mb-1">Per Seat</p>
                    <p className="text-2xl font-bold text-slate-900">{APP_CONFIG.currency}{ride.price_per_seat}</p>
                  </div>
               </div>
               <div className="space-y-6 relative">
                  <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-slate-200"></div>
                  <div className="flex gap-4 relative z-10">
                     <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center shrink-0 shadow-[0_0_0_4px_white]"><div className="w-2 h-2 bg-white rounded-full"></div></div>
                     <div>
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Pickup</p>
                        <p className="font-medium text-slate-900 text-lg">{ride.origin}</p>
                        <p className="text-sm text-slate-500">{format(new Date(ride.departure_time), 'h:mm a')} • {format(new Date(ride.departure_time), 'MMM dd')}</p>
                     </div>
                  </div>
                  <div className="flex gap-4 relative z-10">
                     <div className="w-6 h-6 bg-slate-900 rounded-sm shrink-0 shadow-[0_0_0_4px_white]"></div>
                     <div>
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Dropoff</p>
                        <p className="font-medium text-slate-900 text-lg">{ride.destination}</p>
                     </div>
                  </div>
               </div>
            </div>

            {/* Seat Selection */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex justify-between items-center">
               <div>
                  <h3 className="font-bold text-slate-900">Passengers</h3>
                  <p className="text-sm text-slate-500">{seats} seat{seats > 1 ? 's' : ''} selected</p>
               </div>
               <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-xl">
                  <button onClick={() => setSeats(Math.max(1, seats - 1))} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm font-bold hover:bg-slate-100 disabled:opacity-50" disabled={seats <= 1}>-</button>
                  <span className="font-bold text-lg w-4 text-center">{seats}</span>
                  <button onClick={() => setSeats(Math.min(ride.total_seats, seats + 1))} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm font-bold hover:bg-slate-100 disabled:opacity-50" disabled={seats >= ride.total_seats}>+</button>
               </div>
            </div>

            <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 p-6 md:static md:bg-transparent md:border-0 md:p-0">
               <div className="flex justify-between items-center mb-4 md:hidden">
                  <span className="font-bold text-slate-500">Total</span>
                  <span className="font-bold text-2xl">{APP_CONFIG.currency}{totalFare}</span>
               </div>
               <button onClick={() => setStep(2)} className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition shadow-lg">Proceed to Payment</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
             <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-lg mb-6">Payment Method</h3>
                <div className="space-y-3">
                   {/* Paystack Card Option */}
                   <div 
                     onClick={() => setPaymentMethod(PAYMENT_METHODS.CARD)}
                     className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition ${paymentMethod === PAYMENT_METHODS.CARD ? 'border-black bg-slate-50 ring-1 ring-black' : 'border-slate-200 hover:border-slate-300'}`}
                   >
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center"><CreditCard className="w-5 h-5"/></div>
                         <span className="font-bold">Pay with Card</span>
                      </div>
                      {paymentMethod === PAYMENT_METHODS.CARD && <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center"><div className="w-2 h-2 bg-white rounded-full"></div></div>}
                   </div>

                   {/* Wallet Option */}
                   <div 
                     onClick={() => setPaymentMethod(PAYMENT_METHODS.WALLET)}
                     className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition ${paymentMethod === PAYMENT_METHODS.WALLET ? 'border-black bg-slate-50 ring-1 ring-black' : 'border-slate-200 hover:border-slate-300'}`}
                   >
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center"><WalletIcon className="w-5 h-5"/></div>
                         <div>
                            <span className="font-bold block">My Wallet</span>
                            <span className="text-xs text-slate-500">Balance: {APP_CONFIG.currency}{Number(wallet?.balance || 0).toLocaleString()}</span>
                         </div>
                      </div>
                      {paymentMethod === PAYMENT_METHODS.WALLET && <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center"><div className="w-2 h-2 bg-white rounded-full"></div></div>}
                   </div>

                   {/* Cash Option */}
                   <div 
                     onClick={() => setPaymentMethod(PAYMENT_METHODS.CASH)}
                     className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition ${paymentMethod === PAYMENT_METHODS.CASH ? 'border-black bg-slate-50 ring-1 ring-black' : 'border-slate-200 hover:border-slate-300'}`}
                   >
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center"><Banknote className="w-5 h-5"/></div>
                         <span className="font-bold">Cash</span>
                      </div>
                      {paymentMethod === PAYMENT_METHODS.CASH && <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center"><div className="w-2 h-2 bg-white rounded-full"></div></div>}
                   </div>
                </div>
             </div>

             <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                <div className="flex justify-between mb-2">
                   <span className="text-slate-500">Trip Fare (x{seats})</span>
                   <span className="font-bold">{APP_CONFIG.currency}{totalFare}</span>
                </div>
                <div className="flex justify-between mb-4">
                   <span className="text-slate-500">Service Fee</span>
                   <span className="font-bold">{APP_CONFIG.currency}0.00</span>
                </div>
                <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
                   <span className="font-bold text-lg">Total</span>
                   <span className="font-bold text-2xl">{APP_CONFIG.currency}{totalFare}</span>
                </div>
             </div>

             <button 
               onClick={handleProcessPayment} 
               disabled={processing}
               className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition shadow-lg flex justify-center items-center gap-2"
             >
               {processing ? <Loader2 className="animate-spin"/> : (
                 paymentMethod === PAYMENT_METHODS.CASH ? 'Confirm Booking' : `Pay ${APP_CONFIG.currency}${totalFare}`
               )}
             </button>
          </div>
        )}

        {step === 3 && (
           <div className="text-center py-10 animate-scale-up">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                 <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Booking Confirmed!</h2>
              <p className="text-slate-500 mb-8 max-w-sm mx-auto">
                {paymentMethod === PAYMENT_METHODS.CASH 
                  ? 'Please pay the driver in cash upon arrival.' 
                  : 'Payment successful. Your seat has been reserved.'}
              </p>
              
              <div className="space-y-3">
                 <button onClick={() => router.push('/passenger/trips')} className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition">View Ticket</button>
                 <button onClick={() => router.push('/')} className="w-full bg-slate-100 text-slate-900 py-4 rounded-xl font-bold hover:bg-slate-200 transition">Back Home</button>
              </div>
           </div>
        )}
      </div>
    </div>
  );
}