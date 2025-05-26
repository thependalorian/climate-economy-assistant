import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';
import { PartnerDashboardRouter } from '../components/dashboard/PartnerDashboardRouter';

// Import all partner dashboard components
import { PartnerDashboardHome } from './partner-dashboard/PartnerDashboardHome';
import { PartnerJobsPage } from './partner-dashboard/PartnerJobsPage';
import { PartnerProgramsPage } from './partner-dashboard/PartnerProgramsPage';
import { PartnerCandidatesPage } from './partner-dashboard/PartnerCandidatesPage';
import { PartnerAnalyticsPage } from './partner-dashboard/PartnerAnalyticsPage';
import { PartnerSettingsPage } from './partner-dashboard/PartnerSettingsPage';

export const PartnerDashboard: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<PartnerDashboardRouter />}>
        <Route index element={<PartnerDashboardHome />} />
        <Route path="jobs" element={<PartnerJobsPage />} />
        <Route path="programs" element={<PartnerProgramsPage />} />
        <Route path="candidates" element={<PartnerCandidatesPage />} />
        <Route path="analytics" element={<PartnerAnalyticsPage />} />
        <Route path="settings" element={<PartnerSettingsPage />} />
        <Route path="profile" element={<PartnerSettingsPage />} />
        <Route path="help" element={
          <div className="container section">
            <div className="card act-bracket p-8 text-center">
              <div className="w-16 h-16 bg-seafoam-blue-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <HelpCircle className="h-8 w-8 text-midnight-forest" />
              </div>
              <h2 className="font-display font-medium text-2xl text-midnight-forest mb-3 tracking-act-tight leading-act-tight">
                Partner Help & Support
              </h2>
              <p className="font-body text-midnight-forest-600 tracking-act-tight leading-act-normal">
                Get help with your partner account and platform features.
              </p>
              <div className="mt-6 space-y-4">
                <button className="btn-primary">
                  Contact Support
                </button>
                <button className="btn-outline">
                  View Documentation
                </button>
              </div>
            </div>
          </div>
        } />
      </Route>
    </Routes>
  );
};