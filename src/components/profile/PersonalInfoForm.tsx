import React, { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { updateUserProfile } from '../../services/profileService';
import {
  UnifiedUserProfile,
  PersonalInfoFormData,
  LocationData,
  isValidLocation
} from '../../types/unified';

interface PersonalInfoFormProps {
  profile: UnifiedUserProfile | null;
  userId: string;
}

const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({ profile, userId }) => {
  const [formData, setFormData] = useState<PersonalInfoFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    location: {
      city: '',
      state: 'Massachusetts',
      zip: ''
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Initialize form with profile data
  useEffect(() => {
    if (profile) {
      // Handle location data properly - it might be stored as JSON in Supabase
      let locationData: LocationData = {
        city: '',
        state: 'Massachusetts',
        zip: ''
      };

      if (profile.location) {
        if (isValidLocation(profile.location)) {
          locationData = profile.location;
        } else if (typeof profile.location === 'object' && profile.location !== null) {
          // Handle case where location is stored as JSON with different structure
          const loc = profile.location as Record<string, unknown>;
          locationData = {
            city: (loc.city as string) || '',
            state: (loc.state as string) || 'Massachusetts',
            zip: (loc.zip as string) || ''
          };
        }
      }

      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        location: locationData
      });
    }
  }, [profile, userId]);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      if (parent === 'location') {
        setFormData({
          ...formData,
          location: {
            ...formData.location,
            [child]: value
          }
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      } as PersonalInfoFormData);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Update user profile using the profile service
      // This will also trigger recommendation updates if location changes
      await updateUserProfile(userId, {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        location: formData.location
      });

      setSuccess(true);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: unknown) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while updating your profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-error-50 p-4 text-sm text-error-600">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-md bg-success-50 p-4 text-sm text-success-600 flex items-center">
          <CheckCircle className="h-5 w-5 mr-2" />
          Personal information updated successfully!
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* First Name */}
        <div>
          <label htmlFor="first_name" className="block text-sm font-medium text-neutral-700">
            First Name
          </label>
          <input
            type="text"
            id="first_name"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
          />
        </div>

        {/* Last Name */}
        <div>
          <label htmlFor="last_name" className="block text-sm font-medium text-neutral-700">
            Last Name
          </label>
          <input
            type="text"
            id="last_name"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            disabled
            className="mt-1 block w-full rounded-md border border-neutral-300 bg-neutral-50 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
          />
          <p className="mt-1 text-xs text-neutral-500">
            Email cannot be changed. Contact support if you need to update your email.
          </p>
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-neutral-700">
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Location */}
      <div>
        <h3 className="text-lg font-medium text-neutral-900 mb-4">Location</h3>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {/* City */}
          <div className="sm:col-span-1">
            <label htmlFor="location.city" className="block text-sm font-medium text-neutral-700">
              City
            </label>
            <input
              type="text"
              id="location.city"
              name="location.city"
              value={formData.location?.city || ''}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
            />
          </div>

          {/* State */}
          <div className="sm:col-span-1">
            <label htmlFor="location.state" className="block text-sm font-medium text-neutral-700">
              State
            </label>
            <select
              id="location.state"
              name="location.state"
              value={formData.location?.state || 'Massachusetts'}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
            >
              <option value="Massachusetts">Massachusetts</option>
              <option value="Connecticut">Connecticut</option>
              <option value="Maine">Maine</option>
              <option value="New Hampshire">New Hampshire</option>
              <option value="Rhode Island">Rhode Island</option>
              <option value="Vermont">Vermont</option>
              <option value="New York">New York</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* ZIP Code */}
          <div className="sm:col-span-1">
            <label htmlFor="location.zip" className="block text-sm font-medium text-neutral-700">
              ZIP Code
            </label>
            <input
              type="text"
              id="location.zip"
              name="location.zip"
              value={formData.location?.zip || ''}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

export default PersonalInfoForm;
