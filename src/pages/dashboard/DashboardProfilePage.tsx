import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Briefcase, GraduationCap, Save } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

interface UserProfile {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  location?: {
    city?: string;
    state?: string;
  };
  skills?: string[];
  interests?: string[];
  user_type?: string;
}

interface DashboardProfilePageProps {
  userProfile?: UserProfile;
}

export const DashboardProfilePage: React.FC<DashboardProfilePageProps> = (props) => {
  const outletContext = useOutletContext<UserProfile>();
  const userProfile = props.userProfile || outletContext;
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    firstName: userProfile?.first_name || '',
    lastName: userProfile?.last_name || '',
    email: userProfile?.email || user?.email || '',
    phone: userProfile?.phone || '',
    location: userProfile?.location?.city
      ? `${userProfile.location.city}, ${userProfile.location.state}`
      : '',
    skills: userProfile?.skills?.join(', ') || '',
    interests: userProfile?.interests?.join(', ') || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileUpdate = async () => {
    if (!user) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Parse skills and interests from comma-separated strings to arrays
      const skills = formData.skills
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill !== '');

      const interests = formData.interests
        .split(',')
        .map(interest => interest.trim())
        .filter(interest => interest !== '');

      // Parse location
      let location = null;
      if (formData.location) {
        const [city, state] = formData.location.split(',').map(part => part.trim());
        location = { city, state };
      }

      // Update user profile
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          skills,
          interests,
          location
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setSuccess('Profile updated successfully');

      // Reset success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);

    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Your Profile</h1>
        <p className="mt-2 text-neutral-600">
          Manage your personal information and preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Personal Information */}
        <div className="card p-6">
          <div className="mb-6 flex items-center">
            <User className="mr-2 h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-neutral-900">Personal Information</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-neutral-700">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="mt-1 input"
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-neutral-700">
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="mt-1 input"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
                Email
              </label>
              <div className="mt-1 flex items-center">
                <Mail className="mr-2 h-5 w-5 text-neutral-500" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className="input bg-neutral-50"
                />
              </div>
              <p className="mt-1 text-xs text-neutral-500">
                Email cannot be changed. Contact support if you need to update your email.
              </p>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-neutral-700">
                Phone Number
              </label>
              <div className="mt-1 flex items-center">
                <Phone className="mr-2 h-5 w-5 text-neutral-500" />
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input"
                  placeholder="(123) 456-7890"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Career Information */}
        <div className="card p-6">
          <div className="mb-6 flex items-center">
            <Briefcase className="mr-2 h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-neutral-900">Career Information</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-neutral-700">
                Location
              </label>
              <div className="mt-1 flex items-center">
                <MapPin className="mr-2 h-5 w-5 text-neutral-500" />
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="input"
                  placeholder="City, State"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="skills" className="block text-sm font-medium text-neutral-700">
                Skills
              </label>
              <div className="mt-1 flex items-center">
                <GraduationCap className="mr-2 h-5 w-5 text-neutral-500" />
                <input
                  type="text"
                  id="skills"
                  name="skills"
                  value={formData.skills}
                  onChange={handleChange}
                  className="input"
                  placeholder="Enter skills separated by commas"
                />
              </div>
              <p className="mt-1 text-xs text-neutral-500">
                Enter skills separated by commas (e.g., Solar Installation, Project Management, Electrical)
              </p>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="interests" className="block text-sm font-medium text-neutral-700">
                Interests
              </label>
              <textarea
                id="interests"
                name="interests"
                value={formData.interests}
                onChange={handleChange}
                rows={3}
                className="mt-1 input"
                placeholder="Enter interests separated by commas"
              />
              <p className="mt-1 text-xs text-neutral-500">
                Enter interests separated by commas (e.g., Renewable Energy, Sustainability, Climate Tech)
              </p>
            </div>
          </div>
        </div>

        {/* Complete Profile Button */}
        <div className="card p-6">
          <div className="mb-6 flex items-center">
            <User className="mr-2 h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-neutral-900">Complete Your Profile</h2>
          </div>

          <div className="space-y-4">
            <p className="text-neutral-600">
              If you haven't completed your onboarding process or need to update your detailed profile information,
              you can access the full onboarding flow using the button below.
            </p>

            <button
              type="button"
              onClick={() => navigate(userProfile.user_type === 'partner' ? '/onboarding/partner' : '/onboarding/job-seeker')}
              className="btn-secondary"
            >
              Complete Full Profile
            </button>
          </div>
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg bg-green-50 p-4 text-sm text-green-600">
            {success}
          </div>
        )}

        {/* Save Changes */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleProfileUpdate}
            disabled={saving}
            className="btn-primary"
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};
