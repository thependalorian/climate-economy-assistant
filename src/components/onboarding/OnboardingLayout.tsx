import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface OnboardingLayoutProps {
  children: React.ReactNode;
  currentStep: number;
  totalSteps: number;
  title: string;
  description: string;
}

export const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({
  children,
  currentStep,
  totalSteps,
  title,
  description
}) => {
  return (
    <div className="min-h-screen bg-neutral-50 py-12">
      <div className="container mx-auto max-w-3xl">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-sm font-medium text-neutral-600 hover:text-primary-600">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to home
          </Link>
        </div>

        <div className="card p-8">
          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-neutral-600">
                Step {currentStep} of {totalSteps}
              </div>
              <div className="text-sm font-medium text-neutral-600">
                {Math.round((currentStep / totalSteps) * 100)}% Complete
              </div>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-neutral-200">
              <div
                className="h-2 rounded-full bg-spring-green-600"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-neutral-900">{title}</h1>
            <p className="mt-2 text-neutral-600">
              {description}
            </p>
          </div>

          {/* Content */}
          <div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingLayout;
