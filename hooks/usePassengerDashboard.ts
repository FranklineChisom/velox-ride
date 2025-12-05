import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { PassengerService } from '@/lib/services/passenger.service';
import { BookingWithRide, Profile, SavedPlace, SearchHistoryItem, Wallet } from '@/types';
import { useToast } from '@/components/ui/ToastProvider';

export function usePassengerDashboard() {
  const supabase = createClient();
  const router = useRouter();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [recentSearches, setRecentSearches] = useState<SearchHistoryItem[]>([]);
  
  // Computed State
  const [activeBooking, setActiveBooking] = useState<BookingWithRide | null>(null);
  const [upcomingBooking, setUpcomingBooking] = useState<BookingWithRide | null>(null);
  const [stats, setStats] = useState({ totalRides: 0, totalSpent: 0 });
  const [greeting, setGreeting] = useState('Welcome');

  const fetchAllData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth?role=passenger');
        return;
      }

      const data = await PassengerService.getDashboardData(user.id);

      setProfile(data.profile);
      setWallet(data.wallet);
      setSavedPlaces(data.savedPlaces);
      setRecentSearches(data.history);

      // Process Bookings
      if (data.bookings) {
        const now = new Date();
        
        // Find Active Ride (Status active OR scheduled but driver arrived)
        const active = data.bookings.find(b => 
          b.status === 'confirmed' && 
          b.rides && 
          (b.rides.status === 'active' || (b.rides.status === 'scheduled' && b.rides.driver_arrived))
        );
        setActiveBooking(active || null);

        // Find Upcoming Ride
        const upcoming = data.bookings.find(b => 
          b.status === 'confirmed' && 
          b.rides && 
          b.rides.status === 'scheduled' && 
          !b.rides.driver_arrived && 
          new Date(b.rides.departure_time) > now
        );
        setUpcomingBooking(upcoming || null);

        // Stats
        const calculatedStats = PassengerService.calculateStats(data.bookings);
        setStats(calculatedStats);
      }

    } catch (error) {
      console.error("Dashboard load error:", error);
      addToast("Failed to load dashboard data", 'error');
    } finally {
      setLoading(false);
    }
  }, [router, supabase, addToast]);

  useEffect(() => {
    // Set Time Greeting
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    fetchAllData();
  }, [fetchAllData]);

  return {
    loading,
    profile,
    wallet,
    savedPlaces,
    recentSearches,
    activeBooking,
    upcomingBooking,
    stats,
    greeting,
    refresh: fetchAllData
  };
}