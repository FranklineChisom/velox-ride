'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { IMAGES } from '@/lib/constants';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import ForgotPasswordForm from './components/ForgotPasswordForm';

function AuthContainer() {
  const searchParams = useSearchParams();
  const defaultView = searchParams.get('view') === 'signup' ? 'signup' : 'login';
  const roleParam = searchParams.get('role');
  
  const [view, setView] = useState<'login' | 'signup' | 'forgot'>(defaultView);
  const [role, setRole] = useState<'passenger' | 'driver'>(
    roleParam === 'driver' ? 'driver' : 'passenger'
  );

  return (
    <div className="min-h-screen flex bg-white font-sans">
      {/* Left: Branding & Visuals */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 opacity-40">
           <img 
             src={role === 'driver' ? IMAGES.driverHero : IMAGES.passengerHero} 
             className="w-full h-full object-cover transition-opacity duration-700" 
             alt="Background" 
           />
        </div>
        <div className="relative z-10 text-white max-w-lg">
           <h2 className="text-5xl font-bold mb-6 leading-tight">
             {role === 'driver' ? 'Drive with Purpose.' : 'Travel with Comfort.'}
           </h2>
           <p className="text-xl text-slate-300 leading-relaxed font-light">
             {role === 'driver' 
               ? "Join the network of verified professionals turning their daily commute into a revenue stream." 
               : "Experience the reliability of scheduled ride-sharing designed for the modern commuter."}
           </p>
        </div>
      </div>

      {/* Right: Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative overflow-y-auto">
        <Link 
          href="/" 
          className="absolute top-8 right-8 text-slate-500 hover:text-black transition flex items-center gap-2 font-bold text-sm z-20"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="w-full max-w-md">
           <div className="mb-8">
             <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center font-bold text-2xl mb-6 shadow-lg">V</div>
             <h1 className="text-3xl font-bold text-slate-900 mb-2">
               {view === 'login' && 'Welcome back'}
               {view === 'signup' && 'Create account'}
               {view === 'forgot' && 'Reset Password'}
             </h1>
             <p className="text-slate-500">
               {view === 'login' && 'Please enter your details to sign in.'}
               {view === 'signup' && 'Start your journey with Veluxeride today.'}
               {view === 'forgot' && 'We will send you a recovery link.'}
             </p>
           </div>

           {/* Role Switcher (Only visible on Signup) */}
           {view === 'signup' && (
             <div className="grid grid-cols-2 gap-4 mb-8">
                <button 
                  onClick={() => setRole('passenger')} 
                  className={`p-4 rounded-xl border text-left transition-all duration-200 ${role === 'passenger' ? 'border-black bg-slate-50 ring-1 ring-black' : 'border-slate-200 hover:border-slate-300'}`}
                >
                   <span className={`block text-sm font-bold ${role === 'passenger' ? 'text-black' : 'text-slate-500'}`}>Passenger</span>
                </button>
                <button 
                  onClick={() => setRole('driver')} 
                  className={`p-4 rounded-xl border text-left transition-all duration-200 ${role === 'driver' ? 'border-black bg-slate-50 ring-1 ring-black' : 'border-slate-200 hover:border-slate-300'}`}
                >
                   <span className={`block text-sm font-bold ${role === 'driver' ? 'text-black' : 'text-slate-500'}`}>Driver</span>
                </button>
             </div>
           )}

           {/* Form Render */}
           <div className="animate-fade-in">
             {view === 'login' && <LoginForm onForgot={() => setView('forgot')} />}
             {view === 'signup' && <RegisterForm role={role} onSuccess={() => setView('login')} />}
             {view === 'forgot' && <ForgotPasswordForm onBack={() => setView('login')} />}
           </div>

           {/* View Switcher Footer */}
           <div className="mt-8 text-center text-sm font-medium text-slate-500">
             {view === 'login' ? (
               <>Don't have an account? <button onClick={() => setView('signup')} className="text-black font-bold hover:underline">Sign up</button></>
             ) : (
               <>Already have an account? <button onClick={() => setView('login')} className="text-black font-bold hover:underline">Log in</button></>
             )}
           </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AuthContainer />
    </Suspense>
  );
}