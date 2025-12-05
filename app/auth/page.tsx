'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { IMAGES } from '@/lib/constants';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import ForgotPasswordForm from './components/ForgotPasswordForm';
import { UserRole } from '@/types';

function AuthContainer() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // URL State Management
  const initialView = (searchParams.get('view') as 'login' | 'signup') || 'login';
  const initialRole = (searchParams.get('role') as UserRole) || 'passenger';
  
  const [view, setView] = useState<'login' | 'signup' | 'forgot'>(initialView);
  const [role, setRole] = useState<UserRole>(initialRole);
  
  // Verify Email Success State
  const isVerified = searchParams.get('verified') === 'true';

  useEffect(() => {
    // Sync URL with local state if changed externally
    const currentView = searchParams.get('view');
    if (currentView === 'signup' || currentView === 'login') {
      setView(currentView);
    }
  }, [searchParams]);

  const switchView = (newView: 'login' | 'signup' | 'forgot') => {
    setView(newView);
    // Update URL without refresh
    const params = new URLSearchParams(searchParams);
    params.set('view', newView);
    router.replace(`/auth?${params.toString()}`);
  };

  return (
    <div className="min-h-screen flex bg-white font-sans">
      
      {/* --- Left Panel: Brand Visuals --- */}
      <div className="hidden lg:flex w-1/2 bg-slate-950 relative overflow-hidden items-center justify-center p-16">
        <div className="absolute inset-0 opacity-40">
           <img 
             src={role === 'driver' ? IMAGES.driverHero : IMAGES.passengerHero} 
             className="w-full h-full object-cover transition-opacity duration-700 ease-in-out" 
             alt="Background" 
           />
           <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
        </div>
        
        <div className="relative z-10 text-white max-w-lg animate-fade-in">
           <div className="mb-6 inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-wider">Trusted by 50k+ Nigerians</span>
           </div>
           <h2 className="text-6xl font-bold mb-6 leading-[1.1] tracking-tight">
             {role === 'driver' ? 'Drive with Purpose.' : 'Travel with Comfort.'}
           </h2>
           <p className="text-xl text-slate-300 leading-relaxed font-light">
             {role === 'driver' 
               ? "Join the network of verified professionals turning their daily commute into a reliable revenue stream." 
               : "Experience the reliability of scheduled ride-sharing designed specifically for the modern commuter."}
           </p>
        </div>
      </div>

      {/* --- Right Panel: Forms --- */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative overflow-y-auto bg-white">
        
        {/* Back Button */}
        <Link 
          href="/" 
          className="absolute top-8 left-8 lg:left-auto lg:right-8 text-slate-500 hover:text-black transition flex items-center gap-2 font-bold text-sm z-20 group"
        >
          <div className="p-2 bg-slate-50 rounded-full group-hover:bg-slate-100 transition"><ArrowLeft className="w-4 h-4" /></div>
          Back to Home
        </Link>

        <div className="w-full max-w-md animate-slide-up">
           
           {/* Header */}
           <div className="mb-10 text-center lg:text-left">
             <div className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center font-bold text-2xl mb-6 shadow-xl mx-auto lg:mx-0">V</div>
             <h1 className="text-3xl font-bold text-slate-900 mb-2">
               {view === 'login' && 'Welcome back'}
               {view === 'signup' && 'Create account'}
               {view === 'forgot' && 'Reset Password'}
             </h1>
             <p className="text-slate-500">
               {view === 'login' && 'Enter your credentials to access your account.'}
               {view === 'signup' && 'Start your journey with Veluxeride today.'}
               {view === 'forgot' && 'We will send you a secure recovery link.'}
             </p>
           </div>

           {/* Role Toggle (Signup Only) */}
           {view === 'signup' && (
             <div className="grid grid-cols-2 gap-3 mb-8 bg-slate-50 p-1 rounded-2xl border border-slate-100">
                {(['passenger', 'driver'] as const).map((r) => (
                  <button 
                    key={r}
                    onClick={() => setRole(r)} 
                    className={`py-3 rounded-xl text-sm font-bold capitalize transition-all duration-200 ${
                      role === r 
                        ? 'bg-white text-black shadow-sm ring-1 ring-black/5' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                     {r}
                  </button>
                ))}
             </div>
           )}

           {/* Email Verification Banner */}
           {isVerified && (
             <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-bold text-green-800 text-sm">Email Verified!</h4>
                  <p className="text-green-700 text-xs mt-1">Your account is active. Please log in.</p>
                </div>
             </div>
           )}

           {/* Forms */}
           <div className="bg-white">
             {view === 'login' && <LoginForm onForgot={() => switchView('forgot')} />}
             {view === 'signup' && <RegisterForm role={role} onSuccess={() => switchView('login')} />}
             {view === 'forgot' && <ForgotPasswordForm onBack={() => switchView('login')} />}
           </div>

           {/* Footer Switcher */}
           <div className="mt-8 text-center">
             {view === 'login' ? (
               <p className="text-slate-500 text-sm">
                 Don't have an account?{' '}
                 <button onClick={() => switchView('signup')} className="text-black font-bold hover:underline">
                   Sign up
                 </button>
               </p>
             ) : (
               <p className="text-slate-500 text-sm">
                 Already have an account?{' '}
                 <button onClick={() => switchView('login')} className="text-black font-bold hover:underline">
                   Log in
                 </button>
               </p>
             )}
           </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-slate-200 rounded-xl"></div>
          <div className="w-32 h-4 bg-slate-200 rounded"></div>
        </div>
      </div>
    }>
      <AuthContainer />
    </Suspense>
  );
}