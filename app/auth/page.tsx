'use client';
import { useState, Suspense } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ArrowLeft } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center bg-velox-midnight px-4 relative overflow-hidden">
      {/* Back Button */}
      <Link href="/" className="absolute top-8 left-8 text-gray-400 hover:text-velox-gold transition flex items-center gap-2 font-bold text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      {/* Decorative Blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-velox-gold/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-900/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3"></div>

      <div className="max-w-md w-full bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl relative z-10">
        <div className="text-center mb-8">
           <div className="w-12 h-12 bg-velox-gold text-velox-midnight rounded-xl flex items-center justify-center font-bold text-2xl mx-auto mb-4 shadow-lg shadow-velox-gold/20">V</div>
           <h2 className="text-2xl font-black text-white mb-2">
             {isSignUp ? 'Join VeloxRide' : 'Welcome Back'}
           </h2>
           <p className="text-gray-400">
             {isSignUp ? `Create your ${role} account` : `Login to your ${role} account`}
           </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl mb-6 text-sm font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5">
          {isSignUp && (
            <div>
              <label className="block text-xs font-bold text-velox-gold uppercase tracking-wider mb-2">Full Name</label>
              <input
                type="text"
                required
                className="w-full p-4 bg-velox-navy border border-white/10 rounded-xl focus:ring-2 focus:ring-velox-gold outline-none text-white placeholder-gray-600 transition"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          )}
          
          <div>
            <label className="block text-xs font-bold text-velox-gold uppercase tracking-wider mb-2">Email Address</label>
            <input
              type="email"
              required
              className="w-full p-4 bg-velox-navy border border-white/10 rounded-xl focus:ring-2 focus:ring-velox-gold outline-none text-white placeholder-gray-600 transition"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-velox-gold uppercase tracking-wider mb-2">Password</label>
            <input
              type="password"
              required
              className="w-full p-4 bg-velox-navy border border-white/10 rounded-xl focus:ring-2 focus:ring-velox-gold outline-none text-white placeholder-gray-600 transition"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-velox-gold text-velox-midnight rounded-xl font-bold hover:bg-yellow-400 transition flex justify-center shadow-lg shadow-velox-gold/10"
          >
            {loading ? <Loader2 className="animate-spin" /> : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <div className="mt-8 text-center pt-6 border-t border-white/5">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-gray-400 hover:text-white font-medium transition"
          >
            {isSignUp ? 'Already have an account? ' : 'New to VeloxRide? '}
            <span className="text-velox-gold hover:underline">{isSignUp ? 'Sign In' : 'Sign Up'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-velox-midnight"><Loader2 className="animate-spin text-velox-gold"/></div>}>
      <AuthContent />
    </Suspense>
  )
}