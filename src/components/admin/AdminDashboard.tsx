/**
 * Admin Dashboard Component
 * 
 * Comprehensive admin interface for managing:
 * - Job seekers and their profiles
 * - Partner organizations and verification
 * - Admin users and permissions
 * - Security monitoring and alerts
 * - GDPR compliance and data management
 */

import React, { useState, useEffect } from 'react';

interface AdminDashboardProps {
  adminUser: {
    id: string;
    email: string;
    permissions: string[];
  };
}

interface DashboardStats {
  totalUsers: number;
  totalJobSeekers: number;
  totalPartners: number;
  totalAdmins: number;
  pendingVerifications: number;
  highRiskEvents: number;
  newUsersToday: number;
  activeUsersToday: number;
  gdprRequests: number;
}

interface SecurityAlert {
  id: string;
  type: string;
  userId: string;
  userEmail: string;
  description: string;
  riskLevel: 'medium' | 'high' | 'critical';
  createdAt: string;
  resolved: boolean;
}

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: 'job_seeker' | 'partner' | 'admin';
  created_at: string;
  verified?: boolean;
  suspended?: boolean;
}

export default function AdminDashboard({ adminUser }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserType, setSelectedUserType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load dashboard stats and alerts
      const [statsResponse, alertsResponse] = await Promise.all([
        fetch('/api/admin/dashboard', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
          }
        }),
        fetch('/api/admin/users?limit=20', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
          }
        })
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data.stats);
        setAlerts(statsData.data.alerts);
      }

      if (alertsResponse.ok) {
        const usersData = await alertsResponse.json();
        setUsers(usersData.users || []);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId: string, action: string, data: Record<string, unknown> = {}) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        },
        body: JSON.stringify({
          action,
          userId,
          ...data
        })
      });

      if (response.ok) {
        await loadDashboardData(); // Refresh data
      }
    } catch (error) {
      console.error('User action failed:', error);
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-error';
      case 'high': return 'text-warning';
      case 'medium': return 'text-info';
      default: return 'text-base-content';
    }
  };

  const getUserTypeColor = (type: string) => {
    switch (type) {
      case 'job_seeker': return 'badge-primary';
      case 'partner': return 'badge-secondary';
      case 'admin': return 'badge-accent';
      default: return 'badge-ghost';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-base-content/70">
            Welcome back, {adminUser.email}
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            className="btn btn-outline btn-sm"
            onClick={loadDashboardData}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-title">Total Users</div>
            <div className="stat-value text-primary">{stats.totalUsers}</div>
            <div className="stat-desc">All registered users</div>
          </div>
          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-title">Job Seekers</div>
            <div className="stat-value text-secondary">{stats.totalJobSeekers}</div>
            <div className="stat-desc">Active job seekers</div>
          </div>
          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-title">Partners</div>
            <div className="stat-value text-accent">{stats.totalPartners}</div>
            <div className="stat-desc">{stats.pendingVerifications} pending verification</div>
          </div>
          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-title">Security Alerts</div>
            <div className="stat-value text-warning">{stats.highRiskEvents}</div>
            <div className="stat-desc">High risk events (24h)</div>
          </div>
          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-title">GDPR Requests</div>
            <div className="stat-value text-info">{stats.gdprRequests}</div>
            <div className="stat-desc">Pending deletion requests</div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="tabs tabs-boxed">
        <button 
          className={`tab ${activeTab === 'overview' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab ${activeTab === 'users' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          User Management
        </button>
        <button 
          className={`tab ${activeTab === 'partners' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('partners')}
        >
          Partner Management
        </button>
        <button 
          className={`tab ${activeTab === 'security' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          Security & Compliance
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Recent Activity</h2>
              <div className="space-y-3">
                {users.slice(0, 5).map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                    <div>
                      <p className="font-medium">{user.first_name} {user.last_name}</p>
                      <p className="text-sm text-base-content/70">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${getUserTypeColor(user.user_type)}`}>
                        {user.user_type.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-base-content/50">
                        {new Date(user.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Security Alerts */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Security Alerts</h2>
              <div className="space-y-3">
                {alerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className="alert alert-warning">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div>
                      <h3 className="font-bold">{alert.description}</h3>
                      <div className="text-xs">
                        User: {alert.userEmail} | 
                        Risk: <span className={getRiskLevelColor(alert.riskLevel)}>{alert.riskLevel}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* User Filters */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">User Type</span>
                  </label>
                  <select 
                    className="select select-bordered"
                    value={selectedUserType}
                    onChange={(e) => setSelectedUserType(e.target.value)}
                  >
                    <option value="all">All Users</option>
                    <option value="job_seeker">Job Seekers</option>
                    <option value="partner">Partners</option>
                    <option value="admin">Admins</option>
                  </select>
                </div>
                <div className="form-control flex-1">
                  <label className="label">
                    <span className="label-text">Search</span>
                  </label>
                  <input 
                    type="text" 
                    placeholder="Search by name or email..." 
                    className="input input-bordered"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">&nbsp;</span>
                  </label>
                  <button className="btn btn-primary">
                    Search
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">User Management</h2>
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div>
                            <div className="font-bold">{user.first_name} {user.last_name}</div>
                            <div className="text-sm opacity-50">{user.email}</div>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${getUserTypeColor(user.user_type)}`}>
                            {user.user_type.replace('_', ' ')}
                          </span>
                        </td>
                        <td>
                          <div className="flex flex-col gap-1">
                            {user.verified && (
                              <span className="badge badge-success badge-sm">Verified</span>
                            )}
                            {user.suspended && (
                              <span className="badge badge-error badge-sm">Suspended</span>
                            )}
                            {!user.verified && !user.suspended && (
                              <span className="badge badge-warning badge-sm">Pending</span>
                            )}
                          </div>
                        </td>
                        <td>{new Date(user.created_at).toLocaleDateString()}</td>
                        <td>
                          <div className="dropdown dropdown-end">
                            <label tabIndex={0} className="btn btn-ghost btn-sm">
                              Actions
                            </label>
                            <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
                              <li>
                                <button onClick={() => handleUserAction(user.id, 'export_data', { reason: 'Admin review' })}>
                                  Export Data
                                </button>
                              </li>
                              {user.user_type === 'partner' && (
                                <li>
                                  <button onClick={() => handleUserAction(user.id, 'verify_partner', { verified: !user.verified })}>
                                    {user.verified ? 'Unverify' : 'Verify'} Partner
                                  </button>
                                </li>
                              )}
                              <li>
                                <button 
                                  onClick={() => handleUserAction(user.id, 'suspend', { 
                                    suspended: !user.suspended, 
                                    reason: user.suspended ? 'Unsuspended by admin' : 'Suspended by admin' 
                                  })}
                                  className={user.suspended ? 'text-success' : 'text-error'}
                                >
                                  {user.suspended ? 'Unsuspend' : 'Suspend'} User
                                </button>
                              </li>
                            </ul>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'partners' && (
        <div className="space-y-6">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Partner Management</h2>
              <p>Manage partner organizations, verification status, and partnership levels.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="stat bg-base-200 rounded-lg">
                  <div className="stat-title">Total Partners</div>
                  <div className="stat-value">{stats?.totalPartners || 0}</div>
                </div>
                <div className="stat bg-base-200 rounded-lg">
                  <div className="stat-title">Pending Verification</div>
                  <div className="stat-value text-warning">{stats?.pendingVerifications || 0}</div>
                </div>
                <div className="stat bg-base-200 rounded-lg">
                  <div className="stat-title">Active Job Postings</div>
                  <div className="stat-value text-success">0</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Security & Compliance</h2>
              <p>Monitor security events and manage GDPR compliance.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Security Metrics</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>High Risk Events (24h)</span>
                      <span className="badge badge-error">{stats?.highRiskEvents || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Users Today</span>
                      <span className="badge badge-success">{stats?.activeUsersToday || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>New Registrations Today</span>
                      <span className="badge badge-info">{stats?.newUsersToday || 0}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3">GDPR Compliance</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Pending Deletion Requests</span>
                      <span className="badge badge-warning">{stats?.gdprRequests || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Data Export Requests</span>
                      <span className="badge badge-info">0</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 