'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Profile, UserRole } from '@/types';
import { useRouter, usePathname } from 'next/navigation';
import { User } from '@supabase/supabase-js';

type OnboardingStatus = 'loading' | 'complete' | 'incomplete';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  role: UserRole | null;
  onboardingStatus: OnboardingStatus;
  refreshProfile: () => Promise<void>;
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
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus>('loading');

  // Logic to determine if a user has finished setting up their account
  const checkOnboarding = (profileData: Profile | null) => {
    if (!profileData) return 'incomplete';
    
    // 1. Basic Profile Check
    if (!profileData.full_name || !profileData.phone_number) return 'incomplete';

    // 2. Driver Specific Check
    if (profileData.role === 'driver') {
      // Drivers must have vehicle details to be considered "onboarded" initially
      if (!profileData.vehicle_model || !profileData.vehicle_plate) return 'incomplete';
    }

    return 'complete';
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (!error && data) {
        setProfile(data as Profile);
        return data as Profile;
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
    return null;
  };

  const refreshProfile = async () => {
    if (user) {
      const data = await fetchProfile(user.id);
      setOnboardingStatus(checkOnboarding(data));
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      
      // 1. Get Session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
        const profileData = await fetchProfile(session.user.id);
        const status = checkOnboarding(profileData);
        setOnboardingStatus(status);

        // Smart Redirect: Force onboarding if profile is incomplete
        // We exclude /auth and /onboarding to prevent redirect loops
        if (status === 'incomplete' && !pathname?.startsWith('/onboarding') && !pathname?.startsWith('/auth')) {
           router.replace('/onboarding');
        }
      } else {
        setUser(null);
        setProfile(null);
        setOnboardingStatus('incomplete');
      }
      
      setLoading(false);

      // 2. Listen for changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          // Fetch profile if it's new or different
          if (!profile || profile.id !== session.user.id) {
             const data = await fetchProfile(session.user.id);
             setOnboardingStatus(checkOnboarding(data));
          }
        } else {
          setUser(null);
          setProfile(null);
          setOnboardingStatus('incomplete');
        }
        setLoading(false);
      });

      return () => subscription.unsubscribe();
    };

    initializeAuth();
  }, [supabase, router, pathname]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      role: profile?.role || null,
      onboardingStatus,
      refreshProfile,
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};