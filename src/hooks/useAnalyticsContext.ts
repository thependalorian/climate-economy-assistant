import { useContext } from 'react';
import { AnalyticsContext } from '../contexts/AnalyticsContext';

export function useAnalyticsContext() {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalyticsContext must be used within an AnalyticsProvider');
  }
  return context;
}
