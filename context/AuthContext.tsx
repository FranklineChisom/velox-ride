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

  // Core Logic: Where should this user be?
  const checkAndRedirect = async (currentUser: User, currentProfile: Profile | null) => {
    // 1. If no profile, they need to sign up again or something is wrong
    if (!currentProfile) return;

    // 2. Calculate onboarding status
    const step = await AuthService.getOnboardingStatus(currentUser.id, currentProfile.role);
    setOnboardingStep(step);

    const isAuthPage = pathname?.startsWith('/auth');
    const isOnboardingPage = pathname?.startsWith('/onboarding');

    // 3. Routing Logic
    // Status: COMPLETED or AWAITING_APPROVAL -> Go to Dashboard
    // Status: Anything else -> Go to Onboarding

    const isBoardingComplete = step === 'COMPLETED' || step === 'AWAITING_APPROVAL';

    if (isBoardingComplete) {
        // If they are trying to access auth or onboarding pages while done, redirect to dashboard
        if (isAuthPage || isOnboardingPage) {
            const dashboard = currentProfile.role === 'driver' ? '/driver' : '/passenger';
            router.replace(dashboard);
        }
    } else {
        // If they are NOT done, but trying to access other pages, force onboarding
        // We allow /auth (so they can logout) but block everything else
        if (!isOnboardingPage && !isAuthPage) {
            router.replace('/onboarding');
        }
    }
  };

  const refreshAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        // Fetch fresh profile data
        const profileData = await AuthService.getProfile(session.user.id);
        setProfile(profileData);
        await checkAndRedirect(session.user, profileData);
      } else {
         // No session found
         setUser(null);
         setProfile(null);
      }
    } catch (error) {
      console.error("Auth Refresh Error:", error);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await refreshAuth();
      setLoading(false);

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT') {
            setUser(null);
            setProfile(null);
            router.replace('/auth'); // Force redirect on signout event
        } else if (session?.user) {
            setUser(session.user);
            // Re-fetch profile only if missing or user changed
            if (!profile || profile.id !== session.user.id) {
                 const p = await AuthService.getProfile(session.user.id);
                 setProfile(p);
                 await checkAndRedirect(session.user, p);
            }
        }
        setLoading(false);
      });

      return () => subscription.unsubscribe();
    };
    init();
  }, [supabase, pathname]);

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    // State is cleared by the onAuthStateChange 'SIGNED_OUT' event, but we do it here too for responsiveness
    setUser(null);
    setProfile(null);
    router.replace('/auth');
    setLoading(false);
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