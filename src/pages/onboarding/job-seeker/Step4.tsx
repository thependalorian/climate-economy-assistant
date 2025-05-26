import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import OnboardingLayout from '../../../components/onboarding/OnboardingLayout';
import { FileUp, FileText, Trash2, CheckCircle, AlertCircle, X } from 'lucide-react';

interface FormData {
  resume_url: string | null;
  resume_filename: string | null;
  resume_parsed: boolean;
  has_resume: boolean;
  will_upload_later: boolean;
}

export const JobSeekerStep4: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<FormData>({
    resume_url: null,
    resume_filename: null,
    resume_parsed: false,
    has_resume: true,
    will_upload_later: false
  });

  // Fetch existing data if available
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Ensure storage bucket exists
        const { data: buckets } = await supabase
          .storage
          .listBuckets();

        const bucketExists = buckets?.some(bucket => bucket.name === 'resumes');

        if (!bucketExists) {
          console.log('Creating resumes bucket');
          const { error: bucketError } = await supabase
            .storage
            .createBucket('resumes', {
              public: false,
              fileSizeLimit: 10 * 1024 * 1024 // 10MB limit
            });

          if (bucketError) {
            console.error('Error creating bucket:', bucketError);
          }
        }

        // Fetch job seeker profile
        const { data: profileData, error: profileError } = await supabase
          .from('job_seeker_profiles')
          .select('resume_url, resume_filename, resume_parsed, has_resume, will_upload_later')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }

        // Pre-fill form with existing data
        if (profileData) {
          setFormData({
            resume_url: profileData.resume_url || null,
            resume_filename: profileData.resume_filename || null,
            resume_parsed: profileData.resume_parsed || false,
            has_resume: profileData.has_resume !== false, // Default to true if not set
            will_upload_later: profileData.will_upload_later || false
          });
        }
      } catch (err) {
        console.error('Error fetching profile data:', err);
        setError('Failed to load your profile data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Handle resume file selection
  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const allowedTypes = ['pdf', 'doc', 'docx', 'txt', 'rtf'];

    if (!fileExt || !allowedTypes.includes(fileExt)) {
      setError('Invalid file type. Please upload a PDF, DOC, DOCX, TXT, or RTF file.');
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File is too large. Maximum size is 10MB.');
      return;
    }

    setResumeFile(file);
    setError(null);
  };

  // Upload resume to storage
  const uploadResume = async (): Promise<{ url: string; filename: string } | null> => {
    if (!resumeFile || !user) return null;

    setUploading(true);
    setError(null);

    try {
      const fileExt = resumeFile.name.split('.').pop();
      const fileName = `${user.id}-resume.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, resumeFile, {
          upsert: true,
          contentType: resumeFile.type
        });

      if (uploadError) throw uploadError;

      // Get URL (this will be a signed URL since the bucket is private)
      const { data } = await supabase.storage
        .from('resumes')
        .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year expiry

      if (!data?.signedUrl) {
        throw new Error('Failed to generate signed URL for resume');
      }

      return {
        url: data.signedUrl,
        filename: resumeFile.name
      };
    } catch (err: unknown) {
      setError('Error uploading resume: ' + (err instanceof Error ? err.message : 'Unknown error'));
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;

    if (name === 'has_resume') {
      setFormData({
        ...formData,
        has_resume: checked,
        will_upload_later: checked ? formData.will_upload_later : false
      });
    } else if (name === 'will_upload_later') {
      setFormData({
        ...formData,
        will_upload_later: checked
      });
    }
  };

  // Delete existing resume
  const handleDeleteResume = async () => {
    if (!user || !formData.resume_filename) return;

    setLoading(true);
    setError(null);

    try {
      // Delete from storage
      const filePath = `${user.id}/${formData.resume_filename}`;
      const { error: deleteError } = await supabase.storage
        .from('resumes')
        .remove([filePath]);

      if (deleteError) throw deleteError;

      // Update form data
      setFormData({
        ...formData,
        resume_url: null,
        resume_filename: null,
        resume_parsed: false
      });

      // Update profile
      const { error: updateError } = await supabase
        .from('job_seeker_profiles')
        .update({
          resume_url: null,
          resume_filename: null,
          resume_parsed: false
        })
        .eq('id', user.id);

      if (updateError) throw updateError;
    } catch (err: unknown) {
      console.error('Error deleting resume:', err);
      setError('Error deleting resume: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
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

      let resumeData = {
        resume_url: formData.resume_url,
        resume_filename: formData.resume_filename,
        resume_parsed: formData.resume_parsed
      };

      // Upload resume if selected
      if (resumeFile) {
        const uploadResult = await uploadResume();
        if (uploadResult) {
          resumeData = {
            resume_url: uploadResult.url,
            resume_filename: uploadResult.filename,
            resume_parsed: false // Reset parsed flag for new uploads
          };
        }
      }

      // Update job seeker profile
      const { error: updateError } = await supabase
        .from('job_seeker_profiles')
        .update({
          ...resumeData,
          has_resume: formData.has_resume,
          will_upload_later: formData.will_upload_later,
          onboarding_step: 4
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Proceed to next step
      navigate('/onboarding/job-seeker/step5');
    } catch (err: unknown) {
      console.error('Error updating profile:', err);
      setError('Error saving changes: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/onboarding/job-seeker/step3');
  };

  return (
    <OnboardingLayout
      currentStep={4}
      totalSteps={5}
      title="Resume Upload"
      description="Upload your resume to help us match you with the right opportunities."
    >
      {error && (
        <div className="mb-6 rounded-lg bg-error-50 p-4 text-sm text-error-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Resume upload section */}
        <div className="space-y-4">
          <div className="flex items-center">
            <FileText className="mr-2 h-5 w-5 text-primary-600" />
            <h3 className="text-lg font-medium text-neutral-900">Resume</h3>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <div className="space-y-4">
              {/* Do you have a resume? */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="has_resume"
                    checked={formData.has_resume}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-neutral-700">I have a resume</span>
                </label>
              </div>

              {formData.has_resume && (
                <>
                  {/* Existing resume display */}
                  {formData.resume_url && formData.resume_filename && (
                    <div className="rounded-md bg-neutral-50 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <FileText className="mr-2 h-5 w-5 text-primary-600" />
                          <span className="text-sm font-medium text-neutral-700">{formData.resume_filename}</span>
                          {formData.resume_parsed && (
                            <span className="ml-2 inline-flex items-center rounded-full bg-success-100 px-2.5 py-0.5 text-xs font-medium text-success-800">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Parsed
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={handleDeleteResume}
                          disabled={loading}
                          className="text-error-600 hover:text-error-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-2">
                        <a
                          href={formData.resume_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary-600 hover:text-primary-800"
                        >
                          View Resume
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Upload new resume */}
                  {!formData.resume_url && !formData.will_upload_later && (
                    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 p-6">
                      <div className="mb-2 rounded-full bg-primary-100 p-2">
                        <FileUp className="h-6 w-6 text-primary-600" />
                      </div>
                      <p className="mb-1 text-sm font-medium text-neutral-700">
                        Drag and drop your resume here, or
                      </p>
                      <label
                        htmlFor="resume-upload"
                        className="cursor-pointer text-sm font-medium text-primary-600 hover:text-primary-500"
                      >
                        <span>Browse files</span>
                        <input
                          id="resume-upload"
                          name="resume-upload"
                          type="file"
                          className="sr-only"
                          accept=".pdf,.doc,.docx,.txt,.rtf"
                          onChange={handleResumeChange}
                          disabled={uploading}
                        />
                      </label>
                      <p className="mt-1 text-xs text-neutral-500">
                        PDF, DOC, DOCX, TXT, or RTF up to 10MB
                      </p>

                      {resumeFile && (
                        <div className="mt-4 flex items-center rounded-md bg-primary-50 px-3 py-2">
                          <FileText className="mr-2 h-4 w-4 text-primary-600" />
                          <span className="text-sm text-primary-700">{resumeFile.name}</span>
                          <button
                            type="button"
                            onClick={() => setResumeFile(null)}
                            className="ml-2 text-primary-600 hover:text-primary-800"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Upload later option */}
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="will_upload_later"
                        checked={formData.will_upload_later}
                        onChange={handleCheckboxChange}
                        className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-neutral-700">I'll upload my resume later</span>
                    </label>
                  </div>
                </>
              )}

              {!formData.has_resume && (
                <div className="rounded-md bg-info-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-info-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-info-700">
                        Having a resume significantly increases your chances of being matched with relevant opportunities.
                        We recommend creating a resume before continuing.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Resume tips */}
          <div className="rounded-md bg-neutral-50 p-4">
            <h4 className="mb-2 text-sm font-medium text-neutral-900">Resume Tips</h4>
            <ul className="ml-5 list-disc space-y-1 text-xs text-neutral-600">
              <li>Include relevant skills and experience in the clean energy sector</li>
              <li>Highlight certifications and training related to renewable energy</li>
              <li>Quantify your achievements with specific metrics when possible</li>
              <li>Keep your resume concise and focused on relevant experience</li>
              <li>Use industry-specific keywords to improve matching with opportunities</li>
            </ul>
          </div>
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

export default JobSeekerStep4;
