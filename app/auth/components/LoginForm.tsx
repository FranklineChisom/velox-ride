'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { UserRole } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface Props {
  onForgot: () => void;
}

export default function LoginForm({ onForgot }: Props) {
  const [formData, setFormData] = useState({ email: '', password: '' });
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      if (data.session) {
        const role = (data.user.user_metadata?.role as UserRole) || 'passenger';
        const destination = getDashboard(role);
        
        // Use window.location for a hard redirect to ensure context reloads completely
        // This avoids Next.js router cache issues with Auth state
        window.location.href = destination; 
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message === 'Invalid login credentials' 
        ? 'Incorrect email or password. Please try again.' 
        : 'Something went wrong. Please check your connection.');
      setLoading(false); // Only stop loading on error
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm font-medium flex items-start gap-3 animate-fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-4">
        <Input 
          name="email"
          type="email"
          label="Email Address"
          placeholder="name@example.com"
          icon={<Mail className="w-5 h-5" />}
          value={formData.email}
          onChange={handleChange}
          required
        />

        <div className="space-y-1.5">
          <Input 
            name="password"
            type="password"
            label="Password"
            placeholder="••••••••"
            icon={<Lock className="w-5 h-5" />}
            value={formData.password}
            onChange={handleChange}
            required
          />
          <div className="text-right">
            <button 
              type="button" 
              onClick={onForgot} 
              className="text-xs font-bold text-slate-500 hover:text-black transition"
            >
              Forgot password?
            </button>
          </div>
        </div>
      </div>

      <Button 
        type="submit" 
        isLoading={loading} 
        size="lg" 
        className="w-full"
      >
        Sign In
      </Button>
    </form>
  );
}