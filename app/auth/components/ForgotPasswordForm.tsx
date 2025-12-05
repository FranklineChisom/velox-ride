'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Loader2, Mail, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  onBack: () => void;
}

export default function ForgotPasswordForm({ onBack }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  
  const supabase = createClient();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center space-y-6 animate-fade-in">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Recovery Email Sent</h3>
          <p className="text-slate-500 text-sm">Check {email} for instructions to reset your password.</p>
        </div>
        <button onClick={onBack} className="text-black font-bold underline hover:text-slate-600">Back to Login</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleReset} className="space-y-5">
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider">Registered Email</label>
        <div className="relative">
          <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
          <input 
            type="email" required 
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-black transition font-medium" 
            placeholder="name@example.com" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          />
        </div>
      </div>

      <button 
        type="submit" 
        disabled={loading} 
        className="w-full py-4 bg-black text-white rounded-xl font-bold text-lg hover:bg-slate-800 transition flex items-center justify-center gap-2 shadow-xl shadow-black/10 disabled:opacity-70"
      >
        {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Send Recovery Link'}
      </button>
      
      <div className="text-center">
        <button type="button" onClick={onBack} className="text-sm font-bold text-slate-500 hover:text-black transition">Cancel</button>
      </div>
    </form>
  );
}