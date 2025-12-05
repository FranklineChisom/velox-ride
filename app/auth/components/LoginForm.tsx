'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle, Mail, Lock } from 'lucide-react';
import { UserRole } from '@/types';

interface Props {
  onForgot: () => void;
}

export default function LoginForm({ onForgot }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const getDashboard = (role: UserRole) => {
    const next = searchParams.get('next');
    if (next) return decodeURIComponent(next);
    
    switch(role) {
      case 'driver': return '/driver';
      case 'superadmin': return '/admin';
      case 'manager': return '/manager';
      case 'employee': return '/staff';
      default: return '/passenger';
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Force refresh session to ensure role metadata is available
        const role = data.user.user_metadata?.role || 'passenger';
        router.push(getDashboard(role));
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message === 'Invalid login credentials' 
        ? 'Incorrect email or password.' 
        : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm font-medium flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider">Email</label>
        <div className="relative">
          <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
          <input 
            type="email" 
            required 
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-black focus:border-transparent transition font-medium" 
            placeholder="name@example.com" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider">Password</label>
        <div className="relative">
          <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
          <input 
            type="password" 
            required 
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-black focus:border-transparent transition font-medium" 
            placeholder="••••••••" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
          />
        </div>
        <div className="text-right">
          <button type="button" onClick={onForgot} className="text-xs font-bold text-slate-500 hover:text-black">Forgot password?</button>
        </div>
      </div>

      <button 
        type="submit" 
        disabled={loading} 
        className="w-full py-4 bg-black text-white rounded-xl font-bold text-lg hover:bg-slate-800 transition flex items-center justify-center gap-2 shadow-xl shadow-black/10 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Log In'}
      </button>
    </form>
  );
}