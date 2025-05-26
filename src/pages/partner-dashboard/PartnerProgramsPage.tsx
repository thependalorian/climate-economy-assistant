import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Search, Filter, Calendar, Users, Clock, BookOpen, Award } from 'lucide-react';

interface UserProfile {
  id: string;
  user_type: string;
  organization_name?: string;
}

interface TrainingProgram {
  id: string;
  title: string;
  description: string;
  duration: string;
  format: 'online' | 'in-person' | 'hybrid';
  level: 'beginner' | 'intermediate' | 'advanced';
  start_date: string;
  end_date: string;
  max_participants: number;
  enrolled_count: number;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  certification: boolean;
}

export const PartnerProgramsPage: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const userProfile = useOutletContext<UserProfile>();
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    // Mock data for now - replace with actual API call
    const mockPrograms: TrainingProgram[] = [
      {
        id: '1',
        title: 'Solar PV Installation Certification',
        description: 'Comprehensive training program covering solar photovoltaic system installation, safety protocols, and industry best practices.',
        duration: '6 weeks',
        format: 'hybrid',
        level: 'intermediate',
        start_date: '2024-02-15',
        end_date: '2024-03-28',
        max_participants: 20,
        enrolled_count: 15,
        status: 'upcoming',
        certification: true
      },
      {
        id: '2',
        title: 'Wind Energy Fundamentals',
        description: 'Introduction to wind energy systems, turbine technology, and maintenance procedures for entry-level technicians.',
        duration: '4 weeks',
        format: 'online',
        level: 'beginner',
        start_date: '2024-01-20',
        end_date: '2024-02-16',
        max_participants: 30,
        enrolled_count: 28,
        status: 'active',
        certification: false
      },
      {
        id: '3',
        title: 'Energy Storage Systems',
        description: 'Advanced training on battery storage systems, grid integration, and energy management for experienced professionals.',
        duration: '8 weeks',
        format: 'in-person',
        level: 'advanced',
        start_date: '2023-11-01',
        end_date: '2023-12-22',
        max_participants: 15,
        enrolled_count: 15,
        status: 'completed',
        certification: true
      }
    ];

    setTimeout(() => {
      setPrograms(mockPrograms);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredPrograms = programs.filter(program => {
    const matchesSearch = program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         program.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || program.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-seafoam-blue-200 text-midnight-forest';
      case 'active': return 'bg-spring-green-100 text-spring-green-700';
      case 'completed': return 'bg-moss-green-100 text-moss-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-sand-gray-200 text-midnight-forest-600';
    }
  };

  const getFormatColor = (format: string) => {
    switch (format) {
      case 'online': return 'bg-spring-green-100 text-spring-green-700';
      case 'in-person': return 'bg-moss-green-100 text-moss-green-700';
      case 'hybrid': return 'bg-seafoam-blue-200 text-midnight-forest';
      default: return 'bg-sand-gray-200 text-midnight-forest-600';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-spring-green-100 text-spring-green-700';
      case 'intermediate': return 'bg-sand-gray-300 text-midnight-forest';
      case 'advanced': return 'bg-moss-green-100 text-moss-green-700';
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
                <div className="h-4 w-full bg-sand-gray-200 rounded-act mb-2"></div>
                <div className="h-4 w-3/4 bg-sand-gray-200 rounded-act"></div>
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
            Training Programs
          </h1>
          <p className="mt-2 font-body text-midnight-forest-600 tracking-act-tight leading-act-normal">
            Manage your training programs and track participant progress
          </p>
        </div>
        <button className="mt-4 sm:mt-0 btn-primary inline-flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          Create Program
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card p-6 mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-midnight-forest-400" />
            <input
              type="text"
              placeholder="Search programs..."
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
                <option value="upcoming">Upcoming</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Programs List */}
      <div className="grid gap-6 lg:grid-cols-2">
        {filteredPrograms.length === 0 ? (
          <div className="col-span-full card p-8 text-center">
            <div className="w-16 h-16 bg-sand-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-midnight-forest-400" />
            </div>
            <h3 className="font-display font-medium text-xl text-midnight-forest mb-2 tracking-act-tight">
              No programs found
            </h3>
            <p className="font-body text-midnight-forest-600 tracking-act-tight">
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first training program'
              }
            </p>
          </div>
        ) : (
          filteredPrograms.map((program) => (
            <div key={program.id} className="card act-card-hover p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-moss-green-100 rounded-act flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-moss-green-700" />
                  </div>
                  <div>
                    <h3 className="font-display font-medium text-lg text-midnight-forest tracking-act-tight leading-act-tight">
                      {program.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(program.status)}`}>
                        {program.status.charAt(0).toUpperCase() + program.status.slice(1)}
                      </span>
                      {program.certification && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-spring-green-100 text-spring-green-700 flex items-center gap-1">
                          <Award className="h-3 w-3" />
                          Certified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <p className="font-body text-midnight-forest-600 tracking-act-tight leading-act-normal mb-4">
                {program.description}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm text-midnight-forest-600">
                  <Clock className="h-4 w-4" />
                  {program.duration}
                </div>
                <div className="flex items-center gap-2 text-sm text-midnight-forest-600">
                  <Users className="h-4 w-4" />
                  {program.enrolled_count}/{program.max_participants} enrolled
                </div>
                <div className="flex items-center gap-2 text-sm text-midnight-forest-600">
                  <Calendar className="h-4 w-4" />
                  {new Date(program.start_date).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getFormatColor(program.format)}`}>
                    {program.format.charAt(0).toUpperCase() + program.format.slice(1)}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(program.level)}`}>
                    {program.level.charAt(0).toUpperCase() + program.level.slice(1)}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-midnight-forest-600 mb-1">
                  <span>Enrollment</span>
                  <span>{Math.round((program.enrolled_count / program.max_participants) * 100)}%</span>
                </div>
                <div className="w-full bg-sand-gray-200 rounded-full h-2">
                  <div
                    className="bg-spring-green h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(program.enrolled_count / program.max_participants) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button className="btn-outline-sm">
                  View Details
                </button>
                <div className="flex items-center gap-2">
                  <button className="btn-outline-sm">
                    Edit
                  </button>
                  <button className="btn-outline-sm">
                    Manage
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
