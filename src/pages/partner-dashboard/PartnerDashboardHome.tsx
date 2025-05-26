import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { Building2, Users, BarChart3, FileText, BookOpen } from 'lucide-react';

interface PartnerStats {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  totalPrograms: number;
}

interface UserProfile {
  id: string;
  user_type: string;
  organization_name?: string;
}

interface PartnerDashboardHomeProps {
  userProfile?: UserProfile;
}

export const PartnerDashboardHome: React.FC<PartnerDashboardHomeProps> = ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  userProfile: _userProfile
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PartnerStats>({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    totalPrograms: 0
  });

  useEffect(() => {
    const fetchPartnerData = async () => {
      if (!user) return;

      try {
        // Fetch job statistics
        const { data: jobsData, error: jobsError } = await supabase
          .from('job_listings')
          .select('id, status')
          .eq('posted_by', user.id);

        if (jobsError) throw jobsError;

        // Fetch training programs
        const { data: programsData, error: programsError } = await supabase
          .from('training_programs')
          .select('id')
          .eq('posted_by', user.id);

        if (programsError) throw programsError;

        setStats({
          totalJobs: jobsData?.length || 0,
          activeJobs: jobsData?.filter(job => job.status === 'published').length || 0,
          totalApplications: 0, // This would come from a job_applications table
          totalPrograms: programsData?.length || 0
        });
      } catch (error) {
        console.error('Error fetching partner data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPartnerData();
  }, [user]);

  if (loading) {
    return (
      <div className="container section">
        <div className="animate-pulse">
          <div className="h-10 w-64 bg-sand-gray-200 rounded-act mb-4"></div>
          <div className="h-6 w-96 bg-sand-gray-200 rounded-act mb-8"></div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="card p-6">
                <div className="h-12 w-12 bg-sand-gray-200 rounded-act mb-4"></div>
                <div className="h-4 w-20 bg-sand-gray-200 rounded-act mb-2"></div>
                <div className="h-6 w-16 bg-sand-gray-200 rounded-act"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container section">
      {/* Header */}
      <div className="mb-8 act-fade-in">
        <h1 className="font-display font-normal text-3xl md:text-4xl text-midnight-forest tracking-act-tight leading-act-tight">
          Partner Dashboard
        </h1>
        <p className="mt-2 font-body text-lg text-midnight-forest-600 tracking-act-tight leading-act-normal">
          Manage your opportunities and connect with qualified candidates
        </p>
      </div>

      {/* Stats Overview */}
      <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card act-card-hover p-6" style={{ animationDelay: '0ms' }}>
          <div className="flex items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-act bg-spring-green-100">
              <FileText className="h-6 w-6 text-spring-green-700" />
            </div>
            <div className="ml-4">
              <p className="font-body text-sm font-medium text-midnight-forest-600 tracking-act-tight">Total Jobs</p>
              <h3 className="font-display text-2xl font-medium text-midnight-forest tracking-act-tight">{stats.totalJobs}</h3>
            </div>
          </div>
        </div>

        <div className="card act-card-hover p-6" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-act bg-moss-green-100">
              <Building2 className="h-6 w-6 text-moss-green-700" />
            </div>
            <div className="ml-4">
              <p className="font-body text-sm font-medium text-midnight-forest-600 tracking-act-tight">Active Jobs</p>
              <h3 className="font-display text-2xl font-medium text-midnight-forest tracking-act-tight">{stats.activeJobs}</h3>
            </div>
          </div>
        </div>

        <div className="card act-card-hover p-6" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-act bg-seafoam-blue-200">
              <Users className="h-6 w-6 text-midnight-forest" />
            </div>
            <div className="ml-4">
              <p className="font-body text-sm font-medium text-midnight-forest-600 tracking-act-tight">Applications</p>
              <h3 className="font-display text-2xl font-medium text-midnight-forest tracking-act-tight">{stats.totalApplications}</h3>
            </div>
          </div>
        </div>

        <div className="card act-card-hover p-6" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-act bg-sand-gray-300">
              <BookOpen className="h-6 w-6 text-midnight-forest" />
            </div>
            <div className="ml-4">
              <p className="font-body text-sm font-medium text-midnight-forest-600 tracking-act-tight">Programs</p>
              <h3 className="font-display text-2xl font-medium text-midnight-forest tracking-act-tight">{stats.totalPrograms}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="mb-6 font-display font-medium text-xl text-midnight-forest tracking-act-tight leading-act-tight">
          Quick Actions
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <button
            className="btn-primary flex items-center justify-center py-3 px-6"
            onClick={() => alert("This feature is coming soon!")}
          >
            <FileText className="mr-2 h-5 w-5" />
            Post New Job
          </button>
          <button
            className="btn-secondary flex items-center justify-center py-3 px-6"
            onClick={() => alert("This feature is coming soon!")}
          >
            <BookOpen className="mr-2 h-5 w-5" />
            Add Program
          </button>
          <button
            className="btn-outline flex items-center justify-center py-3 px-6"
            onClick={() => alert("This feature is coming soon!")}
          >
            <Users className="mr-2 h-5 w-5" />
            View Candidates
          </button>
          <button
            className="btn-ghost flex items-center justify-center py-3 px-6"
            onClick={() => alert("This feature is coming soon!")}
          >
            <BarChart3 className="mr-2 h-5 w-5" />
            View Analytics
          </button>
        </div>
      </div>
    </div>
  );
};
