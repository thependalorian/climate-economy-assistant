// @ts-nocheck
/**
 * Test Suite for Authentication Components
 * 
 * Tests for OTPVerification and AuthRedirect components
 * Demonstrates testing patterns for production-ready components
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock modules
vi.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }))
    }
  }
}));

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: null,
    profile: null,
    isLoading: false,
    refreshSession: vi.fn()
  }))
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(() => vi.fn()),
    useLocation: vi.fn(() => ({ search: '' }))
  };
});

import { LoginForm } from '../LoginForm';
import { RegistrationForm } from '../RegistrationForm';
import { AuthCallback } from '../AuthCallback';

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Authentication Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('LoginForm Component', () => {
    it('renders correctly', () => {
      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      );

      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });
  });

  describe('RegistrationForm Component', () => {
    it('renders correctly', () => {
      render(
        <TestWrapper>
          <RegistrationForm />
        </TestWrapper>
      );

      expect(screen.getByText('Create Account')).toBeInTheDocument();
    });
  });

  describe('AuthCallback Component', () => {
    it('renders loading state', () => {
      render(
        <TestWrapper>
          <AuthCallback />
        </TestWrapper>
      );

      expect(screen.getByText('Completing authentication...')).toBeInTheDocument();
    });
  });
}); 