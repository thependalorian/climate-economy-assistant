import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import App from './App.tsx';
import './index.css';

// Development startup banner
if (import.meta.env.DEV) {
  console.log(
    '%c🌍 Climate Ecosystem Assistant - Development Mode',
    'background: linear-gradient(90deg, #059669, #0891B2); color: white; padding: 12px 24px; border-radius: 8px; font-size: 16px; font-weight: bold;'
  );
  console.log(
    '%cEnvironment: %c' + import.meta.env.MODE,
    'color: #059669; font-weight: bold;',
    'color: #0891B2; font-weight: bold;'
  );
  console.log(
    '%cTracing: %c' + (import.meta.env.VITE_TRACE_ENABLED === 'true' ? 'ENABLED' : 'DISABLED'),
    'color: #059669; font-weight: bold;',
    'color: #0891B2; font-weight: bold;'
  );
  console.log(
    '%cVerbose: %c' + (import.meta.env.VITE_VERBOSE === 'true' ? 'ENABLED' : 'DISABLED'),
    'color: #059669; font-weight: bold;',
    'color: #0891B2; font-weight: bold;'
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);