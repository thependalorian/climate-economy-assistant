import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Save, Upload, Building2, Mail, Globe, Bell, Shield, Trash2 } from 'lucide-react';

interface UserProfile {
  id: string;
  user_type: string;
  first_name?: string;
  last_name?: string;
  organization_name?: string;
}

interface PartnerProfile {
  organization_name: string;
  organization_type: string;
  website: string;
  description: string;
  industry: string[];
  logo_url?: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  services_offered: string[];
  target_audience: string[];
  hiring_timeline: string;
}

interface NotificationSettings {
  email_applications: boolean;
  email_program_updates: boolean;
  email_system_updates: boolean;
  sms_urgent_notifications: boolean;
}

export const PartnerSettingsPage: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const userProfile = useOutletContext<UserProfile>();
  const [profile, setProfile] = useState<PartnerProfile>({
    organization_name: '',
    organization_type: 'employer',
    website: '',
    description: '',
    industry: [],
    contact_email: '',
    contact_phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    services_offered: [],
    target_audience: [],
    hiring_timeline: 'immediate'
  });
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email_applications: true,
    email_program_updates: true,
    email_system_updates: false,
    sms_urgent_notifications: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    // Mock data for now - replace with actual API call
    const mockProfile: PartnerProfile = {
      organization_name: 'Green Energy Solutions',
      organization_type: 'employer',
      website: 'https://greenenergysolutions.com',
      description: 'Leading provider of renewable energy solutions and training programs.',
      industry: ['renewable_energy', 'energy_efficiency'],
      contact_email: 'contact@greenenergysolutions.com',
      contact_phone: '(555) 123-4567',
      address: '123 Solar Street',
      city: 'San Francisco',
      state: 'CA',
      zip_code: '94105',
      services_offered: ['jobs', 'training', 'internships'],
      target_audience: ['entry_level', 'experienced', 'career_changers'],
      hiring_timeline: 'immediate'
    };

    setTimeout(() => {
      setProfile(mockProfile);
      setLoading(false);
    }, 1000);
  }, []);

  const handleProfileSave = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    // Show success message
  };

  const handleNotificationSave = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    // Show success message
  };

  const industryOptions = [
    { value: 'renewable_energy', label: 'Renewable Energy' },
    { value: 'energy_efficiency', label: 'Energy Efficiency' },
    { value: 'clean_transportation', label: 'Clean Transportation' },
    { value: 'grid_modernization', label: 'Grid Modernization' },
    { value: 'building_performance', label: 'High-Performance Buildings' },
    { value: 'energy_storage', label: 'Energy Storage' },
    { value: 'clean_tech', label: 'Clean Technology' }
  ];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const serviceOptions = [
    { value: 'jobs', label: 'Job Opportunities' },
    { value: 'internships', label: 'Internships' },
    { value: 'apprenticeships', label: 'Apprenticeships' },
    { value: 'training', label: 'Training Programs' },
    { value: 'education', label: 'Educational Programs' },
    { value: 'resources', label: 'Resources and Support Services' }
  ];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const audienceOptions = [
    { value: 'entry_level', label: 'Entry-level Workers' },
    { value: 'experienced', label: 'Experienced Professionals' },
    { value: 'career_changers', label: 'Career Changers' },
    { value: 'veterans', label: 'Veterans' },
    { value: 'international', label: 'International Professionals' },
    { value: 'ej_communities', label: 'Environmental Justice Communities' }
  ];

  if (loading) {
    return (
      <div className="container section">
        <div className="animate-pulse">
          <div className="h-10 w-64 bg-sand-gray-200 rounded-act mb-4"></div>
          <div className="h-6 w-96 bg-sand-gray-200 rounded-act mb-8"></div>
          <div className="card p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-12 bg-sand-gray-200 rounded-act"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container section">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display font-medium text-3xl text-midnight-forest tracking-act-tight leading-act-tight">
          Partner Settings
        </h1>
        <p className="mt-2 font-body text-midnight-forest-600 tracking-act-tight leading-act-normal">
          Manage your organization profile and preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-8 bg-sand-gray-100 p-1 rounded-act">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 py-2 px-4 rounded-act text-sm font-medium transition-colors ${
            activeTab === 'profile'
              ? 'bg-white text-midnight-forest shadow-sm'
              : 'text-midnight-forest-600 hover:text-midnight-forest'
          }`}
        >
          <Building2 className="h-4 w-4 inline mr-2" />
          Organization Profile
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex-1 py-2 px-4 rounded-act text-sm font-medium transition-colors ${
            activeTab === 'notifications'
              ? 'bg-white text-midnight-forest shadow-sm'
              : 'text-midnight-forest-600 hover:text-midnight-forest'
          }`}
        >
          <Bell className="h-4 w-4 inline mr-2" />
          Notifications
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex-1 py-2 px-4 rounded-act text-sm font-medium transition-colors ${
            activeTab === 'security'
              ? 'bg-white text-midnight-forest shadow-sm'
              : 'text-midnight-forest-600 hover:text-midnight-forest'
          }`}
        >
          <Shield className="h-4 w-4 inline mr-2" />
          Security
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="card p-6">
          <form onSubmit={(e) => { e.preventDefault(); handleProfileSave(); }} className="space-y-6">
            {/* Organization Logo */}
            <div>
              <label className="block font-body text-sm font-medium text-midnight-forest tracking-act-tight mb-2">
                Organization Logo
              </label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-sand-gray-200 rounded-act flex items-center justify-center">
                  {profile.logo_url ? (
                    <img src={profile.logo_url} alt="Logo" className="w-full h-full object-contain rounded-act" />
                  ) : (
                    <Building2 className="h-8 w-8 text-midnight-forest-400" />
                  )}
                </div>
                <button type="button" className="btn-outline inline-flex items-center">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Logo
                </button>
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-body text-sm font-medium text-midnight-forest tracking-act-tight mb-2">
                  Organization Name
                </label>
                <input
                  type="text"
                  value={profile.organization_name}
                  onChange={(e) => setProfile({ ...profile, organization_name: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block font-body text-sm font-medium text-midnight-forest tracking-act-tight mb-2">
                  Organization Type
                </label>
                <select
                  value={profile.organization_type}
                  onChange={(e) => setProfile({ ...profile, organization_type: e.target.value })}
                  className="input"
                >
                  <option value="employer">Employer</option>
                  <option value="training_provider">Training Provider</option>
                  <option value="educational_institution">Educational Institution</option>
                  <option value="government_agency">Government Agency</option>
                  <option value="nonprofit">Nonprofit Organization</option>
                  <option value="industry_association">Industry Association</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-body text-sm font-medium text-midnight-forest tracking-act-tight mb-2">
                  Website
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-midnight-forest-400" />
                  <input
                    type="url"
                    value={profile.website}
                    onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                    className="input pl-10"
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>
              <div>
                <label className="block font-body text-sm font-medium text-midnight-forest tracking-act-tight mb-2">
                  Contact Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-midnight-forest-400" />
                  <input
                    type="email"
                    value={profile.contact_email}
                    onChange={(e) => setProfile({ ...profile, contact_email: e.target.value })}
                    className="input pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block font-body text-sm font-medium text-midnight-forest tracking-act-tight mb-2">
                Description
              </label>
              <textarea
                value={profile.description}
                onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                rows={4}
                className="input"
                placeholder="Describe your organization and mission..."
              />
            </div>

            {/* Industry Sectors */}
            <div>
              <label className="block font-body text-sm font-medium text-midnight-forest tracking-act-tight mb-2">
                Industry Sectors
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {industryOptions.map((option) => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={profile.industry.includes(option.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setProfile({ ...profile, industry: [...profile.industry, option.value] });
                        } else {
                          setProfile({ ...profile, industry: profile.industry.filter(i => i !== option.value) });
                        }
                      }}
                      className="h-4 w-4 rounded border-sand-gray-300 text-spring-green focus:ring-spring-green/20"
                    />
                    <span className="ml-2 font-body text-sm text-midnight-forest tracking-act-tight">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary inline-flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="card p-6">
          <form onSubmit={(e) => { e.preventDefault(); handleNotificationSave(); }} className="space-y-6">
            <div>
              <h3 className="font-display font-medium text-lg text-midnight-forest tracking-act-tight mb-4">
                Email Notifications
              </h3>
              <div className="space-y-4">
                <label className="flex items-center justify-between">
                  <div>
                    <span className="font-body text-sm font-medium text-midnight-forest tracking-act-tight">
                      New Applications
                    </span>
                    <p className="font-body text-xs text-midnight-forest-600 tracking-act-tight">
                      Get notified when candidates apply to your job postings
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.email_applications}
                    onChange={(e) => setNotifications({ ...notifications, email_applications: e.target.checked })}
                    className="h-4 w-4 rounded border-sand-gray-300 text-spring-green focus:ring-spring-green/20"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <div>
                    <span className="font-body text-sm font-medium text-midnight-forest tracking-act-tight">
                      Program Updates
                    </span>
                    <p className="font-body text-xs text-midnight-forest-600 tracking-act-tight">
                      Updates about your training programs and enrollments
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.email_program_updates}
                    onChange={(e) => setNotifications({ ...notifications, email_program_updates: e.target.checked })}
                    className="h-4 w-4 rounded border-sand-gray-300 text-spring-green focus:ring-spring-green/20"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <div>
                    <span className="font-body text-sm font-medium text-midnight-forest tracking-act-tight">
                      System Updates
                    </span>
                    <p className="font-body text-xs text-midnight-forest-600 tracking-act-tight">
                      Platform updates and maintenance notifications
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.email_system_updates}
                    onChange={(e) => setNotifications({ ...notifications, email_system_updates: e.target.checked })}
                    className="h-4 w-4 rounded border-sand-gray-300 text-spring-green focus:ring-spring-green/20"
                  />
                </label>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary inline-flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="card p-6">
          <div className="space-y-6">
            <div>
              <h3 className="font-display font-medium text-lg text-midnight-forest tracking-act-tight mb-4">
                Account Security
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-sand-gray-100 rounded-act">
                  <div>
                    <span className="font-body text-sm font-medium text-midnight-forest tracking-act-tight">
                      Change Password
                    </span>
                    <p className="font-body text-xs text-midnight-forest-600 tracking-act-tight">
                      Update your account password
                    </p>
                  </div>
                  <button className="btn-outline-sm">
                    Change
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-sand-gray-100 rounded-act">
                  <div>
                    <span className="font-body text-sm font-medium text-midnight-forest tracking-act-tight">
                      Two-Factor Authentication
                    </span>
                    <p className="font-body text-xs text-midnight-forest-600 tracking-act-tight">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <button className="btn-outline-sm">
                    Enable
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-sand-gray-200 pt-6">
              <h3 className="font-display font-medium text-lg text-red-600 tracking-act-tight mb-4">
                Danger Zone
              </h3>
              <div className="p-4 bg-red-50 border border-red-200 rounded-act">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-body text-sm font-medium text-red-800 tracking-act-tight">
                      Delete Account
                    </span>
                    <p className="font-body text-xs text-red-600 tracking-act-tight">
                      Permanently delete your partner account and all associated data
                    </p>
                  </div>
                  <button className="btn-outline-sm text-red-600 border-red-300 hover:bg-red-50 inline-flex items-center">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
