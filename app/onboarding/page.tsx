'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Loader2, ShieldCheck, CheckCircle } from 'lucide-react';

// Step Components
import OnboardingProfile from './components/OnboardingProfile';
import OnboardingPhone from './components/OnboardingPhone';
import OnboardingVehicle from './components/OnboardingVehicle';
import OnboardingGuarantor from './components/OnboardingGuarantor';
import OnboardingDocuments from './components/OnboardingDocuments';

export default function OnboardingPage() {
  const { user, profile, onboardingStep, refreshAuth, signOut } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);

  // We intentionally removed the auto-redirect useEffect to persist the "Success" screen

  if (!profile || !user) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin"/></div>;

  const handleStepComplete = async () => {
    setIsChecking(true);
    await refreshAuth(); 
    setIsChecking(false);
  };

  const handleGoToDashboard = () => {
    const dash = profile.role === 'driver' ? '/driver' : '/passenger';
    router.push(dash);
  };

  // --- Render Steps ---

  if (onboardingStep === 'AWAITING_APPROVAL') {
    return (
      <div className="text-center py-10 space-y-6 animate-fade-in">
        <div className="w-24 h-24 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <ShieldCheck className="w-12 h-12" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Compliance Review</h2>
          <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
            Thank you for submitting your documents. Our Trust & Safety team is reviewing your application. This usually takes 24-48 hours.
          </p>
        </div>
        <button onClick={signOut} className="text-slate-400 font-bold hover:text-black transition">Sign Out</button>
      </div>
    );
  }

  if (onboardingStep === 'COMPLETED') {
    return (
      <div className="text-center py-10 space-y-6 animate-scale-up">
        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-50">
          <CheckCircle className="w-12 h-12" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-3">You're all set!</h2>
          <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
            Your profile is verified and ready. Welcome to Veluxeride.
          </p>
        </div>
        <button 
          onClick={handleGoToDashboard} 
          className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition shadow-xl"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Progress Indicator */}
      <div className="flex justify-center gap-2 mb-8">
         {['PROFILE', 'PHONE', 'VEHICLE', 'GUARANTOR', 'DOCS'].map((s, i) => {
            // Hide driver steps for passengers
            if (profile.role === 'passenger' && i > 1) return null;
            
            // Map step string to current state for active check
            let isActive = false;
            if (s === 'PROFILE' && onboardingStep === 'PROFILE_DETAILS') isActive = true;
            if (s === 'PHONE' && onboardingStep === 'PHONE_VERIFICATION') isActive = true;
            if (s === 'VEHICLE' && onboardingStep === 'VEHICLE_DETAILS') isActive = true;
            if (s === 'GUARANTOR' && onboardingStep === 'GUARANTOR_DETAILS') isActive = true;
            if (s === 'DOCS' && onboardingStep === 'DOCUMENTS_UPLOAD') isActive = true;

            return (
               <div key={s} className={`h-1.5 rounded-full transition-all duration-500 ${isActive ? 'w-8 bg-black' : 'w-2 bg-slate-200'}`}></div>
            );
         })}
      </div>

      <div className="bg-white">
         {onboardingStep === 'PROFILE_DETAILS' && (
            <OnboardingProfile user={user} profile={profile} onNext={handleStepComplete} />
         )}

         {onboardingStep === 'PHONE_VERIFICATION' && (
            <OnboardingPhone userId={user.id} onNext={handleStepComplete} />
         )}
         
         {onboardingStep === 'VEHICLE_DETAILS' && profile.role === 'driver' && (
            <OnboardingVehicle userId={user.id} onNext={handleStepComplete} />
         )}

         {onboardingStep === 'GUARANTOR_DETAILS' && profile.role === 'driver' && (
            <OnboardingGuarantor userId={user.id} onNext={handleStepComplete} />
         )}

         {onboardingStep === 'DOCUMENTS_UPLOAD' && profile.role === 'driver' && (
            <OnboardingDocuments userId={user.id} onNext={handleStepComplete} />
         )}
      </div>
      
      {isChecking && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-50">
           <Loader2 className="w-8 h-8 animate-spin text-black"/>
        </div>
      )}
    </div>
  );
}