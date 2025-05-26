import React from 'react';
import { useSupabaseQuery } from '../../lib/hooks';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  user_type: 'job_seeker' | 'partner' | 'admin';
  created_at: string;
}

interface UserListProps {
  searchQuery: string;
  userType: string;
}

export const UserList: React.FC<UserListProps> = ({ searchQuery, userType }) => {
  const { data: users, loading, error } = useSupabaseQuery<User[]>({
    table: 'user_profiles',
    select: '*, created_at',
    match: userType !== 'all' ? { user_type: userType } : {},
    realtime: true
  });

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse flex items-center justify-between p-4">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-midnight-forest-200"></div>
              <div className="ml-4 space-y-2">
                <div className="h-4 w-40 bg-midnight-forest-200 rounded"></div>
                <div className="h-3 w-32 bg-midnight-forest-200 rounded"></div>
              </div>
            </div>
            <div className="h-8 w-20 bg-midnight-forest-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-moss-green-600">
        Failed to load users. Please try again.
      </div>
    );
  }

  const filteredUsers = users?.filter(user => 
    (user.first_name + ' ' + user.last_name + ' ' + user.email)
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  return (
    <div className="divide-y divide-midnight-forest-200">
      {filteredUsers?.map(user => (
        <div key={user.id} className="flex items-center justify-between p-4">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-midnight-forest-200">
              {/* User avatar would go here */}
            </div>
            <div className="ml-4">
              <p className="font-medium text-midnight-forest-900">
                {user.first_name} {user.last_name}
              </p>
              <p className="text-sm text-midnight-forest-500">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className={`badge ${
              user.user_type === 'job_seeker' ? 'badge-primary' :
              user.user_type === 'partner' ? 'badge-secondary' :
              'badge-accent'
            }`}>
              {user.user_type.replace('_', ' ')}
            </span>
            <button className="btn-outline py-1 px-3 text-sm">
              Manage
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};