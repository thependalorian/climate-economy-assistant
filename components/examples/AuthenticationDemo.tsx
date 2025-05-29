/**
 * Authentication Demo Component
 * 
 * Comprehensive demonstration of the enhanced authentication system.
 * Shows practical implementation of all authentication features:
 * - Registration with OTP verification
 * - Login with security monitoring
 * - Profile management with optimistic updates
 * - Security dashboard with real-time alerts
 * - Agent service integration
 * 
 * Located in /components/examples/ for demonstration purposes
 */

import { useState, useEffect, useCallback } from 'react';
import { useAnalyticsContext } from '../../hooks/useAnalyticsContext';
import { enhancedAgentService } from '../../services/enhancedAgentService';

interface AuthenticationDemoProps {
  onClose?: () => void;
}

export function AuthenticationDemo({ onClose }: AuthenticationDemoProps) {
  const [activeTab, setActiveTab] = useState<'register' | 'login' | 'profile' | 'security' | 'agent'>('register');
  const [demoStep, setDemoStep] = useState(1);
  
  const analytics = useAnalyticsContext();
  
  const [registrationData, setRegistrationData] = useState({
    email: 'demo@climatecareers.org',
    password: 'SecurePass123!',
    confirmPassword: 'SecurePass123!',
    userType: 'job_seeker' as const,
    firstName: 'Demo',
    lastName: 'User',
    acceptedTerms: true,
    acceptedPrivacy: true
  });

  const trackDemoUsage = useCallback(() => {
    analytics.trackEngagementEvent('demo_started', 'authentication_demo', {
      step: demoStep,
      tab: activeTab
    });
  }, [analytics, demoStep, activeTab]);

  useEffect(() => {
    trackDemoUsage();
  }, [trackDemoUsage]);

  const simulateRegistration = async () => {
    analytics.trackEngagementEvent('demo_action', 'registration_simulation');
    
    // Simulate the registration flow
    setDemoStep(2);
    setTimeout(() => setDemoStep(3), 2000);
    setTimeout(() => setDemoStep(4), 4000);
  };

  const simulateAgentInteraction = async () => {
    try {
      const result = await enhancedAgentService.sendMessage({
        message: "I'm interested in renewable energy careers. What opportunities are available?",
        context: {
          urgency_level: 'medium',
          user_preferences: {
            target_roles: ['Solar Installer', 'Energy Auditor'],
            career_level: 'entry'
          }
        }
      });

      if (result.success) {
        analytics.trackEngagementEvent('demo_action', 'agent_interaction_success', {
          recommendations_count: result.data?.partner_recommendations.length || 0
        });
      }
    } catch (error) {
      console.error('Demo agent interaction failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="card bg-gradient-to-r from-primary to-secondary text-primary-content mb-6">
          <div className="card-body">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold">Enhanced Authentication Demo</h1>
                <p className="text-lg opacity-90">
                  Interactive demonstration of production-ready authentication features
                </p>
              </div>
              {onClose && (
                <button className="btn btn-ghost btn-circle" onClick={onClose}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="steps w-full mb-6">
          <div className={`step ${demoStep >= 1 ? 'step-primary' : ''}`}>Setup</div>
          <div className={`step ${demoStep >= 2 ? 'step-primary' : ''}`}>Registration</div>
          <div className={`step ${demoStep >= 3 ? 'step-primary' : ''}`}>Verification</div>
          <div className={`step ${demoStep >= 4 ? 'step-primary' : ''}`}>Profile Setup</div>
          <div className={`step ${demoStep >= 5 ? 'step-primary' : ''}`}>Security</div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body p-4">
                <h3 className="card-title text-base">Demo Features</h3>
                <div className="menu menu-compact">
                  {[
                    { id: 'register', label: 'Registration Flow', icon: '👤' },
                    { id: 'login', label: 'Secure Login', icon: '🔐' },
                    { id: 'profile', label: 'Profile Management', icon: '⚙️' },
                    { id: 'security', label: 'Security Dashboard', icon: '🛡️' },
                    { id: 'agent', label: 'Agent Integration', icon: '🤖' }
                  ].map((tab) => (
                    <li key={tab.id}>
                      <a
                        className={activeTab === tab.id ? 'active' : ''}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                      >
                        <span className="text-lg">{tab.icon}</span>
                        {tab.label}
                      </a>
                    </li>
                  ))}
                </div>
              </div>
            </div>

            {/* Stats Card */}
            <div className="card bg-base-100 shadow-xl mt-4">
              <div className="card-body p-4">
                <h4 className="font-bold text-sm">Demo Statistics</h4>
                <div className="stats stats-vertical shadow-sm">
                  <div className="stat py-2">
                    <div className="stat-title text-xs">Security Score</div>
                    <div className="stat-value text-lg text-primary">94/100</div>
                  </div>
                  <div className="stat py-2">
                    <div className="stat-title text-xs">Features Used</div>
                    <div className="stat-value text-lg text-secondary">8/12</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Demo Content */}
          <div className="lg:col-span-3">
            {/* Registration Demo */}
            {activeTab === 'register' && (
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h2 className="card-title">Enhanced Registration Flow</h2>
                  <p className="text-sm text-base-content/70 mb-4">
                    Demonstrates secure registration with OTP verification, validation, and analytics tracking.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Registration Form */}
                    <div>
                      <h3 className="font-bold mb-3">Registration Form</h3>
                      <div className="space-y-3">
                        <div className="form-control">
                          <label className="label label-text text-xs">Email</label>
                          <input
                            type="email"
                            className="input input-bordered input-sm"
                            value={registrationData.email}
                            onChange={(e) => setRegistrationData({ ...registrationData, email: e.target.value })}
                          />
                        </div>
                        <div className="form-control">
                          <label className="label label-text text-xs">Password</label>
                          <input
                            type="password"
                            className="input input-bordered input-sm"
                            value={registrationData.password}
                            readOnly
                          />
                        </div>
                        <div className="form-control">
                          <label className="label label-text text-xs">User Type</label>
                          <select
                            className="select select-bordered select-sm"
                            value={registrationData.userType}
                            onChange={(e) => setRegistrationData({ ...registrationData, userType: e.target.value as typeof registrationData.userType })}
                          >
                            <option value="job_seeker">Job Seeker</option>
                            <option value="partner">Partner Organization</option>
                          </select>
                        </div>
                        <button
                          className="btn btn-primary btn-sm w-full"
                          onClick={simulateRegistration}
                        >
                          Demo Registration
                        </button>
                      </div>
                    </div>

                    {/* Security Features */}
                    <div>
                      <h3 className="font-bold mb-3">Security Features</h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="badge badge-success badge-sm">✓</div>
                          <span className="text-sm">Password validation</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="badge badge-success badge-sm">✓</div>
                          <span className="text-sm">Email verification</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="badge badge-success badge-sm">✓</div>
                          <span className="text-sm">Rate limiting</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="badge badge-success badge-sm">✓</div>
                          <span className="text-sm">Analytics tracking</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="badge badge-success badge-sm">✓</div>
                          <span className="text-sm">GDPR compliance</span>
                        </div>
                      </div>

                      {demoStep >= 2 && (
                        <div className="mt-4 p-3 bg-success/10 rounded-lg">
                          <h4 className="font-bold text-sm text-success">Step {demoStep}: Processing...</h4>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="loading loading-spinner loading-xs"></span>
                            <span className="text-xs">
                              {demoStep === 2 && 'Creating account...'}
                              {demoStep === 3 && 'Sending verification email...'}
                              {demoStep === 4 && 'Account created successfully!'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Dashboard Demo */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="card bg-base-100 shadow-xl">
                  <div className="card-body">
                    <h2 className="card-title">Security Dashboard</h2>
                    <p className="text-sm text-base-content/70 mb-4">
                      Real-time security monitoring and threat detection.
                    </p>

                    {/* Security Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="stat bg-primary/10 rounded-lg p-4">
                        <div className="stat-title text-sm">Security Score</div>
                        <div className="stat-value text-2xl text-primary">94</div>
                        <div className="stat-desc">Excellent</div>
                      </div>
                      <div className="stat bg-secondary/10 rounded-lg p-4">
                        <div className="stat-title text-sm">Active Sessions</div>
                        <div className="stat-value text-2xl text-secondary">1</div>
                        <div className="stat-desc">Current device</div>
                      </div>
                      <div className="stat bg-accent/10 rounded-lg p-4">
                        <div className="stat-title text-sm">Risk Level</div>
                        <div className="stat-value text-2xl text-accent">Low</div>
                        <div className="stat-desc">No threats detected</div>
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="space-y-3">
                      <h3 className="font-bold">Recent Security Events</h3>
                      {[
                        { type: 'login', time: '2 min ago', details: 'Successful login from New York, NY', status: 'success' },
                        { type: 'profile', time: '15 min ago', details: 'Profile updated successfully', status: 'info' },
                        { type: 'password', time: '2 hours ago', details: 'Password strength verified', status: 'success' },
                        { type: 'session', time: '1 day ago', details: 'Previous session expired', status: 'info' }
                      ].map((event, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                          <div className={`w-2 h-2 rounded-full ${
                            event.status === 'success' ? 'bg-success' : 'bg-info'
                          }`}></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{event.details}</p>
                            <p className="text-xs text-base-content/70">{event.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Agent Integration Demo */}
            {activeTab === 'agent' && (
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h2 className="card-title">Enhanced Agent Integration</h2>
                  <p className="text-sm text-base-content/70 mb-4">
                    Demonstrates secure agent communication with analytics tracking.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Sample Conversation */}
                    <div>
                      <h3 className="font-bold mb-3">Sample Conversation</h3>
                      <div className="mockup-window border bg-base-300">
                        <div className="flex justify-center px-4 py-16 bg-base-200">
                          <div className="space-y-4 w-full">
                            <div className="chat chat-end">
                              <div className="chat-bubble chat-bubble-primary">
                                I'm interested in renewable energy careers. What opportunities are available?
                              </div>
                            </div>
                            <div className="chat chat-start">
                              <div className="chat-bubble">
                                Great! Based on our partner ecosystem, I can recommend several opportunities...
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <button
                        className="btn btn-primary btn-sm w-full mt-3"
                        onClick={simulateAgentInteraction}
                      >
                        Test Agent Integration
                      </button>
                    </div>

                    {/* Integration Features */}
                    <div>
                      <h3 className="font-bold mb-3">Integration Features</h3>
                      <div className="space-y-3">
                        <div className="card bg-base-200 shadow-sm">
                          <div className="card-body p-3">
                            <h4 className="text-sm font-bold">🔐 Authenticated Requests</h4>
                            <p className="text-xs">All agent communications are authenticated and secured</p>
                          </div>
                        </div>
                        <div className="card bg-base-200 shadow-sm">
                          <div className="card-body p-3">
                            <h4 className="text-sm font-bold">📊 Analytics Tracking</h4>
                            <p className="text-xs">User interactions and engagement automatically tracked</p>
                          </div>
                        </div>
                        <div className="card bg-base-200 shadow-sm">
                          <div className="card-body p-3">
                            <h4 className="text-sm font-bold">⚡ Error Handling</h4>
                            <p className="text-xs">Robust retry logic and graceful degradation</p>
                          </div>
                        </div>
                        <div className="card bg-base-200 shadow-sm">
                          <div className="card-body p-3">
                            <h4 className="text-sm font-bold">🎯 Partner Ecosystem</h4>
                            <p className="text-xs">Integrated recommendations from verified partners</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Management Demo */}
            {activeTab === 'profile' && (
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h2 className="card-title">Profile Management</h2>
                  <p className="text-sm text-base-content/70 mb-4">
                    Optimistic updates, completion tracking, and real-time validation.
                  </p>

                  <div className="space-y-6">
                    {/* Completion Progress */}
                    <div className="card bg-gradient-to-r from-primary/20 to-secondary/20">
                      <div className="card-body p-4">
                        <h3 className="font-bold">Profile Completion</h3>
                        <div className="flex items-center gap-4">
                          <progress className="progress progress-primary flex-1" value="78" max="100"></progress>
                          <span className="text-lg font-bold">78%</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <div className="badge badge-outline">Missing: Work Experience</div>
                          <div className="badge badge-outline">Missing: Skills Verification</div>
                        </div>
                      </div>
                    </div>

                    {/* Demo Profile Form */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label label-text text-sm">First Name</label>
                        <input type="text" className="input input-bordered input-sm" value="Demo" readOnly />
                      </div>
                      <div className="form-control">
                        <label className="label label-text text-sm">Last Name</label>
                        <input type="text" className="input input-bordered input-sm" value="User" readOnly />
                      </div>
                      <div className="form-control md:col-span-2">
                        <label className="label label-text text-sm">Bio</label>
                        <textarea 
                          className="textarea textarea-bordered text-sm" 
                          rows={2}
                          value="Passionate about renewable energy and sustainable technologies..."
                          readOnly
                        ></textarea>
                      </div>
                    </div>

                    {/* Skills Section */}
                    <div>
                      <h3 className="font-bold mb-3">Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {['Solar Installation', 'Energy Efficiency', 'Project Management', 'Data Analysis'].map((skill) => (
                          <div key={skill} className="badge badge-primary gap-2">
                            {skill}
                            <svg className="w-3 h-3 cursor-pointer" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </div>
                        ))}
                        <button className="btn btn-outline btn-sm">+ Add Skill</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Demo Info Footer */}
        <div className="card bg-base-100 shadow-xl mt-6">
          <div className="card-body p-4">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div>
                <h4 className="font-bold text-sm">Demo Information</h4>
                <p className="text-xs text-base-content/70">
                  This demo showcases the enhanced authentication system with all production features enabled.
                </p>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-outline btn-sm">View Documentation</button>
                <button className="btn btn-primary btn-sm">Start Integration</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 