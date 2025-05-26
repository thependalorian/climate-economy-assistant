import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { BarChart3, TrendingUp, Users, Briefcase, Calendar, Download, Filter } from 'lucide-react';

interface UserProfile {
  id: string;
  user_type: string;
  organization_name?: string;
}

interface AnalyticsData {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  totalPrograms: number;
  totalParticipants: number;
  monthlyApplications: { month: string; count: number }[];
  topSkills: { skill: string; demand: number }[];
  applicationsByStatus: { status: string; count: number }[];
  programEnrollment: { program: string; enrolled: number; capacity: number }[];
}

export const PartnerAnalyticsPage: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const userProfile = useOutletContext<UserProfile>();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('6months');

  useEffect(() => {
    // Mock data for now - replace with actual API call
    const mockAnalytics: AnalyticsData = {
      totalJobs: 12,
      activeJobs: 8,
      totalApplications: 156,
      totalPrograms: 5,
      totalParticipants: 89,
      monthlyApplications: [
        { month: 'Aug', count: 18 },
        { month: 'Sep', count: 24 },
        { month: 'Oct', count: 31 },
        { month: 'Nov', count: 28 },
        { month: 'Dec', count: 22 },
        { month: 'Jan', count: 33 }
      ],
      topSkills: [
        { skill: 'Solar PV Installation', demand: 45 },
        { skill: 'Wind Energy', demand: 32 },
        { skill: 'Energy Efficiency', demand: 28 },
        { skill: 'Battery Storage', demand: 21 },
        { skill: 'Grid Integration', demand: 18 }
      ],
      applicationsByStatus: [
        { status: 'New', count: 42 },
        { status: 'Reviewing', count: 38 },
        { status: 'Interviewed', count: 24 },
        { status: 'Offered', count: 15 },
        { status: 'Hired', count: 28 },
        { status: 'Rejected', count: 9 }
      ],
      programEnrollment: [
        { program: 'Solar PV Certification', enrolled: 18, capacity: 20 },
        { program: 'Wind Energy Fundamentals', enrolled: 25, capacity: 30 },
        { program: 'Energy Storage Systems', enrolled: 15, capacity: 15 },
        { program: 'Grid Modernization', enrolled: 12, capacity: 25 },
        { program: 'Building Performance', enrolled: 19, capacity: 20 }
      ]
    };

    setTimeout(() => {
      setAnalytics(mockAnalytics);
      setLoading(false);
    }, 1000);
  }, [timeRange]);

  if (loading || !analytics) {
    return (
      <div className="container section">
        <div className="animate-pulse">
          <div className="h-10 w-64 bg-sand-gray-200 rounded-act mb-4"></div>
          <div className="h-6 w-96 bg-sand-gray-200 rounded-act mb-8"></div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="font-display font-medium text-3xl text-midnight-forest tracking-act-tight leading-act-tight">
            Analytics & Reports
          </h1>
          <p className="mt-2 font-body text-midnight-forest-600 tracking-act-tight leading-act-normal">
            Track your organization's performance and insights
          </p>
        </div>
        <div className="flex items-center gap-3 mt-4 sm:mt-0">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-midnight-forest-400" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="input pl-9 pr-8 text-sm"
            >
              <option value="3months">Last 3 months</option>
              <option value="6months">Last 6 months</option>
              <option value="1year">Last year</option>
            </select>
          </div>
          <button className="btn-outline inline-flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-spring-green-100 rounded-act flex items-center justify-center">
              <Briefcase className="h-6 w-6 text-spring-green-700" />
            </div>
            <span className="text-xs font-medium text-spring-green-700 bg-spring-green-100 px-2 py-1 rounded-full">
              +12%
            </span>
          </div>
          <p className="font-body text-sm text-midnight-forest-600 tracking-act-tight">Total Jobs</p>
          <p className="font-display font-medium text-2xl text-midnight-forest tracking-act-tight">
            {analytics.totalJobs}
          </p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-moss-green-100 rounded-act flex items-center justify-center">
              <Users className="h-6 w-6 text-moss-green-700" />
            </div>
            <span className="text-xs font-medium text-moss-green-700 bg-moss-green-100 px-2 py-1 rounded-full">
              +8%
            </span>
          </div>
          <p className="font-body text-sm text-midnight-forest-600 tracking-act-tight">Applications</p>
          <p className="font-display font-medium text-2xl text-midnight-forest tracking-act-tight">
            {analytics.totalApplications}
          </p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-seafoam-blue-200 rounded-act flex items-center justify-center">
              <Calendar className="h-6 w-6 text-midnight-forest" />
            </div>
            <span className="text-xs font-medium text-midnight-forest bg-seafoam-blue-200 px-2 py-1 rounded-full">
              +15%
            </span>
          </div>
          <p className="font-body text-sm text-midnight-forest-600 tracking-act-tight">Programs</p>
          <p className="font-display font-medium text-2xl text-midnight-forest tracking-act-tight">
            {analytics.totalPrograms}
          </p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-sand-gray-300 rounded-act flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-midnight-forest" />
            </div>
            <span className="text-xs font-medium text-spring-green-700 bg-spring-green-100 px-2 py-1 rounded-full">
              +22%
            </span>
          </div>
          <p className="font-body text-sm text-midnight-forest-600 tracking-act-tight">Participants</p>
          <p className="font-display font-medium text-2xl text-midnight-forest tracking-act-tight">
            {analytics.totalParticipants}
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Monthly Applications Chart */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-medium text-lg text-midnight-forest tracking-act-tight">
              Monthly Applications
            </h3>
            <BarChart3 className="h-5 w-5 text-midnight-forest-400" />
          </div>
          <div className="space-y-4">
            {analytics.monthlyApplications.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="font-body text-sm text-midnight-forest-600 w-12">
                  {item.month}
                </span>
                <div className="flex-1 mx-4">
                  <div className="w-full bg-sand-gray-200 rounded-full h-2">
                    <div
                      className="bg-spring-green h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(item.count / Math.max(...analytics.monthlyApplications.map(m => m.count))) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <span className="font-body text-sm font-medium text-midnight-forest w-8 text-right">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Skills in Demand */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-medium text-lg text-midnight-forest tracking-act-tight">
              Top Skills in Demand
            </h3>
            <TrendingUp className="h-5 w-5 text-midnight-forest-400" />
          </div>
          <div className="space-y-4">
            {analytics.topSkills.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="font-body text-sm text-midnight-forest-600 flex-1">
                  {item.skill}
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-20 bg-sand-gray-200 rounded-full h-2">
                    <div
                      className="bg-moss-green h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(item.demand / Math.max(...analytics.topSkills.map(s => s.demand))) * 100}%` }}
                    ></div>
                  </div>
                  <span className="font-body text-sm font-medium text-midnight-forest w-8 text-right">
                    {item.demand}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Applications by Status */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-medium text-lg text-midnight-forest tracking-act-tight">
              Applications by Status
            </h3>
            <Users className="h-5 w-5 text-midnight-forest-400" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {analytics.applicationsByStatus.map((item, index) => (
              <div key={index} className="text-center p-3 bg-sand-gray-100 rounded-act">
                <p className="font-display font-medium text-lg text-midnight-forest">
                  {item.count}
                </p>
                <p className="font-body text-xs text-midnight-forest-600 tracking-act-tight">
                  {item.status}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Program Enrollment */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-medium text-lg text-midnight-forest tracking-act-tight">
              Program Enrollment
            </h3>
            <Calendar className="h-5 w-5 text-midnight-forest-400" />
          </div>
          <div className="space-y-4">
            {analytics.programEnrollment.map((item, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-body text-sm text-midnight-forest-600">
                    {item.program}
                  </span>
                  <span className="font-body text-sm font-medium text-midnight-forest">
                    {item.enrolled}/{item.capacity}
                  </span>
                </div>
                <div className="w-full bg-sand-gray-200 rounded-full h-2">
                  <div
                    className="bg-seafoam-blue-300 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(item.enrolled / item.capacity) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
