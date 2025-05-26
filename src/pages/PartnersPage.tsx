import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Building2, User, FileText, BarChart3, Users, Settings } from 'lucide-react';

export const PartnersPage: React.FC = () => {
  return (
    <div className="container section-lg">
      <div className="mb-8 act-fade-in">
        <Link to="/" className="inline-flex items-center font-body text-sm font-medium text-midnight-forest-600 hover:text-spring-green tracking-act-tight transition-colors duration-200">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to home
        </Link>
        <h1 className="mt-4 font-display font-normal text-4xl md:text-5xl text-midnight-forest tracking-act-tight leading-act-tight">
          Partner Dashboard
        </h1>
        <p className="mt-2 font-body text-lg text-midnight-forest-600 tracking-act-tight leading-act-normal">
          Connect with climate workforce opportunities and manage your organization's presence
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {/* Organization Profile */}
        <div className="card act-card-hover p-6" style={{ animationDelay: '0ms' }}>
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-act bg-spring-green-100">
            <Building2 className="h-6 w-6 text-spring-green-700" />
          </div>
          <h3 className="mb-3 card-title text-xl">Organization Profile</h3>
          <p className="mb-6 font-body text-midnight-forest-600 tracking-act-tight leading-act-normal">
            Manage your organization's information, description, and contact details.
          </p>
          <Link
            to="/partner-dashboard/profile"
            className="btn-outline text-sm px-4 py-2"
          >
            Manage Profile
          </Link>
        </div>

        {/* Job Listings */}
        <div className="card act-card-hover p-6" style={{ animationDelay: '100ms' }}>
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-act bg-moss-green-100">
            <FileText className="h-6 w-6 text-moss-green-700" />
          </div>
          <h3 className="mb-3 card-title text-xl">Job Listings</h3>
          <p className="mb-6 font-body text-midnight-forest-600 tracking-act-tight leading-act-normal">
            Post, edit, and manage your clean energy job opportunities and internships.
          </p>
          <Link
            to="/partner-dashboard/jobs"
            className="btn-outline text-sm px-4 py-2"
          >
            Manage Jobs
          </Link>
        </div>

        {/* Candidate Matching */}
        <div className="card act-card-hover p-6" style={{ animationDelay: '200ms' }}>
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-act bg-seafoam-blue-200">
            <User className="h-6 w-6 text-midnight-forest" />
          </div>
          <h3 className="mb-3 card-title text-xl">Candidate Matching</h3>
          <p className="mb-6 font-body text-midnight-forest-600 tracking-act-tight leading-act-normal">
            Review potential candidates that match your job requirements and qualifications.
          </p>
          <Link
            to="/partner-dashboard/candidates"
            className="btn-outline text-sm px-4 py-2"
          >
            View Candidates
          </Link>
        </div>

        {/* Analytics */}
        <div className="card act-card-hover p-6" style={{ animationDelay: '300ms' }}>
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-act bg-sand-gray-300">
            <BarChart3 className="h-6 w-6 text-midnight-forest" />
          </div>
          <h3 className="mb-3 card-title text-xl">Analytics</h3>
          <p className="mb-6 font-body text-midnight-forest-600 tracking-act-tight leading-act-normal">
            Monitor engagement metrics, application statistics, and demographic insights.
          </p>
          <Link
            to="/partner-dashboard/analytics"
            className="btn-outline text-sm px-4 py-2"
          >
            View Analytics
          </Link>
        </div>

        {/* Training Programs */}
        <div className="card act-card-hover p-6" style={{ animationDelay: '400ms' }}>
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-act bg-spring-green-100">
            <Users className="h-6 w-6 text-spring-green-700" />
          </div>
          <h3 className="mb-3 card-title text-xl">Training Programs</h3>
          <p className="mb-6 font-body text-midnight-forest-600 tracking-act-tight leading-act-normal">
            Share your training programs, certifications, and educational resources.
          </p>
          <Link
            to="/partner-dashboard/programs"
            className="btn-outline text-sm px-4 py-2"
          >
            Manage Programs
          </Link>
        </div>

        {/* Settings */}
        <div className="card act-card-hover p-6" style={{ animationDelay: '500ms' }}>
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-act bg-moss-green-100">
            <Settings className="h-6 w-6 text-moss-green-700" />
          </div>
          <h3 className="mb-3 card-title text-xl">Account Settings</h3>
          <p className="mb-6 font-body text-midnight-forest-600 tracking-act-tight leading-act-normal">
            Manage your account preferences, team members, and notification settings.
          </p>
          <Link
            to="/partner-dashboard/settings"
            className="btn-outline text-sm px-4 py-2"
          >
            Manage Settings
          </Link>
        </div>
      </div>

      <div className="mt-12 act-frame bg-moss-green p-8 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-display font-medium text-3xl md:text-4xl tracking-act-tight leading-act-tight">
            Need help getting started?
          </h2>
          <p className="mt-4 font-body text-lg text-white/90 tracking-act-tight leading-act-normal">
            Our team can help you optimize your profile, improve job listings, and connect with qualified candidates.
          </p>
          <button
            type="button"
            className="mt-6 bg-spring-green text-midnight-forest font-medium text-base px-6 py-3 rounded-act hover:bg-spring-green-600 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Schedule a Consultation
          </button>
        </div>
      </div>
    </div>
  );
};