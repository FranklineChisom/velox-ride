import { useState, useEffect } from 'react';
import { AdminService, AdminStats } from '@/lib/services/admin.service';

export function useAdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({ 
    totalUsers: 0, 
    totalRides: 0, 
    pendingDrivers: 0 
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await AdminService.getSystemStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch admin stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading };
}