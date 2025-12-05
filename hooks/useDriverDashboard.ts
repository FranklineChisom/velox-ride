import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { DriverService } from '@/lib/services/driver.service';
import { Profile, RideWithBookings } from '@/types';
import { useToast } from '@/components/ui/ToastProvider';

export function useDriverDashboard() {
  const supabase = createClient();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeRide, setActiveRide] = useState<RideWithBookings | null>(null);
  const [nextRide, setNextRide] = useState<RideWithBookings | null>(null);
  const [stats, setStats] = useState({ earnings: 0, totalRides: 0, rating: 5.0 });
  const [isVerified, setIsVerified] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Parallel Fetching
      const [profileData, rides] = await Promise.all([
        DriverService.getProfile(user.id),
        DriverService.getDriverRides(user.id)
      ]);

      if (profileData) {
        setProfile(profileData);
        setIsVerified(profileData.is_verified);
      }

      if (rides) {
        // Calculate Stats
        const calculatedStats = DriverService.calculateStats(rides);
        setStats(calculatedStats);

        // Determine Active Ride
        const active = rides.find(r => 
          r.status === 'active' || 
          (r.status === 'scheduled' && r.driver_arrived)
        );

        // Determine Next Upcoming Ride
        const now = new Date();
        const upcoming = rides.find(r => 
          r.status === 'scheduled' && 
          !r.driver_arrived && 
          new Date(r.departure_time) > now
        );

        setActiveRide(active || null);
        setNextRide(upcoming || null);
      }
    } catch (error) {
      console.error(error);
      addToast('Failed to load dashboard', 'error');
    } finally {
      setLoading(false);
    }
  }, [supabase, addToast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    loading,
    profile,
    activeRide,
    nextRide,
    stats,
    isVerified,
    refresh: fetchDashboardData
  };
}