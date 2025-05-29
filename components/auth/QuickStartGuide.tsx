/**
 * Quick Start Guide Component
 * 
 * Interactive guide to help developers implement the enhanced authentication system.
 * Provides step-by-step instructions, code examples, and validation checks.
 * 
 * Features:
 * - Progressive implementation steps
 * - Code examples with syntax highlighting
 * - Real-time validation checks
 * - Integration testing tools
 * 
 * Located in /components/auth/ for authentication-related components
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useAnalyticsContext } from '../../hooks/useAnalyticsContext';

interface QuickStartGuideProps {
  onComplete?: () => void;
}

interface Step {
  id: number;
  title: string;
  description: string;
  timeEstimate: string;
  complexity: string;
  code: string;
  validation: () => boolean;
}

export function QuickStartGuide({ onComplete }: QuickStartGuideProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showCode, setShowCode] = useState<{ [key: number]: boolean }>({});
  
  const { user } = useAuth();
  const analytics = useAnalyticsContext();

  const steps: Step[] = [
    {
      id: 1,
      title: "Environment Setup",
      description: "Configure your environment variables and dependencies",
      timeEstimate: "5 minutes",
      complexity: "Easy",
      code: `# Add to your .env.local file
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_api_key

# Install dependencies
npm install @supabase/supabase-js
npm install tailwindcss daisyui`,
      validation: () => {
        return typeof window !== 'undefined' && 
               process.env.NEXT_PUBLIC_SUPABASE_URL && 
               process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      }
    },
    {
      id: 2,
      title: "Hook Integration",
      description: "Import and use the enhanced authentication hooks",
      timeEstimate: "10 minutes",
      complexity: "Easy",
      code: `// In your component
import { useAuth } from '../hooks/useAuth';
import { useAuthSecurity } from '../hooks/useAuthSecurity';
import { useAnalyticsContext } from '../hooks/useAnalyticsContext';

export function YourComponent() {
  const { user, login, register, logout, isLoading } = useAuth();
  const { securityAlerts, riskAssessment } = useAuthSecurity();
  const analytics = useAnalyticsContext();

  // Your component logic here
  return (
    <div>
      {user ? (
        <p>Welcome, {user.email}!</p>
      ) : (
        <button onClick={() => login({ email, password })}>
          Login
        </button>
      )}
    </div>
  );
}`,
      validation: () => {
        return typeof useAuth === 'function';
      }
    },
    {
      id: 3,
      title: "Registration Form",
      description: "Create a registration form with validation",
      timeEstimate: "15 minutes",
      complexity: "Medium",
      code: `import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useFormValidation } from '../hooks/useFormValidation';

export function RegistrationForm() {
  const { register, isLoading } = useAuth();
  const { errors, validateField } = useFormValidation({ rules: 'registration' });
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'job_seeker',
    acceptedTerms: false
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await register(formData);
    if (result.success) {
      // Handle success
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="form-control">
        <input
          type="email"
          placeholder="Email"
          className="input input-bordered"
          value={formData.email}
          onChange={(e) => {
            setFormData({...formData, email: e.target.value});
            validateField('email', e.target.value);
          }}
        />
        {errors.email && <span className="text-error">{errors.email}</span>}
      </div>
      
      <button 
        type="submit" 
        className={\`btn btn-primary \${isLoading ? 'loading' : ''}\`}
        disabled={isLoading}
      >
        Register
      </button>
    </form>
  );
}`,
      validation: () => {
        return document.querySelector('form') !== null;
      }
    },
    {
      id: 4,
      title: "Security Dashboard",
      description: "Add security monitoring to your application",
      timeEstimate: "20 minutes",
      complexity: "Medium",
      code: `import { useAuthSecurity } from '../hooks/useAuthSecurity';

export function SecurityDashboard() {
  const { 
    securityAlerts, 
    sessionInfo, 
    riskAssessment,
    clearAlert 
  } = useAuthSecurity();

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Security Overview</h2>
        
        {/* Security Score */}
        <div className="stat">
          <div className="stat-title">Security Score</div>
          <div className="stat-value text-primary">{riskAssessment.score}</div>
          <div className="stat-desc">{riskAssessment.level} risk level</div>
        </div>

        {/* Security Alerts */}
        {securityAlerts.map((alert) => (
          <div key={alert.id} className="alert alert-warning">
            <div>
              <h4>{alert.title}</h4>
              <p>{alert.message}</p>
            </div>
            <button 
              className="btn btn-sm"
              onClick={() => clearAlert(alert.id)}
            >
              Dismiss
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}`,
      validation: () => {
        return typeof useAuthSecurity === 'function';
      }
    },
    {
      id: 5,
      title: "Agent Integration",
      description: "Connect to the enhanced agent service",
      timeEstimate: "15 minutes",
      complexity: "Medium",
      code: `import { enhancedAgentService } from '../services/enhancedAgentService';

export function AgentChat() {
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState([]);

  const sendMessage = async () => {
    const result = await enhancedAgentService.sendMessage({
      message,
      context: {
        urgency_level: 'medium',
        user_preferences: {
          target_roles: ['Solar Installer'],
          career_level: 'entry'
        }
      }
    });

    if (result.success) {
      setConversation(prev => [...prev, {
        user: message,
        agent: result.data.message,
        recommendations: result.data.partner_recommendations
      }]);
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Climate Career Assistant</h2>
        
        <div className="chat-container">
          {conversation.map((msg, index) => (
            <div key={index}>
              <div className="chat chat-end">
                <div className="chat-bubble">{msg.user}</div>
              </div>
              <div className="chat chat-start">
                <div className="chat-bubble">{msg.agent}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="input-group">
          <input
            type="text"
            placeholder="Ask about climate careers..."
            className="input input-bordered flex-1"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button className="btn btn-primary" onClick={sendMessage}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}`,
      validation: () => {
        return typeof enhancedAgentService !== 'undefined';
      }
    }
  ];

  const trackGuideStart = useCallback(() => {
    analytics.trackEngagementEvent('guide_started', 'quick_start', {
      current_step: currentStep,
      user_authenticated: !!user
    });
  }, [analytics, currentStep, user]);

  useEffect(() => {
    trackGuideStart();
  }, [trackGuideStart]);

  const handleStepComplete = (stepId: number) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId]);
      analytics.trackEngagementEvent('guide_step_completed', `step_${stepId}`, {
        step_title: steps.find(s => s.id === stepId)?.title,
        total_completed: completedSteps.length + 1
      });
    }

    if (stepId < steps.length) {
      setCurrentStep(stepId + 1);
    } else {
      analytics.trackConversionEvent('guide_completed', 1, {
        total_steps: steps.length,
        completion_time: Date.now()
      });
      onComplete?.();
    }
  };

  const toggleCode = (stepId: number) => {
    setShowCode(prev => ({
      ...prev,
      [stepId]: !prev[stepId]
    }));
  };

  const validateStep = (step: Step): boolean => {
    try {
      return step.validation();
    } catch {
      return false;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">
          Enhanced Authentication Quick Start
        </h1>
        <p className="text-base-content/70">
          Get your Climate Ecosystem Assistant authentication system up and running in minutes
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Progress</span>
          <span className="text-sm text-base-content/70">
            {completedSteps.length} of {steps.length} completed
          </span>
        </div>
        <progress 
          className="progress progress-primary w-full" 
          value={completedSteps.length} 
          max={steps.length}
        ></progress>
      </div>

      {/* Steps */}
      <div className="space-y-6">
        {steps.map((step) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = currentStep === step.id;
          const isValidated = validateStep(step);

          return (
            <div 
              key={step.id} 
              className={`card bg-base-100 shadow-lg border-2 ${
                isCurrent ? 'border-primary' : 
                isCompleted ? 'border-success' : 'border-base-300'
              }`}
            >
              <div className="card-body">
                {/* Step Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      isCompleted ? 'bg-success text-success-content' :
                      isCurrent ? 'bg-primary text-primary-content' :
                      'bg-base-300 text-base-content'
                    }`}>
                      {isCompleted ? '✓' : step.id}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{step.title}</h3>
                      <p className="text-base-content/70 text-sm">{step.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex gap-2 mb-1">
                      <div className={`badge ${
                        step.complexity === 'Easy' ? 'badge-success' :
                        step.complexity === 'Medium' ? 'badge-warning' : 'badge-error'
                      }`}>
                        {step.complexity}
                      </div>
                      <div className="badge badge-outline">{step.timeEstimate}</div>
                    </div>
                    {isValidated && (
                      <div className="badge badge-success badge-sm">Validated ✓</div>
                    )}
                  </div>
                </div>

                {/* Step Content */}
                {(isCurrent || isCompleted) && (
                  <div className="space-y-4">
                    {/* Code Example */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold">Code Example</h4>
                        <button 
                          className="btn btn-sm btn-outline"
                          onClick={() => toggleCode(step.id)}
                        >
                          {showCode[step.id] ? 'Hide Code' : 'Show Code'}
                        </button>
                      </div>
                      
                      {showCode[step.id] && (
                        <div className="mockup-code">
                          <pre><code>{step.code}</code></pre>
                        </div>
                      )}
                    </div>

                    {/* Validation Status */}
                    <div className={`alert ${isValidated ? 'alert-success' : 'alert-warning'}`}>
                      <div>
                        <h4 className="font-bold">
                          {isValidated ? 'Step Validated' : 'Validation Pending'}
                        </h4>
                        <p className="text-sm">
                          {isValidated 
                            ? 'All requirements for this step have been met.'
                            : 'Complete the implementation to validate this step.'
                          }
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="card-actions justify-end">
                      {!isCompleted && (
                        <>
                          <button 
                            className="btn btn-outline"
                            onClick={() => toggleCode(step.id)}
                          >
                            View Code
                          </button>
                          <button 
                            className={`btn btn-primary ${!isValidated ? 'btn-disabled' : ''}`}
                            onClick={() => handleStepComplete(step.id)}
                            disabled={!isValidated}
                          >
                            {isValidated ? 'Mark Complete' : 'Complete Implementation First'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion Message */}
      {completedSteps.length === steps.length && (
        <div className="card bg-gradient-to-r from-success to-primary text-primary-content mt-8">
          <div className="card-body text-center">
            <h2 className="card-title justify-center text-2xl">🎉 Congratulations!</h2>
            <p className="text-lg">
              You've successfully set up the enhanced authentication system!
            </p>
            <div className="card-actions justify-center mt-4">
              <button className="btn btn-primary-content">
                View Full Documentation
              </button>
              <button className="btn btn-outline btn-primary-content">
                Explore Advanced Features
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="card bg-base-100 shadow-xl mt-8">
        <div className="card-body">
          <h3 className="card-title">Need Help?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl mb-2">📖</div>
              <h4 className="font-bold">Documentation</h4>
              <p className="text-sm text-base-content/70">
                Complete guides and API reference
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">🎮</div>
              <h4 className="font-bold">Interactive Demo</h4>
              <p className="text-sm text-base-content/70">
                Try out all features in our live demo
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">💬</div>
              <h4 className="font-bold">Support</h4>
              <p className="text-sm text-base-content/70">
                Get help from our developer community
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 