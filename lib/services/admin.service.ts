import { createClient } from '@/lib/supabase';

const supabase = createClient();

export interface AdminStats {
  totalUsers: number;
  totalRides: number;
  pendingDrivers: number;
}

export const AdminService = {
  
  async getSystemStats(): Promise<AdminStats> {
    const [users, rides, pending] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('rides').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true })
        .eq('role', 'driver')
        .eq('is_verified', false)
    ]);

    return {
      totalUsers: users.count || 0,
      totalRides: rides.count || 0,
      pendingDrivers: pending.count || 0
    };
  }
};