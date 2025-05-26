import React, { useState } from 'react';
import { Bell, Lock, Eye, EyeOff, Save, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { useNavigate, useOutletContext } from 'react-router-dom';

interface UserProfile {
  first_name?: string;
  user_type?: string;
}

interface SettingsPageProps {
  userProfile?: UserProfile;
}

export const SettingsPage: React.FC<SettingsPageProps> = (props) => {
  const outletContext = useOutletContext<UserProfile>();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const userProfile = props.userProfile || outletContext;
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    jobAlerts: true,
    trainingAlerts: true,
    resourceUpdates: false,
    marketingEmails: false
  });
  const [saving, setSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [notificationSuccess, setNotificationSuccess] = useState<string | null>(null);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleNotificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setNotificationSettings(prev => ({ ...prev, [name]: checked }));
  };

  const updatePassword = async () => {
    if (!user) return;

    try {
      setSaving(true);
      setPasswordError(null);
      setPasswordSuccess(null);

      // Validate passwords
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setPasswordError('New passwords do not match');
        return;
      }

      if (passwordData.newPassword.length < 8) {
        setPasswordError('Password must be at least 8 characters long');
        return;
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      setPasswordSuccess('Password updated successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      // Reset success message after 3 seconds
      setTimeout(() => {
        setPasswordSuccess(null);
      }, 3000);

    } catch (err) {
      console.error('Error updating password:', err);
      setPasswordError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  const saveNotificationSettings = async () => {
    if (!user) return;

    try {
      setSaving(true);

      // In a real app, you would save these settings to the database
      // For now, we'll just simulate a successful save
      await new Promise(resolve => setTimeout(resolve, 1000));

      setNotificationSuccess('Notification settings saved successfully');

      // Reset success message after 3 seconds
      setTimeout(() => {
        setNotificationSuccess(null);
      }, 3000);

    } catch (err) {
      console.error('Error saving notification settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Settings</h1>
        <p className="mt-2 text-neutral-600">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Password Settings */}
        <div className="card p-6">
          <div className="mb-6 flex items-center">
            <Lock className="mr-2 h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-neutral-900">Password Settings</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-neutral-700">
                Current Password
              </label>
              <div className="mt-1 relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className="input pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-500"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-neutral-700">
                New Password
              </label>
              <div className="mt-1 relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="newPassword"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className="input pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-500"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700">
                Confirm New Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                className="mt-1 input"
              />
            </div>

            {passwordError && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="rounded-lg bg-green-50 p-4 text-sm text-green-600">
                {passwordSuccess}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={updatePassword}
                disabled={saving}
                className="btn-primary"
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="card p-6">
          <div className="mb-6 flex items-center">
            <Bell className="mr-2 h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-neutral-900">Notification Settings</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-neutral-900">Email Notifications</h3>
                <p className="text-xs text-neutral-500">Receive notifications via email</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  name="emailNotifications"
                  checked={notificationSettings.emailNotifications}
                  onChange={handleNotificationChange}
                  className="peer sr-only"
                />
                <div className="h-6 w-11 rounded-full bg-neutral-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-600 peer-checked:after:translate-x-full peer-focus:outline-none"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-neutral-900">Job Alerts</h3>
                <p className="text-xs text-neutral-500">Receive notifications about new job matches</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  name="jobAlerts"
                  checked={notificationSettings.jobAlerts}
                  onChange={handleNotificationChange}
                  className="peer sr-only"
                />
                <div className="h-6 w-11 rounded-full bg-neutral-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-600 peer-checked:after:translate-x-full peer-focus:outline-none"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-neutral-900">Training Alerts</h3>
                <p className="text-xs text-neutral-500">Receive notifications about training opportunities</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  name="trainingAlerts"
                  checked={notificationSettings.trainingAlerts}
                  onChange={handleNotificationChange}
                  className="peer sr-only"
                />
                <div className="h-6 w-11 rounded-full bg-neutral-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-600 peer-checked:after:translate-x-full peer-focus:outline-none"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-neutral-900">Resource Updates</h3>
                <p className="text-xs text-neutral-500">Receive notifications about new resources</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  name="resourceUpdates"
                  checked={notificationSettings.resourceUpdates}
                  onChange={handleNotificationChange}
                  className="peer sr-only"
                />
                <div className="h-6 w-11 rounded-full bg-neutral-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-600 peer-checked:after:translate-x-full peer-focus:outline-none"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-neutral-900">Marketing Emails</h3>
                <p className="text-xs text-neutral-500">Receive marketing and promotional emails</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  name="marketingEmails"
                  checked={notificationSettings.marketingEmails}
                  onChange={handleNotificationChange}
                  className="peer sr-only"
                />
                <div className="h-6 w-11 rounded-full bg-neutral-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-600 peer-checked:after:translate-x-full peer-focus:outline-none"></div>
              </label>
            </div>

            {notificationSuccess && (
              <div className="rounded-lg bg-green-50 p-4 text-sm text-green-600">
                {notificationSuccess}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={saveNotificationSettings}
                disabled={saving}
                className="btn-primary"
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div className="card p-6">
          <div className="mb-6 flex items-center">
            <Lock className="mr-2 h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-neutral-900">Account Actions</h2>
          </div>

          <div className="space-y-4">
            <button
              type="button"
              onClick={handleSignOut}
              className="btn-danger"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
