import { createClient } from '@/lib/supabase';
import { DriverApplication, AdminStats } from '@/types';

const supabase = createClient();

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
  },

  async getPendingDrivers() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'driver')
      .eq('is_verified', false)
      .order('created_at', { ascending: false });
    return data || [];
  },

  /**
   * Fetches the complete application for a specific driver.
   */
  async getDriverApplication(driverId: string): Promise<DriverApplication | null> {
    const [profile, vehicle, guarantor, documents] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', driverId).single(),
      supabase.from('vehicles').select('*').eq('driver_id', driverId).single(),
      supabase.from('guarantors').select('*').eq('driver_id', driverId).single(),
      supabase.from('compliance_records').select('*').eq('user_id', driverId)
    ]);

    if (!profile.data) return null;

    return {
      profile: profile.data,
      vehicle: vehicle.data,
      guarantor: guarantor.data,
      documents: documents.data || []
    };
  },

  /**
   * Approves a driver fully.
   */
  async approveDriver(driverId: string, reviewerId: string) {
    // 1. Mark all docs as verified
    await supabase.from('compliance_records')
      .update({ status: 'verified', reviewed_by: reviewerId, updated_at: new Date().toISOString() })
      .eq('user_id', driverId);

    // 2. Mark profile as verified
    return await supabase.from('profiles')
      .update({ is_verified: true })
      .eq('id', driverId);
  },

  /**
   * Rejects a specific document.
   */
  async rejectDocument(docId: string, reason: string, reviewerId: string) {
    return await supabase.from('compliance_records')
      .update({ 
        status: 'rejected', 
        rejection_reason: reason, 
        reviewed_by: reviewerId, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', docId);
  }
};