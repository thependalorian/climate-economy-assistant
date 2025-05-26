import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Search, Filter, Download, Mail, Phone, MapPin, Calendar, Star, Eye, MessageSquare } from 'lucide-react';

interface UserProfile {
  id: string;
  user_type: string;
  organization_name?: string;
}

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  position_applied: string;
  application_date: string;
  status: 'new' | 'reviewing' | 'interviewed' | 'offered' | 'hired' | 'rejected';
  rating: number;
  experience_years: number;
  skills: string[];
  resume_url?: string;
  notes?: string;
}

export const PartnerCandidatesPage: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const userProfile = useOutletContext<UserProfile>();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    // Mock data for now - replace with actual API call
    const mockCandidates: Candidate[] = [
      {
        id: '1',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@email.com',
        phone: '(555) 123-4567',
        location: 'San Francisco, CA',
        position_applied: 'Solar Installation Technician',
        application_date: '2024-01-20',
        status: 'new',
        rating: 0,
        experience_years: 3,
        skills: ['Solar PV', 'Electrical Work', 'Safety Protocols'],
        resume_url: '/resumes/sarah-johnson.pdf'
      },
      {
        id: '2',
        name: 'Michael Chen',
        email: 'michael.chen@email.com',
        phone: '(555) 234-5678',
        location: 'Austin, TX',
        position_applied: 'Wind Turbine Maintenance Specialist',
        application_date: '2024-01-18',
        status: 'reviewing',
        rating: 4,
        experience_years: 5,
        skills: ['Wind Energy', 'Mechanical Repair', 'Hydraulics'],
        resume_url: '/resumes/michael-chen.pdf',
        notes: 'Strong technical background, good communication skills'
      },
      {
        id: '3',
        name: 'Emily Rodriguez',
        email: 'emily.rodriguez@email.com',
        phone: '(555) 345-6789',
        location: 'Denver, CO',
        position_applied: 'Energy Efficiency Consultant',
        application_date: '2024-01-15',
        status: 'interviewed',
        rating: 5,
        experience_years: 7,
        skills: ['Energy Auditing', 'HVAC Systems', 'Building Performance'],
        resume_url: '/resumes/emily-rodriguez.pdf',
        notes: 'Excellent candidate, very knowledgeable about energy systems'
      },
      {
        id: '4',
        name: 'David Kim',
        email: 'david.kim@email.com',
        phone: '(555) 456-7890',
        location: 'Seattle, WA',
        position_applied: 'Solar Installation Technician',
        application_date: '2024-01-12',
        status: 'offered',
        rating: 4,
        experience_years: 2,
        skills: ['Solar Installation', 'Roofing', 'Customer Service'],
        resume_url: '/resumes/david-kim.pdf',
        notes: 'Good fit for the team, waiting for response to offer'
      }
    ];

    setTimeout(() => {
      setCandidates(mockCandidates);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.position_applied.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || candidate.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-seafoam-blue-200 text-midnight-forest';
      case 'reviewing': return 'bg-sand-gray-300 text-midnight-forest';
      case 'interviewed': return 'bg-spring-green-100 text-spring-green-700';
      case 'offered': return 'bg-moss-green-100 text-moss-green-700';
      case 'hired': return 'bg-spring-green-100 text-spring-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-sand-gray-200 text-midnight-forest-600';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'text-spring-green fill-current' : 'text-sand-gray-300'}`}
      />
    ));
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
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-sand-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-5 w-48 bg-sand-gray-200 rounded-act mb-2"></div>
                    <div className="h-4 w-32 bg-sand-gray-200 rounded-act"></div>
                  </div>
                </div>
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
            Candidates
          </h1>
          <p className="mt-2 font-body text-midnight-forest-600 tracking-act-tight leading-act-normal">
            Review and manage job applications from candidates
          </p>
        </div>
        <div className="flex items-center gap-3 mt-4 sm:mt-0">
          <button className="btn-outline inline-flex items-center">
            <Download className="h-5 w-5 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card p-6 mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-midnight-forest-400" />
            <input
              type="text"
              placeholder="Search candidates..."
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
                <option value="new">New</option>
                <option value="reviewing">Reviewing</option>
                <option value="interviewed">Interviewed</option>
                <option value="offered">Offered</option>
                <option value="hired">Hired</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Candidates List */}
      <div className="space-y-6">
        {filteredCandidates.length === 0 ? (
          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-sand-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-midnight-forest-400" />
            </div>
            <h3 className="font-display font-medium text-xl text-midnight-forest mb-2 tracking-act-tight">
              No candidates found
            </h3>
            <p className="font-body text-midnight-forest-600 tracking-act-tight">
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No applications have been received yet'
              }
            </p>
          </div>
        ) : (
          filteredCandidates.map((candidate) => (
            <div key={candidate.id} className="card act-card-hover p-6">
              <div className="flex items-start gap-6">
                {/* Avatar */}
                <div className="w-16 h-16 bg-spring-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="font-display font-medium text-lg text-spring-green-700">
                    {candidate.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>

                {/* Main Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-display font-medium text-xl text-midnight-forest tracking-act-tight leading-act-tight">
                        {candidate.name}
                      </h3>
                      <p className="font-body text-midnight-forest-600 tracking-act-tight">
                        Applied for: {candidate.position_applied}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(candidate.status)}`}>
                        {candidate.status.charAt(0).toUpperCase() + candidate.status.slice(1)}
                      </span>
                      {candidate.rating > 0 && (
                        <div className="flex items-center gap-1">
                          {renderStars(candidate.rating)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-midnight-forest-600">
                      <Mail className="h-4 w-4" />
                      {candidate.email}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-midnight-forest-600">
                      <Phone className="h-4 w-4" />
                      {candidate.phone}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-midnight-forest-600">
                      <MapPin className="h-4 w-4" />
                      {candidate.location}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-midnight-forest-600">
                      <Calendar className="h-4 w-4" />
                      {new Date(candidate.application_date).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="font-body text-sm text-midnight-forest-600 mb-2">
                      <span className="font-medium">{candidate.experience_years} years experience</span> • Skills:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {candidate.skills.map((skill, index) => (
                        <span key={index} className="px-2 py-1 bg-spring-green-100 text-spring-green-700 rounded-full text-xs font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {candidate.notes && (
                    <div className="mb-4 p-3 bg-sand-gray-100 rounded-act">
                      <p className="font-body text-sm text-midnight-forest-600 tracking-act-tight">
                        <span className="font-medium">Notes:</span> {candidate.notes}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {candidate.resume_url && (
                        <button className="btn-outline-sm inline-flex items-center">
                          <Eye className="h-4 w-4 mr-1" />
                          View Resume
                        </button>
                      )}
                      <button className="btn-outline-sm inline-flex items-center">
                        <Mail className="h-4 w-4 mr-1" />
                        Email
                      </button>
                      <button className="btn-outline-sm inline-flex items-center">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Notes
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <select className="input-sm">
                        <option value={candidate.status}>Change Status</option>
                        <option value="reviewing">Reviewing</option>
                        <option value="interviewed">Interviewed</option>
                        <option value="offered">Offered</option>
                        <option value="hired">Hired</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
