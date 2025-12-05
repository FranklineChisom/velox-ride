'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Loader2, AlertCircle, CheckCircle2, Mail, Lock, User, Phone } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Link from 'next/link';

interface Props {
  role: 'passenger' | 'driver';
  onSuccess: () => void;
}

export default function RegisterForm({ role, onSuccess }: Props) {
  const [formData, setFormData] = useState({ email: '', password: '', fullName: '', phone: '' });
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) { setError("You must agree to the Terms & Privacy Policy."); return; }
    setLoading(true);
    setError(null);

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: { 
          data: { full_name: formData.fullName, phone_number: formData.phone, role: role },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`
        },
      });

      if (signUpError) throw signUpError;
      setShowSuccessModal(true);
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleRegister} className="space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm font-medium flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" /><span>{error}</span>
          </div>
        )}

        <div className="space-y-4">
           <div className="relative">
             <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
             <input required className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-black transition font-medium" placeholder="Full Name" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
           </div>
           <div className="relative">
             <Phone className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
             <input type="tel" required className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-black transition font-medium" placeholder="Phone Number" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
           </div>
           <div className="relative">
             <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
             <input type="email" required className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-black transition font-medium" placeholder="Email Address" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
           </div>
           <div className="relative">
             <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
             <input type="password" required className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-black transition font-medium" placeholder="Create Password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
           </div>
        </div>

        <div className="flex items-start gap-3 p-1">
           <input type="checkbox" id="terms" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-1 w-4 h-4 accent-black" />
           <label htmlFor="terms" className="text-xs text-slate-500 leading-relaxed">
              I agree to Veluxeride's <Link href="/terms" className="text-black font-bold underline">Terms of Service</Link> and <Link href="/privacy" className="text-black font-bold underline">Privacy Policy</Link>, and I consent to the processing of my data for identity verification.
           </label>
        </div>

        <button type="submit" disabled={loading} className="w-full py-4 bg-black text-white rounded-xl font-bold text-lg hover:bg-slate-800 transition flex items-center justify-center gap-2 shadow-xl disabled:opacity-70">
          {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Create Account'}
        </button>
      </form>

      <Modal isOpen={showSuccessModal} onClose={() => { setShowSuccessModal(false); onSuccess(); }} title="Verify Email">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle2 className="w-10 h-10" /></div>
          <div><h3 className="text-xl font-bold text-slate-900 mb-2">Check your inbox</h3><p className="text-slate-500 leading-relaxed">We've sent a confirmation link to <span className="font-bold text-slate-900">{formData.email}</span>.</p></div>
          <button onClick={() => { setShowSuccessModal(false); onSuccess(); }} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-black transition">Go to Login</button>
        </div>
      </Modal>
    </>
  );
}