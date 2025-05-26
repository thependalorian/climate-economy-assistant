import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { Upload, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { processResume } from '../../services/resumeProcessingService';

const ResumeUpload: React.FC = () => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [existingResume, setExistingResume] = useState<{
    url: string;
    filename: string;
    parsed: boolean;
    updated_at: string;
  } | null>(null);

  // Check if user already has a resume
  useEffect(() => {
    const checkExistingResume = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('job_seeker_profiles')
          .select('resume_url, resume_filename, resume_parsed, resume_updated_at')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data && data.resume_url && data.resume_filename) {
          setExistingResume({
            url: data.resume_url,
            filename: data.resume_filename,
            parsed: data.resume_parsed || false,
            updated_at: data.resume_updated_at || new Date().toISOString()
          });
        }
      } catch (err) {
        console.error('Error checking existing resume:', err);
      }
    };

    checkExistingResume();
  }, [user]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!validTypes.includes(selectedFile.type)) {
      setError('Please upload a PDF or Word document');
      return;
    }

    // Validate file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  // Upload and process resume
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    if (!user) {
      setError('You must be logged in to upload a resume');
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);
    setSuccess(false);

    try {
      // 1. Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-resume-${Date.now()}.${fileExt}`;
      const filePath = `resumes/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('user-documents')
        .upload(filePath, file, {
          upsert: true,
          onUploadProgress: (progress) => {
            setProgress(Math.round((progress.loaded / progress.total) * 50));
          }
        });

      if (uploadError) throw uploadError;

      // 2. Get public URL
      const { data: urlData } = supabase.storage
        .from('user-documents')
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL for uploaded file');
      }

      // 3. Update job seeker profile with resume URL
      const { error: updateError } = await supabase
        .from('job_seeker_profiles')
        .update({
          resume_url: urlData.publicUrl,
          resume_filename: file.name,
          resume_updated_at: new Date().toISOString(),
          has_resume: true,
          will_upload_later: false,
          resume_parsed: false
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProgress(75);

      // 4. Trigger resume processing
      setProcessing(true);

      // Call our simulated resume processing service
      const result = await processResume(user.id, urlData.publicUrl);

      if (!result.success) {
        throw new Error(result.error || 'Failed to process resume');
      }

      setProgress(100);
      setSuccess(true);

      // Reset file input
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: unknown) {
      console.error('Error uploading resume:', err);
      setError('Error uploading resume: ' + (err instanceof Error ? err.message : 'Unknown error'));
      setProgress(0);
    } finally {
      setUploading(false);
      setProcessing(false);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];

      // Validate file type
      const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (!validTypes.includes(droppedFile.type)) {
        setError('Please upload a PDF or Word document');
        return;
      }

      // Validate file size (max 5MB)
      if (droppedFile.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }

      setFile(droppedFile);
      setError(null);
    }
  };

  // Delete existing resume
  const handleDeleteResume = async () => {
    if (!user || !existingResume) return;

    try {
      setLoading(true);
      setError(null);

      // Update profile to remove resume reference
      const { error: updateError } = await supabase
        .from('job_seeker_profiles')
        .update({
          resume_url: null,
          resume_filename: null,
          resume_parsed: false,
          has_resume: false,
          will_upload_later: false,
          resume_updated_at: null
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // In a real app, you would also delete the file from storage
      // For this demo, we'll just update the state

      setExistingResume(null);
      setSuccess(true);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: unknown) {
      console.error('Error deleting resume:', err);
      setError('Error deleting resume: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6 border-b border-neutral-200">
          <h1 className="text-2xl font-bold text-neutral-900">Resume Upload</h1>
          <p className="mt-1 text-neutral-600">
            Upload your resume to improve job matches and get personalized career guidance.
          </p>
        </div>

        <div className="p-6">
          <form onSubmit={handleUpload} className="space-y-6">
            {error && (
              <div className="p-4 bg-error-50 text-error-700 rounded-md text-sm flex items-start">
                <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 text-error-400" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-4 bg-success-50 text-success-700 rounded-md text-sm flex items-start">
                <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 text-success-400" />
                <span>Resume uploaded and processed successfully!</span>
              </div>
            )}

            {/* Existing Resume */}
            {existingResume ? (
              <div className="rounded-md border border-neutral-200 p-4 mb-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary-100">
                        <FileText className="h-6 w-6 text-primary-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-neutral-900">{existingResume.filename}</h3>
                      <p className="text-sm text-neutral-500">
                        {existingResume.filename.split('.').pop()?.toUpperCase()} • Uploaded {new Date(existingResume.updated_at).toLocaleDateString()}
                      </p>
                      {existingResume.parsed && (
                        <div className="mt-1 flex items-center text-sm text-success-600">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Resume parsed successfully
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <a
                      href={existingResume.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      View
                    </a>
                    <button
                      type="button"
                      onClick={handleDeleteResume}
                      disabled={uploading || processing}
                      className="inline-flex items-center rounded-md border border-error-300 bg-white px-3 py-2 text-sm font-medium text-error-700 shadow-sm hover:bg-error-50 focus:outline-none focus:ring-2 focus:ring-error-500 focus:ring-offset-2"
                    >
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {/* File upload area */}
            {!existingResume && (
              <div
                className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                />

                {file ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center">
                      <FileText className="h-8 w-8 text-primary-500" />
                    </div>
                    <p className="text-sm font-medium text-neutral-900">{file.name}</p>
                    <p className="text-xs text-neutral-500">{(file.size / 1024).toFixed(2)} KB</p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-sm text-primary-600 hover:text-primary-500"
                    >
                      Change file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="mx-auto h-12 w-12 text-neutral-400" />
                    <p className="text-sm text-neutral-600">
                      Drag and drop your resume here, or{' '}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-primary-600 hover:text-primary-500"
                      >
                        browse
                      </button>
                    </p>
                    <p className="text-xs text-neutral-500">
                      PDF or Word documents up to 5MB
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Progress bar (when uploading) */}
            {(uploading || processing) && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-700">
                    {processing ? 'Processing resume...' : 'Uploading...'}
                  </span>
                  <span className="text-neutral-700">{progress}%</span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Submit button - only show if there's a file selected and no existing resume */}
            {!existingResume && file && (
              <div>
                <button
                  type="submit"
                  disabled={uploading || processing}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : processing ? 'Processing...' : 'Upload Resume'}
                </button>
              </div>
            )}

            {/* Upload new resume button - only show if there's an existing resume */}
            {existingResume && (
              <div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Upload New Resume
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                />
              </div>
            )}
          </form>

          {/* Resume Tips */}
          <div className="mt-8 rounded-md bg-primary-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-primary-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-primary-800">Resume Tips</h3>
                <div className="mt-2 text-sm text-primary-700">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Keep your resume concise and focused on relevant experience</li>
                    <li>Highlight skills and experience related to clean energy</li>
                    <li>Include quantifiable achievements and results</li>
                    <li>Ensure your contact information is up to date</li>
                    <li>Proofread carefully for errors and typos</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ResumeUpload;
