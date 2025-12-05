'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Profile, UserRole, OnboardingStep } from '@/types';
import { useRouter, usePathname } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { AuthService } from '@/lib/services/auth.service';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  role: UserRole | null;
  onboardingStep: OnboardingStep;
  refreshAuth: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>('PROFILE_DETAILS');

  const checkAndRedirect = async (currentUser: User, currentProfile: Profile | null) => {
    if (!currentProfile) return;

    const step = await AuthService.getOnboardingStatus(currentUser.id, currentProfile.role);
    setOnboardingStep(step);

    const isAuthPage = pathname?.startsWith('/auth');
    const isOnboardingPage = pathname?.startsWith('/onboarding');

    // LOGIC FIX: 
    // We treat 'AWAITING_APPROVAL' as "Onboarding Done" for the purpose of navigation.
    // This allows the driver to land on /driver (where the dashboard handles the pending state).
    const isExitAllowed = step === 'COMPLETED' || step === 'AWAITING_APPROVAL';

    if (!isExitAllowed) {
      // If truly incomplete (e.g. missing vehicle/docs), force /onboarding
      if (!isOnboardingPage && !isAuthPage) {
        router.replace('/onboarding');
      }
    } 
    else {
      // If completed OR awaiting approval, send to dashboard if they try to visit onboarding
      if (isOnboardingPage || isAuthPage) {
          const dashboard = currentProfile.role === 'driver' ? '/driver' : '/passenger';
          router.replace(dashboard);
      }
    }
  };

  const refreshAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      const profileData = await AuthService.getProfile(session.user.id);
      setProfile(profileData);
      await checkAndRedirect(session.user, profileData);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await refreshAuth();
      setLoading(false);

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          // Only fetch if profile is stale or missing
          if (!profile || profile.id !== session.user.id) {
             const p = await AuthService.getProfile(session.user.id);
             setProfile(p);
             await checkAndRedirect(session.user, p);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      });

      return () => subscription.unsubscribe();
    };
    init();
  }, [supabase, pathname]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    router.push('/auth');
  };

  return (
    <AuthContext.Provider value={{ 
      user, profile, loading, role: profile?.role || null, onboardingStep, refreshAuth, signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};