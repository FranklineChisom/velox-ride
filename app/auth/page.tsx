'use client';
import { useState, Suspense } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ArrowLeft, Mail, Lock, User, Briefcase, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { IMAGES } from '@/lib/constants';
import { UserRole } from '@/types';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  const defaultRole = searchParams.get('role') === 'driver' ? 'driver' : 'passenger';
  const next = searchParams.get('next');

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [role, setRole] = useState<UserRole>(defaultRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  const getDestination = (userRole: string) => {
    if (next) return decodeURIComponent(next);
    switch(userRole) {
      case 'driver': return '/driver';
      case 'passenger': return '/passenger';
      case 'superadmin': return '/admin';
      case 'manager': return '/manager';
      case 'employee': return '/staff';
      default: return '/passenger';
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { 
            data: { 
              full_name: fullName, 
              phone_number: phone,
              role: role 
            } 
          },
        });
        if (signUpError) throw signUpError;
        
        // Updated success message with email confirmation instruction
        setSuccessMsg('Account created successfully! Please check your email to confirm your account before logging in.');
        setMode('signin'); 
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        
        if (data.user) {
          const userRole = data.user.user_metadata?.role || 'passenger';
          router.push(getDestination(userRole));
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans">
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 opacity-40">
           <img src={role === 'driver' && mode === 'signup' ? IMAGES.authDriver : IMAGES.authPassenger} className="w-full h-full object-cover transition-opacity duration-700" alt="Background" />
        </div>
        <div className="relative z-10 text-white max-w-lg">
           <h2 className="text-5xl font-bold mb-6 leading-tight">
             {mode === 'signup' && role === 'driver' ? 'Drive with Velox.' : 'Move with Velox.'}
           </h2>
           <p className="text-xl text-slate-300 leading-relaxed">
             {mode === 'signup' && role === 'driver' 
               ? "Turn your daily commute into income. Sign up in 2 minutes and start earning." 
               : "Experience the most reliable, scheduled ride-sharing service in Nigeria."}
           </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative overflow-y-auto">
        <Link href="/" className="absolute top-8 right-8 text-slate-500 hover:text-black transition flex items-center gap-2 font-bold text-sm z-20">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="w-full max-w-md space-y-8">
           <div>
             <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center font-bold text-xl mb-6">V</div>
             <h1 className="text-3xl font-bold text-slate-900 mb-2">{mode === 'signup' ? 'Create an account' : 'Welcome back'}</h1>
             <p className="text-slate-500">{mode === 'signup' ? 'Enter your details to get started.' : 'Please enter your details to sign in.'}</p>
           </div>

           <div className="p-1 bg-slate-100 rounded-xl grid grid-cols-2 mb-6">
              <button onClick={() => { setMode('signin'); setError(null); setSuccessMsg(null); }} className={`py-2.5 text-sm font-bold rounded-lg transition-all ${mode === 'signin' ? 'bg-white text-black shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Log In</button>
              <button onClick={() => { setMode('signup'); setError(null); setSuccessMsg(null); }} className={`py-2.5 text-sm font-bold rounded-lg transition-all ${mode === 'signup' ? 'bg-white text-black shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Sign Up</button>
           </div>

           {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium flex items-start gap-3"><AlertCircle className="w-5 h-5 shrink-0 mt-0.5" /><span>{error}</span></div>}
           
           {/* Success Message Block */}
           {successMsg && (
             <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm font-medium flex items-start gap-3 animate-fade-in">
               <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
               <div className="space-y-2">
                 <p>{successMsg}</p>
                 <button 
                   onClick={() => setSuccessMsg(null)} 
                   className="text-green-800 font-bold underline hover:text-green-950 text-xs"
                 >
                   Okay, I&apos;ve confirmed it. Log in now.
                 </button>
               </div>
             </div>
           )}

           {/* Form - Hidden only if success message is showing to prevent confusion */}
           {!successMsg && (
             <form onSubmit={handleAuth} className="space-y-5">
                 {mode === 'signup' && (
                   <div className="grid grid-cols-2 gap-4">
                      <div onClick={() => setRole('passenger')} className={`cursor-pointer border p-4 rounded-xl flex flex-col items-center gap-2 transition ${role === 'passenger' ? 'border-black bg-slate-50 ring-1 ring-black' : 'border-slate-200 hover:border-slate-300'}`}>
                         <User className={`w-6 h-6 ${role === 'passenger' ? 'text-black' : 'text-slate-400'}`} />
                         <span className={`text-sm font-bold ${role === 'passenger' ? 'text-black' : 'text-slate-500'}`}>Passenger</span>
                      </div>
                      <div onClick={() => setRole('driver')} className={`cursor-pointer border p-4 rounded-xl flex flex-col items-center gap-2 transition ${role === 'driver' ? 'border-black bg-slate-50 ring-1 ring-black' : 'border-slate-200 hover:border-slate-300'}`}>
                         <Briefcase className={`w-6 h-6 ${role === 'driver' ? 'text-black' : 'text-slate-400'}`} />
                         <span className={`text-sm font-bold ${role === 'driver' ? 'text-black' : 'text-slate-500'}`}>Driver</span>
                      </div>
                   </div>
                 )}

                 {mode === 'signup' && (
                   <>
                     <div className="space-y-1.5">
                       <label className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider">Full Name</label>
                       <input type="text" required className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-black" placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                     </div>
                     <div className="space-y-1.5">
                       <label className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider">Phone</label>
                       <input type="tel" required className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-black" placeholder="+234..." value={phone} onChange={(e) => setPhone(e.target.value)} />
                     </div>
                   </>
                 )}
                 
                 <div className="space-y-1.5">
                   <label className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider">Email</label>
                   <input type="email" required className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-black" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                 </div>

                 <div className="space-y-1.5">
                   <label className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider">Password</label>
                   <input type="password" required className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-black" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                 </div>

                 <button type="submit" disabled={loading} className="w-full py-4 bg-black text-white rounded-xl font-bold text-lg hover:bg-slate-800 transition flex items-center justify-center gap-2 shadow-xl mt-6 disabled:opacity-70">
                   {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (mode === 'signup' ? 'Create account' : 'Sign in')}
                 </button>
             </form>
           )}
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-white"><Loader2 className="animate-spin text-black w-8 h-8"/></div>}><AuthContent /></Suspense>;
}