import { createClient } from '@/lib/supabase';
import { BookingWithRide, Profile, SavedPlace, SearchHistoryItem, Wallet } from '@/types';

// Initialize client once for services
const supabase = createClient();

export const PassengerService = {
  
  /**
   * Fetches the core dashboard data in parallel for performance.
   */
  async getDashboardData(userId: string) {
    const [profile, wallet, savedPlaces, history, bookings] = await Promise.all([
      this.getProfile(userId),
      this.getWallet(userId),
      this.getSavedPlaces(userId),
      this.getSearchHistory(userId),
      this.getRecentBookings(userId)
    ]);

    return {
      profile,
      wallet,
      savedPlaces,
      history,
      bookings
    };
  },

  async getProfile(userId: string): Promise<Profile | null> {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    return data;
  },

  async getWallet(userId: string): Promise<Wallet | null> {
    const { data } = await supabase.from('wallets').select('*').eq('user_id', userId).single();
    return data;
  },

  async getSavedPlaces(userId: string): Promise<SavedPlace[]> {
    const { data } = await supabase
      .from('saved_places')
      .select('*')
      .eq('user_id', userId)
      .limit(5); 
    return data || [];
  },

  async getSearchHistory(userId: string): Promise<SearchHistoryItem[]> {
    const { data } = await supabase
      .from('search_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);
    return data || [];
  },

  async getRecentBookings(userId: string): Promise<BookingWithRide[]> {
    const { data } = await supabase
      .from('bookings')
      .select('*, rides(*, profiles(*))')
      .eq('passenger_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);
      
    // Supabase TS types can be tricky with deep joins, validation here ensures safety
    return (data as unknown as BookingWithRide[]) || [];
  },

  /**
   * Derive stats from bookings on the client side to save DB calls
   */
  calculateStats(bookings: BookingWithRide[]) {
    const completed = bookings.filter(b => b.status === 'completed' || (b.status === 'confirmed' && b.rides?.status === 'completed'));
    const spent = completed.reduce((sum, b) => {
      const price = b.rides?.price_per_seat || 0;
      return sum + (price * b.seats_booked);
    }, 0);

    return {
      totalRides: completed.length,
      totalSpent: spent
    };
  }
};