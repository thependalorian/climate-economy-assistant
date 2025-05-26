import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import FeedbackForm from './FeedbackForm';

interface FeedbackButtonProps {
  sourcePage?: string;
  className?: string;
  variant?: 'floating' | 'inline';
}

const FeedbackButton: React.FC<FeedbackButtonProps> = ({ 
  sourcePage, 
  className = '',
  variant = 'floating'
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);

  const baseClasses = variant === 'floating'
    ? 'fixed bottom-6 right-6 bg-primary-600 hover:bg-primary-700 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 z-40'
    : 'inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-primary-600 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500';

  return (
    <>
      <button
        onClick={() => setIsFormOpen(true)}
        className={`${baseClasses} ${className}`}
        title="Share Feedback"
      >
        <MessageSquare className={variant === 'floating' ? 'h-6 w-6' : 'h-4 w-4 mr-2'} />
        {variant === 'inline' && 'Feedback'}
      </button>

      <FeedbackForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        sourcePage={sourcePage}
      />
    </>
  );
};

export default FeedbackButton;
