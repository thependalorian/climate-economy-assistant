import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, Sun, Home as HomeIcon, Briefcase as BriefcaseBusiness, GraduationCap, FileText, BookOpen, Settings, HelpCircle, MessageSquareText, Bell, User, Menu, X, Users, BarChart3, Search } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import FeedbackButton from '../feedback/FeedbackButton';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // Debug logging for profile
  useEffect(() => {
    console.log('🧑‍💼 DashboardLayout - User profile:', profile);
    console.log('🧑‍💼 DashboardLayout - User type:', profile?.user_type);
    console.log('🧑‍💼 DashboardLayout - Loading:', loading);
  }, [profile, loading]);

  // Show loading state if still loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-spring-green-500"></div>
      </div>
    );
  }

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  // Define different navigation items based on user type
  const jobSeekerNavigation = [
    { name: 'Dashboard', path: '/dashboard', icon: HomeIcon },
    { name: 'Search', path: '/dashboard/search', icon: Search },
    { name: 'Job Matches', path: '/dashboard/jobs', icon: BriefcaseBusiness },
    { name: 'Training', path: '/dashboard/training', icon: GraduationCap },
    { name: 'Resources', path: '/dashboard/resources', icon: BookOpen },
    { name: 'Resume', path: '/dashboard/resume', icon: FileText },
  ];

  const partnerNavigation = [
    { name: 'Dashboard', path: '/partner-dashboard', icon: HomeIcon },
    { name: 'Jobs', path: '/partner-dashboard/jobs', icon: BriefcaseBusiness },
    { name: 'Programs', path: '/partner-dashboard/programs', icon: GraduationCap },
    { name: 'Candidates', path: '/partner-dashboard/candidates', icon: Users },
    { name: 'Analytics', path: '/partner-dashboard/analytics', icon: BarChart3 },
  ];

  // Choose the appropriate navigation based on user type
  const navigation = profile?.user_type === 'partner' ? partnerNavigation : jobSeekerNavigation;

  const isLinkActive = (path: string) => {
    // For the main dashboard paths, only match exactly
    if (path === '/dashboard' || path === '/partner-dashboard') {
      return location.pathname === path;
    }

    // For other paths, check if the pathname includes the path
    return location.pathname.includes(path);
  };

  // Mock notifications - would come from notifications context in real app
  const notifications = [
    {
      id: 1,
      title: 'New job match',
      description: 'A new Solar Installer position matches your profile',
      time: '2 hours ago',
      read: false
    },
    {
      id: 2,
      title: 'Resume feedback',
      description: 'A career coach has provided feedback on your resume',
      time: '1 day ago',
      read: true
    },
    {
      id: 3,
      title: 'Training program',
      description: 'Registration for the Solar PV Installation program closes soon',
      time: '2 days ago',
      read: true
    }
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar for desktop */}
      <aside className="hidden w-64 flex-shrink-0 border-r border-midnight-forest-200 bg-white md:flex md:flex-col">
        <div className="flex h-16 items-center border-b border-midnight-forest-200 px-6">
          <Link to="/" className="flex items-center">
            <Sun className="h-8 w-8 text-spring-green-500" />
            <span className="ml-2 text-xl font-bold text-midnight-forest-900">Climate Ecosystem</span>
          </Link>
        </div>
        <div className="flex flex-1 flex-col overflow-y-auto py-4">
          <nav className="flex-1 space-y-1 px-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`group flex items-center rounded-lg px-4 py-2.5 text-sm font-medium ${
                  isLinkActive(item.path)
                    ? 'bg-spring-green-50 text-spring-green-700'
                    : 'text-midnight-forest-700 hover:bg-midnight-forest-50'
                }`}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 flex-shrink-0 ${
                    isLinkActive(item.path) ? 'text-spring-green-700' : 'text-midnight-forest-500 group-hover:text-midnight-forest-700'
                  }`}
                />
                {item.name}
              </Link>
            ))}
          </nav>
          <div className="mt-4 border-t border-midnight-forest-200 px-4 pt-4">
            <Link
              to={profile?.user_type === 'partner' ? '/partner-dashboard/settings' : '/dashboard/settings'}
              className={`group flex items-center rounded-lg px-4 py-2.5 text-sm font-medium ${
                isLinkActive(profile?.user_type === 'partner' ? '/partner-dashboard/settings' : '/dashboard/settings')
                  ? 'bg-spring-green-50 text-spring-green-700'
                  : 'text-midnight-forest-700 hover:bg-midnight-forest-50'
              }`}
            >
              <Settings
                className={`mr-3 h-5 w-5 flex-shrink-0 ${
                  isLinkActive(profile?.user_type === 'partner' ? '/partner-dashboard/settings' : '/dashboard/settings')
                    ? 'text-spring-green-700'
                    : 'text-midnight-forest-500 group-hover:text-midnight-forest-700'
                }`}
              />
              Settings
            </Link>
            <Link
              to={profile?.user_type === 'partner' ? '/partner-dashboard/help' : '/dashboard/help'}
              className={`group flex items-center rounded-lg px-4 py-2.5 text-sm font-medium ${
                isLinkActive(profile?.user_type === 'partner' ? '/partner-dashboard/help' : '/dashboard/help')
                  ? 'bg-spring-green-50 text-spring-green-700'
                  : 'text-midnight-forest-700 hover:bg-midnight-forest-50'
              }`}
            >
              <HelpCircle
                className={`mr-3 h-5 w-5 flex-shrink-0 ${
                  isLinkActive(profile?.user_type === 'partner' ? '/partner-dashboard/help' : '/dashboard/help')
                    ? 'text-spring-green-700'
                    : 'text-midnight-forest-500 group-hover:text-midnight-forest-700'
                }`}
              />
              Help & Support
            </Link>
            <div className="mt-6">
              <button
                type="button"
                className="inline-flex w-full items-center justify-center rounded-lg bg-spring-green-50 px-4 py-2.5 text-sm font-medium text-spring-green-700 hover:bg-spring-green-100"
              >
                <MessageSquareText className="mr-2 h-5 w-5" />
                Chat with Assistant
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="fixed inset-0 bg-midnight-forest-600 bg-opacity-75" onClick={closeSidebar}></div>
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white">
            <div className="flex items-center justify-between border-b border-midnight-forest-200 px-4 py-5">
              <div className="flex items-center">
                <Sun className="h-6 w-6 text-spring-green-500" />
                <span className="ml-2 text-lg font-bold text-midnight-forest-900">Climate Ecosystem</span>
              </div>
              <button
                type="button"
                className="-mr-2 inline-flex items-center justify-center rounded-md p-2 text-midnight-forest-400 hover:bg-midnight-forest-100 hover:text-midnight-forest-500"
                onClick={closeSidebar}
              >
                <span className="sr-only">Close sidebar</span>
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-4">
              <nav className="space-y-1 px-2">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`group flex items-center rounded-lg px-3 py-2 text-base font-medium ${
                      isLinkActive(item.path)
                        ? 'bg-spring-green-50 text-spring-green-700'
                        : 'text-midnight-forest-700 hover:bg-midnight-forest-50'
                    }`}
                    onClick={closeSidebar}
                  >
                    <item.icon
                      className={`mr-4 h-6 w-6 flex-shrink-0 ${
                        isLinkActive(item.path) ? 'text-spring-green-700' : 'text-midnight-forest-500 group-hover:text-midnight-forest-700'
                      }`}
                    />
                    {item.name}
                  </Link>
                ))}
              </nav>
              <div className="mt-4 border-t border-midnight-forest-200 px-2 pt-4">
                <Link
                  to={profile?.user_type === 'partner' ? '/partner-dashboard/settings' : '/dashboard/settings'}
                  className={`group flex items-center rounded-lg px-3 py-2 text-base font-medium ${
                    isLinkActive(profile?.user_type === 'partner' ? '/partner-dashboard/settings' : '/dashboard/settings')
                      ? 'bg-spring-green-50 text-spring-green-700'
                      : 'text-midnight-forest-700 hover:bg-midnight-forest-50'
                  }`}
                  onClick={closeSidebar}
                >
                  <Settings
                    className={`mr-4 h-6 w-6 flex-shrink-0 ${
                      isLinkActive(profile?.user_type === 'partner' ? '/partner-dashboard/settings' : '/dashboard/settings')
                        ? 'text-spring-green-700'
                        : 'text-midnight-forest-500 group-hover:text-midnight-forest-700'
                    }`}
                  />
                  Settings
                </Link>
                <Link
                  to={profile?.user_type === 'partner' ? '/partner-dashboard/help' : '/dashboard/help'}
                  className={`group flex items-center rounded-lg px-3 py-2 text-base font-medium ${
                    isLinkActive(profile?.user_type === 'partner' ? '/partner-dashboard/help' : '/dashboard/help')
                      ? 'bg-spring-green-50 text-spring-green-700'
                      : 'text-midnight-forest-700 hover:bg-midnight-forest-50'
                  }`}
                  onClick={closeSidebar}
                >
                  <HelpCircle
                    className={`mr-4 h-6 w-6 flex-shrink-0 ${
                      isLinkActive(profile?.user_type === 'partner' ? '/partner-dashboard/help' : '/dashboard/help')
                        ? 'text-spring-green-700'
                        : 'text-midnight-forest-500 group-hover:text-midnight-forest-700'
                    }`}
                  />
                  Help & Support
                </Link>
                <div className="mt-6 px-2">
                  <button
                    type="button"
                    className="inline-flex w-full items-center justify-center rounded-lg bg-spring-green-50 px-4 py-3 text-base font-medium text-spring-green-700 hover:bg-spring-green-100"
                  >
                    <MessageSquareText className="mr-2 h-5 w-5" />
                    Chat with Assistant
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top navigation */}
        <header className="z-10 flex h-16 flex-shrink-0 items-center justify-between border-b border-midnight-forest-200 bg-white px-4 md:px-6">
          <div className="flex items-center md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-midnight-forest-500 hover:bg-midnight-forest-100 hover:text-midnight-forest-600"
              onClick={toggleSidebar}
            >
              <span className="sr-only">Open sidebar</span>
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div className="flex items-center md:hidden">
            <Link to="/" className="flex items-center">
              <Sun className="h-8 w-8 text-spring-green-500" />
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {/* Notifications dropdown */}
            <div className="relative">
              <button
                type="button"
                className="flex rounded-full bg-white p-1 text-midnight-forest-500 hover:bg-midnight-forest-100 hover:text-midnight-forest-600"
                onClick={() => {
                  setIsNotificationsOpen(!isNotificationsOpen);
                  setIsProfileOpen(false);
                }}
              >
                <span className="sr-only">View notifications</span>
                <div className="relative">
                  <Bell className="h-6 w-6" />
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-spring-green-500 text-xs font-medium text-midnight-forest-900">
                    {notifications.filter(n => !n.read).length}
                  </span>
                </div>
              </button>
              {isNotificationsOpen && (
                <div className="absolute right-0 z-10 mt-2 w-80 origin-top-right rounded-lg bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
                  <div className="px-4 py-2 border-b border-midnight-forest-200">
                    <h3 className="text-sm font-medium text-midnight-forest-900">Notifications</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`px-4 py-3 ${
                          notification.read ? 'bg-white' : 'bg-spring-green-50'
                        } hover:bg-midnight-forest-50`}
                      >
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                              notification.read ? 'bg-midnight-forest-100' : 'bg-spring-green-100'
                            }`}>
                              <Bell className={`h-4 w-4 ${
                                notification.read ? 'text-midnight-forest-500' : 'text-spring-green-600'
                              }`} />
                            </div>
                          </div>
                          <div className="ml-3 w-0 flex-1">
                            <p className="text-sm font-medium text-midnight-forest-900">{notification.title}</p>
                            <p className="mt-1 text-sm text-midnight-forest-600">{notification.description}</p>
                            <p className="mt-1 text-xs text-midnight-forest-500">{notification.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <a
                    href="#"
                    className="block bg-midnight-forest-50 px-4 py-2 text-center text-sm font-medium text-spring-green-600 hover:text-spring-green-700"
                  >
                    View all notifications
                  </a>
                </div>
              )}
            </div>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                type="button"
                className="flex items-center rounded-full text-sm focus:outline-none"
                onClick={() => {
                  setIsProfileOpen(!isProfileOpen);
                  setIsNotificationsOpen(false);
                }}
              >
                <span className="sr-only">Open user menu</span>
                <div className="h-8 w-8 rounded-full bg-spring-green-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-spring-green-600" />
                </div>
                <span className="ml-2 hidden text-sm font-medium text-midnight-forest-700 md:block">
                  {profile?.email?.split('@')[0] || user?.email?.split('@')[0] || 'User'}
                </span>
                <ChevronDown className="ml-1 h-4 w-4 text-midnight-forest-500" />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-lg bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
                  <div className="border-b border-midnight-forest-200 px-4 py-2">
                    <p className="text-sm font-medium text-midnight-forest-900">
                      {profile?.email?.split('@')[0] || user?.email?.split('@')[0] || 'User'}
                    </p>
                    <p className="text-xs text-midnight-forest-500">{profile?.email || user?.email || ''}</p>
                    <p className="text-xs text-midnight-forest-400 capitalize">{profile?.user_type || 'User'}</p>
                  </div>
                  <Link
                    to={profile?.user_type === 'partner' ? '/partner-dashboard/profile' : '/dashboard/profile'}
                    className="block px-4 py-2 text-sm text-midnight-forest-700 hover:bg-midnight-forest-50"
                  >
                    Your Profile
                  </Link>
                  <Link
                    to={profile?.user_type === 'partner' ? '/partner-dashboard/settings' : '/dashboard/settings'}
                    className="block px-4 py-2 text-sm text-midnight-forest-700 hover:bg-midnight-forest-50"
                  >
                    Settings
                  </Link>
                  <div className="border-t border-midnight-forest-200">
                    <button
                      onClick={async () => {
                        try {
                          await supabase.auth.signOut();
                          window.location.href = '/login';
                        } catch (error) {
                          console.error('Error signing out:', error);
                        }
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-midnight-forest-700 hover:bg-midnight-forest-50"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-sand-gray-50">
          {children}
        </main>
      </div>

      {/* Floating Feedback Button */}
      <FeedbackButton sourcePage={location.pathname} />
    </div>
  );
};

export default DashboardLayout;