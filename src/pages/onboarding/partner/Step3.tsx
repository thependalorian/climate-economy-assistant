import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import OnboardingLayout from '../../../components/onboarding/OnboardingLayout';
import { Image } from 'lucide-react';

export const PartnerStep3: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [existingLogoUrl, setExistingLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ensure storage bucket exists and fetch existing logo
  useEffect(() => {
    const initializeAndFetchData = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Check if storage bucket exists, create if it doesn't
        const { data: buckets } = await supabase
          .storage
          .listBuckets();

        const bucketExists = buckets?.some(bucket => bucket.name === 'organization-assets');

        if (!bucketExists) {
          console.log('Creating organization-assets bucket');
          const { error: bucketError } = await supabase
            .storage
            .createBucket('organization-assets', {
              public: true,
              fileSizeLimit: 2 * 1024 * 1024 // 2MB limit
            });

          if (bucketError) {
            console.error('Error creating bucket:', bucketError);
          }
        }

        // Fetch partner profile
        const { data: partnerData, error: partnerError } = await supabase
          .from('partner_profiles')
          .select('logo_url')
          .eq('id', user.id)
          .single();

        if (partnerError && partnerError.code !== 'PGRST116') {
          throw partnerError;
        }

        if (partnerData?.logo_url) {
          setExistingLogoUrl(partnerData.logo_url);
        }
      } catch (err) {
        console.error('Error initializing and fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeAndFetchData();
  }, [user]);

  // Handle logo file selection
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Upload logo to storage
  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile || !user) return null;

    setUploading(true);
    setError(null);

    try {
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `${user.id}-logo.${fileExt}`;
      const filePath = `partner-logos/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('organization-assets')
        .upload(filePath, logoFile, {
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('organization-assets')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (err: unknown) {
      setError('Error uploading logo: ' + (err instanceof Error ? err.message : 'Unknown error'));
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Upload logo if selected
      const logoUrl = logoFile ? await uploadLogo() : existingLogoUrl;

      if (logoUrl) {
        // Update partner profile with logo URL
        const { error: updateError } = await supabase
          .from('partner_profiles')
          .update({
            logo_url: logoUrl
          })
          .eq('id', user.id);

        if (updateError) throw updateError;
      }

      // Proceed to next step
      navigate('/onboarding/partner/step4');
    } catch (err: unknown) {
      console.error('Error updating profile:', err);
      setError('Error saving changes: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/onboarding/partner/step2');
  };

  return (
    <OnboardingLayout
      currentStep={3}
      totalSteps={4}
      title="Organization Logo"
      description="Upload your organization's logo to enhance your profile visibility."
    >
      {error && (
        <div className="mb-6 rounded-lg bg-error-50 p-4 text-sm text-error-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Logo upload */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Organization Logo
          </label>

          <div className="flex items-center space-x-6">
            {/* Logo preview */}
            <div className="w-24 h-24 border border-neutral-300 rounded-md flex items-center justify-center overflow-hidden bg-neutral-50">
              {uploading ? (
                <div className="flex items-center justify-center h-full w-full">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
                </div>
              ) : logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="object-contain w-full h-full"
                />
              ) : existingLogoUrl ? (
                <img
                  src={existingLogoUrl}
                  alt="Current logo"
                  className="object-contain w-full h-full"
                />
              ) : (
                <Image className="h-12 w-12 text-neutral-300" />
              )}
            </div>

            {/* Upload button */}
            <div className="flex-1">
              <label
                htmlFor="logo-upload"
                className={`relative ${uploading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none`}
              >
                <span>{uploading ? 'Uploading...' : 'Upload a logo'}</span>
                <input
                  id="logo-upload"
                  name="logo-upload"
                  type="file"
                  className="sr-only"
                  accept="image/*"
                  onChange={handleLogoChange}
                  disabled={uploading}
                />
              </label>
              <p className="text-xs text-neutral-500 mt-1">
                PNG, JPG, GIF up to 2MB. A square logo works best.
              </p>
            </div>
          </div>
        </div>

        {/* Additional media uploads could be added here */}
        <div className="p-4 bg-neutral-100 rounded-md">
          <h3 className="font-medium text-neutral-800 mb-2">Why upload a logo?</h3>
          <p className="text-sm text-neutral-600">
            Your organization's logo helps job seekers recognize your brand and increases visibility on the platform.
            Profiles with logos receive significantly more engagement.
          </p>
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex justify-center rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={loading || uploading}
            className="inline-flex justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            {loading || uploading ? 'Saving...' : 'Continue'}
          </button>
        </div>
      </form>
    </OnboardingLayout>
  );
};

export default PartnerStep3;
