import React, { useState } from 'react';
import { Star, Send, X } from 'lucide-react';
import { submitFeedback } from '../../services/feedbackService';
import { useAuth } from '../../hooks/useAuth';

interface FeedbackFormProps {
  isOpen: boolean;
  onClose: () => void;
  sourcePage?: string;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ isOpen, onClose, sourcePage }) => {
  const { user } = useAuth();
  const [feedbackType, setFeedbackType] = useState<'general' | 'feature' | 'bug' | 'content' | 'other'>('general');
  const [content, setContent] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) return;

    setSubmitting(true);

    try {
      await submitFeedback(
        user?.id || null,
        feedbackType,
        content,
        rating || undefined,
        sourcePage
      );

      setSubmitted(true);

      // Reset form after a delay
      setTimeout(() => {
        setSubmitted(false);
        setContent('');
        setRating(null);
        setFeedbackType('general');
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRatingClick = (value: number) => {
    setRating(value);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h3 className="text-lg font-medium text-neutral-900">
            Share Your Feedback
          </h3>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <Send className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">
              Thank you for your feedback!
            </h3>
            <p className="text-sm text-neutral-600">
              Your feedback helps us improve the platform.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6">
            {/* Feedback Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Feedback Type
              </label>
              <select
                value={feedbackType}
                onChange={(e) => setFeedbackType(e.target.value as 'general' | 'feature' | 'bug' | 'improvement')}
                className="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="general">General Feedback</option>
                <option value="feature">Feature Request</option>
                <option value="bug">Bug Report</option>
                <option value="content">Content Feedback</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Rating */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Overall Rating (Optional)
              </label>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleRatingClick(value)}
                    className={`p-1 rounded ${
                      rating && value <= rating
                        ? 'text-yellow-400'
                        : 'text-neutral-300 hover:text-yellow-400'
                    }`}
                  >
                    <Star className="h-6 w-6 fill-current" />
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Your Feedback
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                placeholder="Please share your thoughts, suggestions, or report any issues..."
                className="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-md hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !content.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default FeedbackForm;
