import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

interface AdminStats {
  totalUsers: number;
  totalPartners: number;
  totalJobs: number;
  totalPrograms: number;
  pendingVerifications: number;
  activeUsers: number;
}

export function useAdminData() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalPartners: 0,
    totalJobs: 0,
    totalPrograms: 0,
    pendingVerifications: 0,
    activeUsers: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch user statistics
        const { data: users, error: usersError } = await supabase
          .from('user_profiles')
          .select('user_type');
        
        if (usersError) throw usersError;

        // Fetch job listings
        const { data: jobs, error: jobsError } = await supabase
          .from('job_listings')
          .select('status');
        
        if (jobsError) throw jobsError;

        // Fetch training programs
        const { data: programs, error: programsError } = await supabase
          .from('training_programs')
          .select('status');
        
        if (programsError) throw programsError;

        // Calculate statistics
        setStats({
          totalUsers: users.length,
          totalPartners: users.filter(u => u.user_type === 'partner').length,
          totalJobs: jobs.length,
          totalPrograms: programs.length,
          pendingVerifications: users.filter(u => u.user_type === 'partner' && !u.verified).length,
          activeUsers: users.filter(u => u.last_login_at > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length
        });
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch admin data'));
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading, error };
}