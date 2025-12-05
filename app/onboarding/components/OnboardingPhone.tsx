'use client';
import { useState } from 'react';
import { AuthService } from '@/lib/services/auth.service';
import { useToast } from '@/components/ui/ToastProvider';
import { Loader2, ArrowRight, Smartphone, Lock } from 'lucide-react';

export default function OnboardingPhone({ userId, onNext }: { userId: string, onNext: () => void }) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleVerify = async () => {
    // Simulate OTP check (Any 4 digits work for MVP)
    if (otp.length !== 4) {
        addToast('Please enter a 4-digit code', 'error');
        return;
    }
    setLoading(true);
    // In a real implementation, verifyPhone would check the OTP against a provider
    const { error } = await AuthService.verifyPhone(userId);
    setLoading(false);
    
    if (error) {
        addToast('Verification failed. Please try again.', 'error');
        console.error(error);
    } else {
        addToast('Phone verified!', 'success');
        onNext();
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    // Bypass verification: directly update profile to phone_verified = true
    const { error } = await AuthService.verifyPhone(userId);
    
    setLoading(false);
    if (!error) {
        addToast('Phone verification skipped (Dev Mode)', 'info');
        onNext();
    } else {
        addToast('Skip failed. Please try again.', 'error');
        console.error(error);
    }
  };

  return (
    <div className="space-y-6 text-center pt-10"> {/* Increased padding to clear fixed navbar */}
       <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 relative">
          <Smartphone className="w-8 h-8 text-slate-600"/>
          <div className="absolute -top-1 -right-1 bg-black p-1 rounded-full text-white"><Lock className="w-3 h-3"/></div>
       </div>
       <div>
          <h2 className="text-2xl font-bold text-slate-900">Verify your number</h2>
          <p className="text-slate-500 text-sm mt-2">We sent a 4-digit code to your phone.</p>
       </div>

       <div className="flex justify-center gap-3">
          <input 
            value={otp} 
            onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
            className="text-center text-3xl font-bold tracking-[1em] w-full max-w-[200px] border-b-2 border-slate-200 focus:border-black outline-none py-2 transition"
            placeholder="0000"
          />
       </div>

       <div className="flex flex-col gap-3 mt-4">
          <button onClick={handleVerify} disabled={loading} className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : <>Verify <ArrowRight className="w-5 h-5"/></>}
          </button>
          
          <button onClick={handleSkip} disabled={loading} className="text-sm font-bold text-slate-400 hover:text-black py-2 disabled:opacity-50">
              {loading ? 'Processing...' : 'Skip for now'}
          </button>
       </div>
    </div>
  );
}