// @ts-nocheck
/**
 * Enhanced Authentication Middleware for Supabase Edge Functions
 * 
 * Production-ready middleware that provides:
 * - JWT token validation with enhanced security
 * - Rate limiting and abuse prevention
 * - Request logging and analytics
 * - Error handling and graceful degradation
 * - CORS handling for Vercel deployment
 * 
 * Location: supabase/functions/_shared/auth-middleware.ts
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Deno type declarations
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface AuthenticatedUser {
  id: string;
  email: string;
  user_type: 'job_seeker' | 'partner' | 'admin';
  profile_completed: boolean;
  created_at: string;
}

interface RequestContext {
  user: AuthenticatedUser;
  ipAddress: string;
  userAgent: string;
  requestId: string;
  timestamp: Date;
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
}

interface AuthMiddlewareOptions {
  requireAuth?: boolean;
  allowedUserTypes?: ('job_seeker' | 'partner' | 'admin')[];
  requireProfileComplete?: boolean;
  rateLimit?: RateLimitConfig;
  skipRateLimit?: boolean;
}

// ============================================================================
// RATE LIMITING STORE (In-memory for Edge Functions)
// ============================================================================

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function cleanupExpiredRateLimit() {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

function checkRateLimit(identifier: string, config: RateLimitConfig): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  cleanupExpiredRateLimit();
  
  const now = Date.now();
  const key = identifier;
  const existing = rateLimitStore.get(key);
  
  if (!existing || now > existing.resetTime) {
    // New window
    const resetTime = now + config.windowMs;
    rateLimitStore.set(key, { count: 1, resetTime });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime
    };
  }
  
  if (existing.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: existing.resetTime
    };
  }
  
  existing.count++;
  rateLimitStore.set(key, existing);
  
  return {
    allowed: true,
    remaining: config.maxRequests - existing.count,
    resetTime: existing.resetTime
  };
}

// ============================================================================
// AUTHENTICATION HELPERS
// ============================================================================

function getClientInfo(request: Request): { ipAddress: string; userAgent: string } {
  const ipAddress = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   '127.0.0.1';
  
  const userAgent = request.headers.get('user-agent') || 'Unknown';
  
  return { ipAddress, userAgent };
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function validateAuthToken(
  authHeader: string | null,
  supabase: { auth: { getUser: (token: string) => Promise<{ data: { user: unknown }; error: unknown }>; }; from: (table: string) => { select: (fields: string) => { eq: (field: string, value: string) => { single: () => Promise<{ data: unknown; error: unknown }> } } } }
): Promise<{ user: AuthenticatedUser | null; error?: string }> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: 'Missing or invalid authorization header' };
  }

  const token = authHeader.substring(7);
  
  try {
    // Verify JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return { user: null, error: 'Invalid or expired token' };
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_type, profile_completed, created_at')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.warn('Profile fetch failed:', profileError);
      // Continue with minimal user data
      return {
        user: {
          id: user.id,
          email: user.email || '',
          user_type: 'job_seeker', // Default fallback
          profile_completed: false,
          created_at: user.created_at
        }
      };
    }

    return {
      user: {
        id: user.id,
        email: user.email || '',
        user_type: profile.user_type,
        profile_completed: profile.profile_completed,
        created_at: profile.created_at
      }
    };
  } catch (error) {
    console.error('Auth validation error:', error);
    return { user: null, error: 'Authentication service unavailable' };
  }
}

// ============================================================================
// CORS HELPER
// ============================================================================

function createCORSHeaders(): Headers {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-client-info');
  headers.set('Access-Control-Max-Age', '86400');
  return headers;
}

function handleCORSPreflight(): Response {
  return new Response(null, {
    status: 200,
    headers: createCORSHeaders()
  });
}

// ============================================================================
// SECURITY EVENT LOGGING
// ============================================================================

async function logSecurityEvent(
  supabase: { from: (table: string) => { insert: (data: unknown) => Promise<unknown> } },
  eventType: string,
  context: RequestContext,
  metadata?: Record<string, unknown>
) {
  try {
    await supabase
      .from('security_events')
      .insert({
        user_id: context.user?.id || null,
        event_type: eventType,
        ip_address: context.ipAddress,
        user_agent: context.userAgent,
        request_id: context.requestId,
        metadata: {
          timestamp: context.timestamp.toISOString(),
          ...metadata
        },
        risk_level: 'low'
      });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

// ============================================================================
// MAIN MIDDLEWARE FUNCTION
// ============================================================================

export async function authMiddleware(
  request: Request,
  options: AuthMiddlewareOptions = {}
): Promise<{
  success: boolean;
  context?: RequestContext;
  response?: Response;
  error?: string;
}> {
  const {
    requireAuth = true,
    allowedUserTypes = ['job_seeker', 'partner', 'admin'],
    requireProfileComplete = false,
    rateLimit = { windowMs: 15 * 60 * 1000, maxRequests: 100 }, // 15 minutes, 100 requests
    skipRateLimit = false
  } = options;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return {
      success: false,
      response: handleCORSPreflight()
    };
  }

  // Initialize Supabase client
  const supabaseUrl = Deno.env.get('DATABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('DATABASE_SERVICE_ROLE_KEY') || '';
  
  if (!supabaseUrl || !supabaseServiceKey) {
    return {
      success: false,
      response: new Response(
        JSON.stringify({ error: 'Service configuration error' }),
        { 
          status: 500,
          headers: { ...Object.fromEntries(createCORSHeaders()), 'Content-Type': 'application/json' }
        }
      ),
      error: 'Missing Supabase configuration'
    };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Get client info
  const { ipAddress, userAgent } = getClientInfo(request);
  const requestId = generateRequestId();
  const timestamp = new Date();

  try {
    // Authentication check
    let user: AuthenticatedUser | null = null;
    
    if (requireAuth) {
      const authHeader = request.headers.get('Authorization');
      const authResult = await validateAuthToken(authHeader, supabase);
      
      if (!authResult.user) {
        await logSecurityEvent(supabase, 'unauthorized_access', {
          user: null as unknown as AuthenticatedUser,
          ipAddress,
          userAgent,
          requestId,
          timestamp
        }, { error: authResult.error });

        return {
          success: false,
          response: new Response(
            JSON.stringify({ error: authResult.error || 'Unauthorized' }),
            { 
              status: 401,
              headers: { ...Object.fromEntries(createCORSHeaders()), 'Content-Type': 'application/json' }
            }
          ),
          error: authResult.error
        };
      }
      
      user = authResult.user;

      // Check user type permissions
      if (!allowedUserTypes.includes(user.user_type)) {
        await logSecurityEvent(supabase, 'forbidden_access', {
          user,
          ipAddress,
          userAgent,
          requestId,
          timestamp
        }, { requiredUserTypes: allowedUserTypes });

        return {
          success: false,
          response: new Response(
            JSON.stringify({ error: 'Insufficient permissions' }),
            { 
              status: 403,
              headers: { ...Object.fromEntries(createCORSHeaders()), 'Content-Type': 'application/json' }
            }
          ),
          error: 'Insufficient permissions'
        };
      }

      // Check profile completion requirement
      if (requireProfileComplete && !user.profile_completed) {
        return {
          success: false,
          response: new Response(
            JSON.stringify({ 
              error: 'Profile completion required',
              redirect: '/onboarding'
            }),
            { 
              status: 403,
              headers: { ...Object.fromEntries(createCORSHeaders()), 'Content-Type': 'application/json' }
            }
          ),
          error: 'Profile completion required'
        };
      }
    }

    // Rate limiting check
    if (!skipRateLimit && rateLimit) {
      const identifier = user?.id || ipAddress;
      const rateLimitResult = checkRateLimit(identifier, rateLimit);
      
      if (!rateLimitResult.allowed) {
        await logSecurityEvent(supabase, 'rate_limit_exceeded', {
          user: user as unknown as AuthenticatedUser,
          ipAddress,
          userAgent,
          requestId,
          timestamp
        }, { rateLimitConfig: rateLimit });

        return {
          success: false,
          response: new Response(
            JSON.stringify({ 
              error: 'Rate limit exceeded',
              resetTime: new Date(rateLimitResult.resetTime).toISOString()
            }),
            { 
              status: 429,
              headers: { 
                ...Object.fromEntries(createCORSHeaders()),
                'Content-Type': 'application/json',
                'X-RateLimit-Limit': rateLimit.maxRequests.toString(),
                'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
                'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
              }
            }
          ),
          error: 'Rate limit exceeded'
        };
      }
    }

    // Create request context
    const context: RequestContext = {
      user: user as AuthenticatedUser,
      ipAddress,
      userAgent,
      requestId,
      timestamp
    };

    // Log successful request
    if (user) {
      await logSecurityEvent(supabase, 'api_access', context, {
        method: request.method,
        url: request.url
      });
    }

    return {
      success: true,
      context
    };

  } catch (error) {
    console.error('Middleware error:', error);
    
    return {
      success: false,
      response: new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { 
          status: 500,
          headers: { ...Object.fromEntries(createCORSHeaders()), 'Content-Type': 'application/json' }
        }
      ),
      error: 'Internal server error'
    };
  }
}

// ============================================================================
// RESPONSE HELPERS
// ============================================================================

export function createSuccessResponse(
  data: unknown,
  status: number = 200,
  additionalHeaders?: Record<string, string>
): Response {
  const headers = {
    ...Object.fromEntries(createCORSHeaders()),
    'Content-Type': 'application/json',
    ...additionalHeaders
  };

  return new Response(
    JSON.stringify({ success: true, data }),
    { status, headers }
  );
}

export function createErrorResponse(
  error: string,
  status: number = 400,
  additionalHeaders?: Record<string, string>
): Response {
  const headers = {
    ...Object.fromEntries(createCORSHeaders()),
    'Content-Type': 'application/json',
    ...additionalHeaders
  };

  return new Response(
    JSON.stringify({ success: false, error }),
    { status, headers }
  );
}

// Export types for use in other functions
export type { AuthenticatedUser, RequestContext, AuthMiddlewareOptions }; 