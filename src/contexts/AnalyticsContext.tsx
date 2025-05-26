/* eslint-disable react-refresh/only-export-components */
import React, { createContext } from 'react';
import { useAnalytics } from '../lib/hooks';

export const AnalyticsContext = createContext<ReturnType<typeof useAnalytics> | undefined>(undefined);

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const analytics = useAnalytics();

  return (
    <AnalyticsContext.Provider value={analytics}>
      {children}
    </AnalyticsContext.Provider>
  );
}

