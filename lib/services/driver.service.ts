import { createClient } from '@/lib/supabase';
import { Profile, RideWithBookings } from '@/types';

const supabase = createClient();

export const DriverService = {
  
  async getProfile(userId: string): Promise<Profile | null> {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    return data;
  },

  /**
   * Fetches all rides for a driver with nested bookings and passenger profiles.
   */
  async getDriverRides(driverId: string): Promise<RideWithBookings[]> {
    const { data } = await supabase
      .from('rides')
      .select(`
        *,
        bookings (
          *,
          profiles (*)
        )
      `)
      .eq('driver_id', driverId)
      .order('departure_time', { ascending: true }); // Upcoming first

    return (data as unknown as RideWithBookings[]) || [];
  },

  /**
   * Calculates dashboard statistics from raw ride data.
   */
  calculateStats(rides: RideWithBookings[]) {
    const completed = rides.filter(r => r.status === 'completed');
    
    const earnings = completed.reduce((sum, ride) => {
      const rideTotal = ride.bookings
        .filter(b => b.status === 'confirmed' || b.status === 'completed')
        .reduce((sub, b) => sub + (ride.price_per_seat * b.seats_booked), 0);
      return sum + rideTotal;
    }, 0);

    return {
      earnings,
      totalRides: completed.length,
      rating: 4.8 // Placeholder until review system is fully linked
    };
  }
};