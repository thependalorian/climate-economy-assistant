import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Search, Filter, MoreVertical, Eye, Edit, Trash2, MapPin, Clock, DollarSign } from 'lucide-react';

interface UserProfile {
  id: string;
  user_type: string;
  organization_name?: string;
}

interface JobPosting {
  id: string;
  title: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  salary_range: string;
  posted_date: string;
  applications_count: number;
  status: 'active' | 'paused' | 'closed';
  description: string;
}

export const PartnerJobsPage: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const userProfile = useOutletContext<UserProfile>();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    // Mock data for now - replace with actual API call
    const mockJobs: JobPosting[] = [
      {
        id: '1',
        title: 'Solar Installation Technician',
        location: 'San Francisco, CA',
        type: 'full-time',
        salary_range: '$45,000 - $65,000',
        posted_date: '2024-01-15',
        applications_count: 12,
        status: 'active',
        description: 'Install and maintain solar panel systems for residential and commercial properties.'
      },
      {
        id: '2',
        title: 'Wind Turbine Maintenance Specialist',
        location: 'Austin, TX',
        type: 'full-time',
        salary_range: '$55,000 - $75,000',
        posted_date: '2024-01-10',
        applications_count: 8,
        status: 'active',
        description: 'Perform routine maintenance and repairs on wind turbine systems.'
      },
      {
        id: '3',
        title: 'Energy Efficiency Consultant',
        location: 'Remote',
        type: 'contract',
        salary_range: '$60 - $80/hour',
        posted_date: '2024-01-05',
        applications_count: 15,
        status: 'paused',
        description: 'Conduct energy audits and provide recommendations for improving building efficiency.'
      }
    ];

    setTimeout(() => {
      setJobs(mockJobs);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || job.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-spring-green-100 text-spring-green-700';
      case 'paused': return 'bg-sand-gray-300 text-midnight-forest';
      case 'closed': return 'bg-red-100 text-red-700';
      default: return 'bg-sand-gray-200 text-midnight-forest-600';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'full-time': return 'bg-moss-green-100 text-moss-green-700';
      case 'part-time': return 'bg-seafoam-blue-200 text-midnight-forest';
      case 'contract': return 'bg-spring-green-100 text-spring-green-700';
      case 'internship': return 'bg-sand-gray-300 text-midnight-forest';
      default: return 'bg-sand-gray-200 text-midnight-forest-600';
    }
  };

  if (loading) {
    return (
      <div className="container section">
        <div className="animate-pulse">
          <div className="h-10 w-64 bg-sand-gray-200 rounded-act mb-4"></div>
          <div className="h-6 w-96 bg-sand-gray-200 rounded-act mb-8"></div>
          <div className="grid gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="card p-6">
                <div className="h-6 w-48 bg-sand-gray-200 rounded-act mb-4"></div>
                <div className="h-4 w-32 bg-sand-gray-200 rounded-act mb-2"></div>
                <div className="h-4 w-24 bg-sand-gray-200 rounded-act"></div>
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
            Job Postings
          </h1>
          <p className="mt-2 font-body text-midnight-forest-600 tracking-act-tight leading-act-normal">
            Manage your job postings and track applications
          </p>
        </div>
        <button className="mt-4 sm:mt-0 btn-primary inline-flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          Post New Job
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card p-6 mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-midnight-forest-400" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-midnight-forest-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input pl-10 pr-8"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="space-y-6">
        {filteredJobs.length === 0 ? (
          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-sand-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-midnight-forest-400" />
            </div>
            <h3 className="font-display font-medium text-xl text-midnight-forest mb-2 tracking-act-tight">
              No jobs found
            </h3>
            <p className="font-body text-midnight-forest-600 tracking-act-tight">
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Get started by posting your first job'
              }
            </p>
          </div>
        ) : (
          filteredJobs.map((job) => (
            <div key={job.id} className="card act-card-hover p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="font-display font-medium text-xl text-midnight-forest tracking-act-tight leading-act-tight">
                      {job.title}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(job.type)}`}>
                      {job.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-midnight-forest-600 mb-4">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {job.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {job.salary_range}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Posted {new Date(job.posted_date).toLocaleDateString()}
                    </div>
                  </div>

                  <p className="font-body text-midnight-forest-600 tracking-act-tight leading-act-normal mb-4">
                    {job.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="font-body text-sm text-midnight-forest-600">
                      {job.applications_count} applications
                    </span>
                    <div className="flex items-center gap-2">
                      <button className="btn-outline-sm inline-flex items-center">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </button>
                      <button className="btn-outline-sm inline-flex items-center">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </button>
                      <button className="btn-outline-sm inline-flex items-center text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>

                <div className="ml-4">
                  <button className="p-2 hover:bg-sand-gray-100 rounded-act transition-colors">
                    <MoreVertical className="h-5 w-5 text-midnight-forest-400" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
