import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

interface UserProfile {
  id: string;
  user_type: string;
  first_name?: string;
  last_name?: string;
  profile_completed?: boolean;
}
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { Users, FileText, Bell, Settings, Shield, Building2, CheckCircle2 } from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  totalPartners: number;
  totalJobs: number;
  totalPrograms: number;
  pendingVerifications: number;
  activeUsers: number;
}

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalPartners: 0,
    totalJobs: 0,
    totalPrograms: 0,
    pendingVerifications: 0,
    activeUsers: 0
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserType, setSelectedUserType] = useState<string>('all');

  useEffect(() => {
    const fetchAdminData = async () => {
      if (!user) return;

      try {
        // Fetch admin profile
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;
        if (profileData.user_type !== 'admin') {
          throw new Error('Unauthorized access');
        }
        setUserProfile(profileData);

        // Fetch platform statistics
        const { data: usersData, error: usersError } = await supabase
          .from('user_profiles')
          .select('user_type');

        if (usersError) throw usersError;

        const { data: jobsData, error: jobsError } = await supabase
          .from('job_listings')
          .select('status');

        if (jobsError) throw jobsError;

        const { data: programsData, error: programsError } = await supabase
          .from('training_programs')
          .select('status');

        if (programsError) throw programsError;

        setStats({
          totalUsers: usersData.length,
          totalPartners: usersData.filter(u => u.user_type === 'partner').length,
          totalJobs: jobsData.length,
          totalPrograms: programsData.length,
          pendingVerifications: 3, // Mock data - would come from a partner_verifications table
          activeUsers: usersData.length // Mock data - would be based on recent activity
        });
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [user]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6 px-4 md:px-6">
          <div className="animate-pulse">
            <div className="h-8 w-64 bg-neutral-200 rounded mb-4"></div>
            <div className="h-4 w-96 bg-neutral-200 rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 px-4 md:px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-neutral-900 md:text-3xl">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-neutral-600">
            Monitor platform activity and manage users
          </p>
        </div>

        {/* Platform Overview */}
        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100">
                <Users className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Total Users</p>
                <h3 className="text-xl font-semibold text-neutral-900">{stats.totalUsers}</h3>
                <p className="text-xs text-neutral-500">{stats.activeUsers} active this month</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary-100">
                <Building2 className="h-6 w-6 text-secondary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Partners</p>
                <h3 className="text-xl font-semibold text-neutral-900">{stats.totalPartners}</h3>
                <p className="text-xs text-neutral-500">{stats.pendingVerifications} pending verification</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success-100">
                <FileText className="h-6 w-6 text-success-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Content</p>
                <h3 className="text-xl font-semibold text-neutral-900">{stats.totalJobs} Jobs</h3>
                <p className="text-xs text-neutral-500">{stats.totalPrograms} Training Programs</p>
              </div>
            </div>
          </div>
        </div>

        {/* User Management */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-900">User Management</h2>
            <button className="btn-primary">
              Add User
            </button>
          </div>

          <div className="card">
            <div className="border-b border-neutral-200 p-4">
              <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                <div className="flex flex-1 items-center space-x-4">
                  <input
                    type="text"
                    placeholder="Search users..."
                    className="input flex-1 py-2"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <select
                    className="select py-2"
                    value={selectedUserType}
                    onChange={(e) => setSelectedUserType(e.target.value)}
                  >
                    <option value="all">All Users</option>
                    <option value="job_seeker">Job Seekers</option>
                    <option value="partner">Partners</option>
                    <option value="admin">Admins</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="divide-y divide-neutral-200">
              {/* Sample user rows - would be mapped from actual user data */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-neutral-200"></div>
                  <div className="ml-4">
                    <p className="font-medium text-neutral-900">Maria Rodriguez</p>
                    <p className="text-sm text-neutral-500">maria@example.com</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="badge-primary">Job Seeker</span>
                  <button className="btn-outline py-1 px-3 text-sm">
                    Manage
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-neutral-200"></div>
                  <div className="ml-4">
                    <p className="font-medium text-neutral-900">Acme Solar</p>
                    <p className="text-sm text-neutral-500">contact@acmesolar.com</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="badge-secondary">Partner</span>
                  <button className="btn-outline py-1 px-3 text-sm">
                    Manage
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Moderation */}
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-neutral-900">Content Moderation</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card divide-y divide-neutral-200">
              <div className="p-4">
                <h3 className="font-medium text-neutral-900">Pending Job Approvals</h3>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-neutral-900">Solar Installation Lead</p>
                    <p className="text-sm text-neutral-500">Posted by Acme Solar • 2 hours ago</p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="btn-primary py-1 px-3 text-sm">
                      Approve
                    </button>
                    <button className="btn-outline py-1 px-3 text-sm">
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="card divide-y divide-neutral-200">
              <div className="p-4">
                <h3 className="font-medium text-neutral-900">Partner Verifications</h3>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-neutral-900">GreenTech Solutions</p>
                    <p className="text-sm text-neutral-500">Applied 1 day ago</p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="btn-primary py-1 px-3 text-sm">
                      Verify
                    </button>
                    <button className="btn-outline py-1 px-3 text-sm">
                      Review
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Settings */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card p-6">
            <h3 className="mb-4 text-lg font-semibold text-neutral-900">System Configuration</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-neutral-900">AI Parameters</p>
                  <p className="text-sm text-neutral-600">Configure matching algorithm settings</p>
                </div>
                <button className="btn-outline py-2">
                  <Settings className="mr-2 h-4 w-4" />
                  Configure
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-neutral-900">Security Settings</p>
                  <p className="text-sm text-neutral-600">Manage platform security controls</p>
                </div>
                <button className="btn-outline py-2">
                  <Shield className="mr-2 h-4 w-4" />
                  Manage
                </button>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="mb-4 text-lg font-semibold text-neutral-900">Notifications</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-warning-100">
                  <Bell className="h-4 w-4 text-warning-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-neutral-900">High user reports on job posting</p>
                  <p className="text-xs text-neutral-500">5 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success-100">
                  <CheckCircle2 className="h-4 w-4 text-success-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-neutral-900">System backup completed</p>
                  <p className="text-xs text-neutral-500">1 hour ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};