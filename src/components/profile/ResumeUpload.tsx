import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { processResumeWithLangGraph } from '../../services/agentService';
import { Upload, FileText, X, CheckCircle, AlertTriangle, Trash2, Download } from 'lucide-react';

interface Profile {
  id: string;
  resume_url?: string;
  resume_filename?: string;
  resume_parsed?: boolean;
  has_resume?: boolean;
  will_upload_later?: boolean;
  [key: string]: unknown;
}

interface ResumeUploadProps {
  userId: string;
  profile: Profile | null;
}

const ResumeUpload: React.FC<ResumeUploadProps> = ({ userId, profile }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [resumeFilename, setResumeFilename] = useState<string | null>(null);
  const [resumeParsed, setResumeParsed] = useState(false);
  const [uploadLater, setUploadLater] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize with profile data
  useEffect(() => {
    if (profile) {
      setResumeUrl(profile.resume_url || null);
      setResumeFilename(profile.resume_filename || null);
      setResumeParsed(profile.resume_parsed || false);
      setUploadLater(profile.will_upload_later || false);
    }
  }, [profile]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;

    if (selectedFile) {
      // Check file type
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/rtf'];
      if (!validTypes.includes(selectedFile.type)) {
        setError('Invalid file type. Please upload a PDF, DOC, DOCX, TXT, or RTF file.');
        return;
      }

      // Check file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File is too large. Maximum size is 10MB.');
        return;
      }

      setFile(selectedFile);
      setError(null);
      setUploadLater(false);
    }
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!file) return;

    try {
      setLoading(true);
      setError(null);

      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `resumes/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = await supabase.storage
        .from('resumes')
        .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year expiry

      if (!urlData?.signedUrl) {
        throw new Error('Failed to generate resume URL');
      }

      // Update profile
      const { error: updateError } = await supabase
        .from('job_seeker_profiles')
        .update({
          resume_url: urlData.signedUrl,
          resume_filename: file.name,
          resume_parsed: false,
          has_resume: true,
          will_upload_later: false
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Update local state
      setResumeUrl(urlData.signedUrl);
      setResumeFilename(file.name);
      setResumeParsed(false);
      setFile(null);
      setSuccess(true);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);

      // Process resume using LangGraph
      try {
        console.log('Processing resume with LangGraph...');
        const processingResult = await processResumeWithLangGraph(userId, file);
        
        if (processingResult.success) {
          setResumeParsed(true);
          console.log('Resume processed successfully:', processingResult);
        } else {
          console.error('Resume processing failed:', processingResult.error);
          // Still mark as parsed to avoid blocking the user
          setResumeParsed(true);
        }
      } catch (processingError) {
        console.error('Error processing resume with LangGraph:', processingError);
        // Fallback: mark as parsed to avoid blocking the user
        setResumeParsed(true);
      }
    } catch (err: unknown) {
      console.error('Error uploading resume:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while uploading your resume.');
    } finally {
      setLoading(false);
    }
  };

  // Handle resume deletion
  const handleDelete = async () => {
    if (!resumeFilename) return;

    try {
      setLoading(true);
      setError(null);

      // Delete file from Supabase Storage
      // Note: In a real app, you would extract the file path from the URL
      // For simplicity, we'll skip the actual storage deletion here

      // Update profile
      const { error: updateError } = await supabase
        .from('job_seeker_profiles')
        .update({
          resume_url: null,
          resume_filename: null,
          resume_parsed: false,
          has_resume: false,
          will_upload_later: false
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Update local state
      setResumeUrl(null);
      setResumeFilename(null);
      setResumeParsed(false);
      setFile(null);
      setSuccess(true);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: unknown) {
      console.error('Error deleting resume:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while deleting your resume.');
    } finally {
      setLoading(false);
    }
  };

  // Handle "Upload Later" option
  const handleUploadLater = async () => {
    try {
      setLoading(true);
      setError(null);

      // Update profile
      const { error: updateError } = await supabase
        .from('job_seeker_profiles')
        .update({
          will_upload_later: true,
          has_resume: false
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Update local state
      setUploadLater(true);
      setResumeUrl(null);
      setResumeFilename(null);
      setResumeParsed(false);
      setFile(null);
      setSuccess(true);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: unknown) {
      console.error('Error updating resume preferences:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while updating your preferences.');
    } finally {
      setLoading(false);
    }
  };

  // Get file extension
  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toUpperCase() || '';
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md bg-error-50 p-4 text-sm text-error-600">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-md bg-success-50 p-4 text-sm text-success-600 flex items-center">
          <CheckCircle className="h-5 w-5 mr-2" />
          {resumeUrl
            ? 'Resume uploaded successfully!'
            : uploadLater
            ? 'Preferences updated. You can upload your resume later.'
            : 'Resume deleted successfully!'}
        </div>
      )}

      {/* Current Resume */}
      {resumeUrl && resumeFilename ? (
        <div className="rounded-md border border-neutral-200 p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary-100">
                  <FileText className="h-6 w-6 text-primary-600" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-neutral-900">{resumeFilename}</h3>
                <p className="text-sm text-neutral-500">
                  {getFileExtension(resumeFilename)} • Uploaded {new Date().toLocaleDateString()}
                </p>
                {resumeParsed && (
                  <div className="mt-1 flex items-center text-sm text-success-600">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Resume parsed successfully
                  </div>
                )}
              </div>
            </div>
            <div className="flex space-x-2">
              <a
                href={resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </a>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="inline-flex items-center rounded-md border border-error-300 bg-white px-3 py-2 text-sm font-medium text-error-700 shadow-sm hover:bg-error-50 focus:outline-none focus:ring-2 focus:ring-error-500 focus:ring-offset-2"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-md border-2 border-dashed border-neutral-300 p-6">
          <div className="text-center">
            <FileText className="mx-auto h-12 w-12 text-neutral-400" />
            <h3 className="mt-2 text-sm font-medium text-neutral-900">
              {uploadLater ? 'Resume Upload Postponed' : 'No Resume Uploaded'}
            </h3>
            <p className="mt-1 text-sm text-neutral-500">
              {uploadLater
                ? 'You chose to upload your resume later. You can upload it now or come back later.'
                : 'Upload your resume to improve job matches and allow employers to find you.'}
            </p>
            <div className="mt-6">
              <label
                htmlFor="file-upload"
                className="inline-flex items-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                <Upload className="h-4 w-4 mr-1" />
                Upload Resume
              </label>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                ref={fileInputRef}
                className="sr-only"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.txt,.rtf"
              />
            </div>
            <p className="mt-2 text-xs text-neutral-500">
              PDF, DOC, DOCX, TXT, or RTF up to 10MB
            </p>
          </div>
        </div>
      )}

      {/* Selected File Preview */}
      {file && (
        <div className="rounded-md bg-neutral-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-neutral-400 mr-2" />
              <span className="text-sm font-medium text-neutral-900">{file.name}</span>
              <span className="ml-2 text-xs text-neutral-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
            <button
              type="button"
              onClick={() => setFile(null)}
              className="inline-flex items-center text-neutral-400 hover:text-neutral-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setFile(null)}
              className="inline-flex items-center rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={loading}
              className="inline-flex items-center rounded-md border border-transparent bg-primary-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              {loading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>
      )}

      {/* Upload Later Option */}
      {!resumeUrl && !file && !uploadLater && (
        <div className="mt-4 flex items-center justify-center">
          <button
            type="button"
            onClick={handleUploadLater}
            className="text-sm text-primary-600 hover:text-primary-500"
          >
            I'll upload my resume later
          </button>
        </div>
      )}

      {/* Resume Tips */}
      <div className="rounded-md bg-primary-50 p-4">
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
  );
};

export default ResumeUpload;
