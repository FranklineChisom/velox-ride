'use client';
import { useState, Suspense } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ArrowLeft, Mail, Lock, User, Briefcase } from 'lucide-react';
import Link from 'next/link';

function AuthContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  const role = searchParams.get('role') === 'driver' ? 'driver' : 'passenger';
  const next = searchParams.get('next');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName, role } },
        });
        if (error) throw error;
        alert('Check your email for confirmation!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        if (next) {
          router.push(decodeURIComponent(next));
        } else {
          router.push(role === 'driver' ? '/driver' : '/passenger');
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans">
      
      {/* Left Panel - Visual */}
      <div className="hidden lg:flex w-1/2 bg-black relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 opacity-40">
           <img 
             src={role === 'driver' 
               ? "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=2000"
               : "https://images.unsplash.com/photo-1556122071-e404eaedb77f?auto=format&fit=crop&q=80&w=2000"
             }
             className="w-full h-full object-cover"
             alt="Background"
           />
        </div>
        <div className="relative z-10 text-white max-w-lg">
           <h2 className="text-5xl font-bold mb-6">{role === 'driver' ? 'Drive. Earn. Live.' : 'Move with safety and class.'}</h2>
           <p className="text-xl text-slate-300">
             {role === 'driver' 
               ? "Join thousands of drivers earning on their own terms." 
               : "Experience the most reliable ride-hailing service in the city."}
           </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        <Link href="/" className="absolute top-8 right-8 text-slate-500 hover:text-black transition flex items-center gap-2 font-bold text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="w-full max-w-md">
           <div className="mb-10">
             <div className="inline-block p-3 bg-slate-50 rounded-2xl mb-6">
                {role === 'driver' ? <Briefcase className="w-8 h-8 text-black" /> : <User className="w-8 h-8 text-black" />}
             </div>
             <h1 className="text-4xl font-bold text-slate-900 mb-2">
               {isSignUp ? 'Create Account' : 'Welcome Back'}
             </h1>
             <p className="text-slate-500 text-lg">
               {isSignUp ? `Sign up to become a ${role}` : `Log in to your ${role} dashboard`}
             </p>
           </div>

           {error && (
             <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium border border-red-100 flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
               {error}
             </div>
           )}

           <form onSubmit={handleAuth} className="space-y-5">
             {isSignUp && (
               <div className="space-y-2">
                 <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
                 <div className="relative">
                   <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                   <input
                     type="text"
                     required
                     className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition font-medium"
                     placeholder="John Doe"
                     value={fullName}
                     onChange={(e) => setFullName(e.target.value)}
                   />
                 </div>
               </div>
             )}
             
             <div className="space-y-2">
               <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
               <div className="relative">
                 <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                 <input
                   type="email"
                   required
                   className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition font-medium"
                   placeholder="name@example.com"
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                 />
               </div>
             </div>

             <div className="space-y-2">
               <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
               <div className="relative">
                 <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                 <input
                   type="password"
                   required
                   className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition font-medium"
                   placeholder="••••••••"
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                 />
               </div>
             </div>

             <button
               type="submit"
               disabled={loading}
               className="w-full py-4 bg-black text-white rounded-xl font-bold text-lg hover:bg-slate-800 transition flex justify-center shadow-xl shadow-slate-200 mt-4"
             >
               {loading ? <Loader2 className="animate-spin" /> : (isSignUp ? 'Create Account' : 'Log In')}
             </button>
           </form>

           <div className="mt-10 text-center">
             <p className="text-slate-500">
               {isSignUp ? 'Already have an account? ' : 'New to VeloxRide? '}
               <button
                 onClick={() => setIsSignUp(!isSignUp)}
                 className="text-black font-bold hover:underline underline-offset-4"
               >
                 {isSignUp ? 'Log in' : 'Sign up'}
               </button>
             </p>
           </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-white"><Loader2 className="animate-spin text-black w-8 h-8"/></div>}>
      <AuthContent />
    </Suspense>
  )
}