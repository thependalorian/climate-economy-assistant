import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Trash2, ArrowRight } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

interface UserProfile {
  resume_url?: string;
  updated_at?: string;
}

interface ResumePageProps {
  userProfile?: UserProfile;
}

export const ResumePage: React.FC<ResumePageProps> = (props) => {
  const outletContext = useOutletContext<UserProfile>();
  const userProfile = props.userProfile || outletContext;
  const { user } = useAuth();
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && userProfile) {
      setResumeUrl(userProfile.resume_url);
      setLoading(false);
    }
  }, [user, userProfile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      if (!file.type.match('application/pdf|application/msword|application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
        setErrorMessage('Please upload a PDF or Word document');
        return;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('File size must be less than 5MB');
        return;
      }

      setResumeFile(file);
      setErrorMessage(null);
    }
  };

  const uploadResume = async () => {
    if (!resumeFile || !user) return;

    try {
      setUploadStatus('uploading');

      // Upload file to storage
      const fileExt = resumeFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `resumes/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('user-files')
        .upload(filePath, resumeFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('user-files')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // Update user profile with resume URL
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ resume_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update job seeker profile with resume URL and processed timestamp
      const { error: seekerUpdateError } = await supabase
        .from('job_seeker_profiles')
        .update({
          resume_url: publicUrl,
          resume_processed_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (seekerUpdateError) throw seekerUpdateError;

      setResumeUrl(publicUrl);
      setUploadStatus('success');

      // Reset after success
      setTimeout(() => {
        setUploadStatus('idle');
        setResumeFile(null);
      }, 3000);

    } catch (err) {
      console.error('Error uploading resume:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to upload resume');
      setUploadStatus('error');
    }
  };

  const deleteResume = async () => {
    if (!user || !resumeUrl) return;

    try {
      setLoading(true);

      // Extract file path from URL
      const urlParts = resumeUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `resumes/${fileName}`;

      // Delete file from storage
      const { error: deleteError } = await supabase.storage
        .from('user-files')
        .remove([filePath]);

      if (deleteError) throw deleteError;

      // Update user profile to remove resume URL
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ resume_url: null })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update job seeker profile to remove resume URL
      const { error: seekerUpdateError } = await supabase
        .from('job_seeker_profiles')
        .update({
          resume_url: null,
          resume_processed_at: null
        })
        .eq('id', user.id);

      if (seekerUpdateError) throw seekerUpdateError;

      setResumeUrl(null);

    } catch (err) {
      console.error('Error deleting resume:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to delete resume');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4 md:px-6">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-neutral-200 rounded mb-4"></div>
          <div className="h-4 w-96 bg-neutral-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Resume Manager</h1>
        <p className="mt-2 text-neutral-600">
          Upload and manage your resume to improve job matching
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Resume Upload Card */}
        <div className="card p-6">
          <div className="mb-4 flex items-center">
            <FileText className="mr-2 h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-neutral-900">Resume Upload</h2>
          </div>

          {resumeUrl ? (
            <div className="space-y-4">
              <div className="flex items-center rounded-lg bg-green-50 p-4 text-green-700">
                <CheckCircle className="mr-2 h-5 w-5" />
                <div>
                  <p className="font-medium">Resume uploaded successfully</p>
                  <p className="text-sm">Your resume is being analyzed to improve job matching</p>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-4">
                <div className="flex items-center">
                  <FileText className="mr-3 h-6 w-6 text-neutral-500" />
                  <div>
                    <p className="font-medium text-neutral-900">Your Resume</p>
                    <p className="text-sm text-neutral-600">Last updated: {new Date(userProfile?.updated_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <a
                    href={resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary py-1.5 px-3"
                  >
                    View
                  </a>
                  <button
                    onClick={deleteResume}
                    className="btn-danger py-1.5 px-3"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="rounded-lg bg-neutral-50 p-4 text-sm text-neutral-700">
                <p className="font-medium">Want to update your resume?</p>
                <p className="mt-1">Delete your current resume and upload a new one.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 p-6">
                <Upload className="mb-2 h-8 w-8 text-neutral-400" />
                <p className="mb-2 text-center text-neutral-700">Drag and drop your resume here, or click to browse</p>
                <p className="text-center text-xs text-neutral-500">Accepted formats: PDF, DOC, DOCX (Max 5MB)</p>
                <input
                  type="file"
                  id="resume-upload"
                  className="hidden"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileChange}
                />
                <label htmlFor="resume-upload" className="mt-4 btn-primary cursor-pointer">
                  Browse Files
                </label>
              </div>

              {resumeFile && (
                <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-4">
                  <div className="flex items-center">
                    <FileText className="mr-3 h-6 w-6 text-neutral-500" />
                    <div>
                      <p className="font-medium text-neutral-900">{resumeFile.name}</p>
                      <p className="text-sm text-neutral-600">{(resumeFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button
                    onClick={uploadResume}
                    disabled={uploadStatus === 'uploading'}
                    className="btn-primary py-1.5 px-3"
                  >
                    {uploadStatus === 'uploading' ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              )}

              {errorMessage && (
                <div className="flex items-center rounded-lg bg-red-50 p-4 text-red-700">
                  <AlertCircle className="mr-2 h-5 w-5" />
                  <p>{errorMessage}</p>
                </div>
              )}

              {uploadStatus === 'success' && (
                <div className="flex items-center rounded-lg bg-green-50 p-4 text-green-700">
                  <CheckCircle className="mr-2 h-5 w-5" />
                  <p>Resume uploaded successfully!</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Resume Tips Card */}
        <div className="card p-6">
          <div className="mb-4 flex items-center">
            <CheckCircle className="mr-2 h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-neutral-900">Resume Tips</h2>
          </div>

          <div className="space-y-4">
            <p className="text-neutral-700">
              A strong resume increases your chances of matching with great job opportunities.
              Here are some tips to optimize your resume for clean energy jobs:
            </p>

            <ul className="space-y-2 text-neutral-700">
              <li className="flex items-start">
                <span className="mr-2 mt-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary-100 text-xs text-primary-600">•</span>
                <span>Highlight relevant skills and certifications</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary-100 text-xs text-primary-600">•</span>
                <span>Include keywords related to clean energy and sustainability</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary-100 text-xs text-primary-600">•</span>
                <span>Quantify your achievements with specific metrics</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary-100 text-xs text-primary-600">•</span>
                <span>Tailor your resume to the specific sector you're interested in</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary-100 text-xs text-primary-600">•</span>
                <span>Keep your resume concise and well-organized</span>
              </li>
            </ul>

            <div className="rounded-lg bg-primary-50 p-4 text-sm text-primary-700">
              <p className="font-medium">Need help with your resume?</p>
              <p className="mt-1">Our AI assistant can analyze your resume and provide personalized feedback.</p>
              <button className="mt-2 inline-flex items-center text-primary-600 hover:text-primary-700">
                Get Resume Feedback <ArrowRight className="ml-1 h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
