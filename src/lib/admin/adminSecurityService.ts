/**
 * Admin Security Service
 * 
 * Comprehensive admin tools for managing all user types:
 * - Job seeker management and verification
 * - Partner verification and approval
 * - Admin user management
 * - Security monitoring and audit tools
 * - GDPR/CCPA compliance management
 */

import { supabase } from '../supabase';
import { logSecurityEvent } from '../security/userSecurity';
// Import types for future use
// import type { 
//   UnifiedUserProfile, 
//   UnifiedJobSeekerProfile, 
//   UnifiedPartnerProfile,
//   UnifiedAdminProfile 
// } from '../../types/unified';

export interface AdminPermissions {
  canManageUsers: boolean;
  canManagePartners: boolean;
  canViewAuditLogs: boolean;
  canManageContent: boolean;
  canManageSystem: boolean;
  canExportData: boolean;
  canDeleteAccounts: boolean;
}

export interface UserManagementFilters {
  userType?: 'job_seeker' | 'partner' | 'admin';
  verified?: boolean;
  createdAfter?: string;
  createdBefore?: string;
  lastLoginAfter?: string;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  searchTerm?: string;
}

export interface AdminDashboardStats {
  totalUsers: number;
  totalJobSeekers: number;
  totalPartners: number;
  totalAdmins: number;
  pendingVerifications: number;
  highRiskEvents: number;
  newUsersToday: number;
  activeUsersToday: number;
  gdprRequests: number;
}

export interface SecurityAlert {
  id: string;
  type: 'suspicious_login' | 'multiple_failed_attempts' | 'unusual_activity' | 'data_breach_attempt';
  userId: string;
  userEmail: string;
  description: string;
  riskLevel: 'medium' | 'high' | 'critical';
  createdAt: string;
  resolved: boolean;
}

/**
 * Check if user has admin permissions
 */
export async function checkAdminPermissions(userId: string): Promise<{ isAdmin: boolean; permissions?: AdminPermissions }> {
  try {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', userId)
      .single();

    if (error || !profile || profile.user_type !== 'admin') {
      return { isAdmin: false };
    }

    const { data: adminProfile, error: adminError } = await supabase
      .from('admin_profiles')
      .select('permissions')
      .eq('id', userId)
      .single();

    if (adminError || !adminProfile) {
      return { isAdmin: false };
    }

    // Parse permissions from array to boolean flags
    const permissions: AdminPermissions = {
      canManageUsers: adminProfile.permissions?.includes('manage_users') || false,
      canManagePartners: adminProfile.permissions?.includes('manage_partners') || false,
      canViewAuditLogs: adminProfile.permissions?.includes('view_audit_logs') || false,
      canManageContent: adminProfile.permissions?.includes('manage_content') || false,
      canManageSystem: adminProfile.permissions?.includes('manage_system') || false,
      canExportData: adminProfile.permissions?.includes('export_data') || false,
      canDeleteAccounts: adminProfile.permissions?.includes('delete_accounts') || false,
    };

    return { isAdmin: true, permissions };
  } catch (err) {
    console.error('Admin permission check failed:', err);
    return { isAdmin: false };
  }
}

/**
 * Get admin dashboard statistics
 */
export async function getAdminDashboardStats(adminId: string): Promise<{ success: boolean; stats?: AdminDashboardStats; error?: string }> {
  try {
    const permissionCheck = await checkAdminPermissions(adminId);
    if (!permissionCheck.isAdmin || !permissionCheck.permissions?.canViewAuditLogs) {
      return { success: false, error: 'Insufficient permissions' };
    }

    const today = new Date().toISOString().split('T')[0];

    // Get user counts
    const { data: userCounts } = await supabase
      .from('user_profiles')
      .select('user_type')
      .not('user_type', 'is', null);

    const totalUsers = userCounts?.length || 0;
    const totalJobSeekers = userCounts?.filter(u => u.user_type === 'job_seeker').length || 0;
    const totalPartners = userCounts?.filter(u => u.user_type === 'partner').length || 0;
    const totalAdmins = userCounts?.filter(u => u.user_type === 'admin').length || 0;

    // Get pending partner verifications
    const { data: pendingPartners } = await supabase
      .from('partner_profiles')
      .select('id')
      .eq('verified', false);

    // Get high-risk security events
    const { data: highRiskEvents } = await supabase
      .from('security_events')
      .select('id')
      .in('risk_level', ['high', 'critical'])
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    // Get new users today
    const { data: newUsers } = await supabase
      .from('user_profiles')
      .select('id')
      .gte('created_at', today);

    // Get active users today (users with login events)
    const { data: activeUsers } = await supabase
      .from('security_events')
      .select('user_id')
      .eq('event_type', 'login_success')
      .gte('created_at', today);

    // Get GDPR requests
    const { data: gdprRequests } = await supabase
      .from('account_deletion_requests')
      .select('id')
      .eq('status', 'pending');

    const stats: AdminDashboardStats = {
      totalUsers,
      totalJobSeekers,
      totalPartners,
      totalAdmins,
      pendingVerifications: pendingPartners?.length || 0,
      highRiskEvents: highRiskEvents?.length || 0,
      newUsersToday: newUsers?.length || 0,
      activeUsersToday: new Set(activeUsers?.map(u => u.user_id)).size || 0,
      gdprRequests: gdprRequests?.length || 0
    };

    return { success: true, stats };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Get users with filtering and pagination
 */
export async function getUsers(
  adminId: string,
  filters: UserManagementFilters = {},
  page: number = 1,
  limit: number = 50
): Promise<{ success: boolean; users?: Record<string, unknown>[]; total?: number; error?: string }> {
  try {
    const permissionCheck = await checkAdminPermissions(adminId);
    if (!permissionCheck.isAdmin || !permissionCheck.permissions?.canManageUsers) {
      return { success: false, error: 'Insufficient permissions' };
    }

    let query = supabase
      .from('user_profiles')
      .select(`
        *,
        job_seeker_profiles(*),
        partner_profiles(*),
        admin_profiles(*)
      `);

    // Apply filters
    if (filters.userType) {
      query = query.eq('user_type', filters.userType);
    }

    if (filters.createdAfter) {
      query = query.gte('created_at', filters.createdAfter);
    }

    if (filters.createdBefore) {
      query = query.lte('created_at', filters.createdBefore);
    }

    if (filters.searchTerm) {
      query = query.or(`first_name.ilike.%${filters.searchTerm}%,last_name.ilike.%${filters.searchTerm}%,email.ilike.%${filters.searchTerm}%`);
    }

    // Get total count
    const countQuery = supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });
    
    // Apply same filters for count
    if (filters.userType) {
      countQuery.eq('user_type', filters.userType);
    }
    if (filters.createdAfter) {
      countQuery.gte('created_at', filters.createdAfter);
    }
    if (filters.createdBefore) {
      countQuery.lte('created_at', filters.createdBefore);
    }
    if (filters.searchTerm) {
      countQuery.or(`first_name.ilike.%${filters.searchTerm}%,last_name.ilike.%${filters.searchTerm}%,email.ilike.%${filters.searchTerm}%`);
    }
    
    const { count } = await countQuery;

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: users, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, users: users || [], total: count || 0 };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Verify partner account
 */
export async function verifyPartner(
  adminId: string,
  partnerId: string,
  verified: boolean,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const permissionCheck = await checkAdminPermissions(adminId);
    if (!permissionCheck.isAdmin || !permissionCheck.permissions?.canManagePartners) {
      return { success: false, error: 'Insufficient permissions' };
    }

    const { error } = await supabase
      .from('partner_profiles')
      .update({ 
        verified,
        updated_at: new Date().toISOString()
      })
      .eq('id', partnerId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Log the verification action
    await logSecurityEvent(
      adminId,
      'profile_updated',
      '127.0.0.1', // Admin action
      'Admin Dashboard',
      { 
        action: 'partner_verification',
        partnerId,
        verified,
        notes
      },
      'low'
    );

    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Suspend or unsuspend user account
 */
export async function suspendUser(
  adminId: string,
  userId: string,
  suspended: boolean,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const permissionCheck = await checkAdminPermissions(adminId);
    if (!permissionCheck.isAdmin || !permissionCheck.permissions?.canManageUsers) {
      return { success: false, error: 'Insufficient permissions' };
    }

    // Update user profile with suspension status
    const { error } = await supabase
      .from('user_profiles')
      .update({ 
        suspended,
        suspension_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Log the suspension action
    await logSecurityEvent(
      adminId,
      suspended ? 'account_locked' : 'account_unlocked',
      '127.0.0.1',
      'Admin Dashboard',
      { 
        action: suspended ? 'user_suspended' : 'user_unsuspended',
        targetUserId: userId,
        reason
      },
      suspended ? 'medium' : 'low'
    );

    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Get security alerts for admin dashboard
 */
export async function getSecurityAlerts(
  adminId: string,
  limit: number = 20
): Promise<{ success: boolean; alerts?: SecurityAlert[]; error?: string }> {
  try {
    const permissionCheck = await checkAdminPermissions(adminId);
    if (!permissionCheck.isAdmin || !permissionCheck.permissions?.canViewAuditLogs) {
      return { success: false, error: 'Insufficient permissions' };
    }

    // Get high-risk security events from the last 7 days
    const { data: events, error } = await supabase
      .from('security_events')
      .select(`
        id,
        user_id,
        event_type,
        details,
        risk_level,
        created_at
      `)
      .in('risk_level', ['medium', 'high', 'critical'])
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { success: false, error: error.message };
    }

    // Get user emails for the alerts
    const userIds = [...new Set(events?.map(e => e.user_id) || [])];
    const { data: users } = await supabase
      .from('user_profiles')
      .select('id, email')
      .in('id', userIds);

    const userEmailMap = new Map(users?.map(u => [u.id, u.email]) || []);

    const alerts: SecurityAlert[] = events?.map(event => ({
      id: event.id,
      type: mapEventTypeToAlertType(event.event_type),
      userId: event.user_id,
      userEmail: userEmailMap.get(event.user_id) || 'Unknown',
      description: generateAlertDescription(event),
      riskLevel: event.risk_level as 'medium' | 'high' | 'critical',
      createdAt: event.created_at,
      resolved: false
    })) || [];

    return { success: true, alerts };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Export user data for admin purposes
 */
export async function adminExportUserData(
  adminId: string,
  targetUserId: string,
  reason: string
): Promise<{ success: boolean; downloadUrl?: string; error?: string }> {
  try {
    const permissionCheck = await checkAdminPermissions(adminId);
    if (!permissionCheck.isAdmin || !permissionCheck.permissions?.canExportData) {
      return { success: false, error: 'Insufficient permissions' };
    }

    // Log the admin data export
    await logSecurityEvent(
      adminId,
      'data_exported',
      '127.0.0.1',
      'Admin Dashboard',
      { 
        action: 'admin_data_export',
        targetUserId,
        reason
      },
      'medium'
    );

    // Use the existing export function
    const { exportUserData } = await import('../userManagement/userDataService');
    const result = await exportUserData(targetUserId, 'json', '127.0.0.1', 'Admin Dashboard');

    return result;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Create new admin user
 */
export async function createAdminUser(
  creatorAdminId: string,
  adminData: {
    email: string;
    firstName: string;
    lastName: string;
    permissions: string[];
    department?: string;
  }
): Promise<{ success: boolean; adminId?: string; error?: string }> {
  try {
    const permissionCheck = await checkAdminPermissions(creatorAdminId);
    if (!permissionCheck.isAdmin || !permissionCheck.permissions?.canManageSystem) {
      return { success: false, error: 'Insufficient permissions' };
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminData.email,
      email_confirm: true,
      user_metadata: {
        first_name: adminData.firstName,
        last_name: adminData.lastName,
        user_type: 'admin'
      }
    });

    if (authError || !authData.user) {
      return { success: false, error: 'Failed to create admin user' };
    }

    const adminId = authData.user.id;

    // Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: adminId,
        email: adminData.email,
        first_name: adminData.firstName,
        last_name: adminData.lastName,
        user_type: 'admin',
        profile_completed: true
      });

    if (profileError) {
      await supabase.auth.admin.deleteUser(adminId);
      return { success: false, error: 'Failed to create admin profile' };
    }

    // Create admin profile
    const { error: adminProfileError } = await supabase
      .from('admin_profiles')
      .insert({
        id: adminId,
        permissions: adminData.permissions,
        department: adminData.department
      });

    if (adminProfileError) {
      await supabase.auth.admin.deleteUser(adminId);
      return { success: false, error: 'Failed to create admin profile' };
    }

    // Log admin creation
    await logSecurityEvent(
      creatorAdminId,
      'profile_updated',
      '127.0.0.1',
      'Admin Dashboard',
      { 
        action: 'admin_user_created',
        newAdminId: adminId,
        permissions: adminData.permissions
      },
      'medium'
    );

    return { success: true, adminId };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

// Helper functions
function mapEventTypeToAlertType(eventType: string): SecurityAlert['type'] {
  switch (eventType) {
    case 'login_failed':
      return 'multiple_failed_attempts';
    case 'suspicious_activity':
      return 'suspicious_login';
    default:
      return 'unusual_activity';
  }
}

function generateAlertDescription(event: Record<string, unknown>): string {
  const eventType = event.event_type as string;
  const details = event.details as Record<string, unknown> | undefined;
  
  switch (eventType) {
    case 'login_failed':
      return `Multiple failed login attempts detected`;
    case 'suspicious_activity':
      return `Suspicious activity detected: ${details?.description || 'Unknown'}`;
    default:
      return `Security event: ${eventType}`;
  }
} 