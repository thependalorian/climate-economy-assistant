import { supabase } from '../lib/supabase';
import { models } from '../agents';

/**
 * This service handles administrative functions
 * for the Climate Ecosystem Assistant platform.
 */

/**
 * Get all admin users
 * @returns A promise that resolves to an array of admin users
 */
export const getAdminUsers = async (): Promise<models.AdminUserType[]> => {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(user => ({
      ...user,
      created_at: new Date(user.created_at),
      updated_at: new Date(user.updated_at)
    }));
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return [];
  }
};

/**
 * Get system configuration
 * @param configKey Optional specific configuration key to retrieve
 * @returns A promise that resolves to an array of system configurations
 */
export const getSystemConfig = async (
  configKey?: string
): Promise<models.SystemConfigType[]> => {
  try {
    let query = supabase
      .from('system_config')
      .select('*');

    if (configKey) {
      query = query.eq('config_key', configKey);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map(config => ({
      ...config,
      created_at: new Date(config.created_at),
      updated_at: new Date(config.updated_at)
    }));
  } catch (error) {
    console.error('Error fetching system config:', error);
    return [];
  }
};

/**
 * Update system configuration
 * @param configKey The configuration key
 * @param configValue The configuration value
 * @param description The configuration description
 * @param updatedBy The ID of the admin user making the update
 * @returns A promise that resolves to the updated configuration
 */
export const updateSystemConfig = async (
  configKey: string,
  configValue: unknown,
  description: string,
  updatedBy: string
): Promise<models.SystemConfigType | null> => {
  try {
    // Check if the config exists
    const { data: existingConfig, error: checkError } = await supabase
      .from('system_config')
      .select('id')
      .eq('config_key', configKey)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    let result;

    if (existingConfig) {
      // Update existing config
      const { data, error } = await supabase
        .from('system_config')
        .update({
          config_value: configValue,
          description,
          updated_by: updatedBy,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingConfig.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new config
      const { data, error } = await supabase
        .from('system_config')
        .insert([
          {
            config_key: configKey,
            config_value: configValue,
            description,
            updated_by: updatedBy,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    // Log the action
    await createAuditLog(
      updatedBy,
      existingConfig ? 'update' : 'create',
      'system_config',
      result.id,
      {
        config_key: configKey,
        previous_value: existingConfig ? existingConfig.config_value : null,
        new_value: configValue
      }
    );

    return {
      ...result,
      created_at: new Date(result.created_at),
      updated_at: new Date(result.updated_at)
    };
  } catch (error) {
    console.error('Error updating system config:', error);
    return null;
  }
};

/**
 * Create an audit log entry
 * @param userId The ID of the user performing the action
 * @param action The action performed
 * @param entityType The type of entity affected
 * @param entityId The ID of the entity affected
 * @param details Additional details about the action
 * @returns A promise that resolves to the created audit log
 */
export const createAuditLog = async (
  userId: string,
  action: string,
  entityType: string,
  entityId?: string,
  details: Record<string, unknown> = {}
): Promise<models.AuditLogType | null> => {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .insert([
        {
          user_id: userId,
          action,
          entity_type: entityType,
          entity_id: entityId,
          details,
          ip_address: null, // In a real app, this would be the user's IP
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      created_at: new Date(data.created_at)
    };
  } catch (error) {
    console.error('Error creating audit log:', error);
    return null;
  }
};

/**
 * Get audit logs
 * @param filters Optional filters to apply
 * @param limit Maximum number of logs to return
 * @param offset Number of logs to skip (for pagination)
 * @returns A promise that resolves to an array of audit logs
 */
export const getAuditLogs = async (
  filters: Record<string, unknown> = {},
  limit = 50,
  offset = 0
): Promise<models.AuditLogType[]> => {
  try {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1);

    // Apply filters
    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters.action) {
      query = query.eq('action', filters.action);
    }

    if (filters.entityType) {
      query = query.eq('entity_type', filters.entityType);
    }

    if (filters.entityId) {
      query = query.eq('entity_id', filters.entityId);
    }

    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map(log => ({
      ...log,
      created_at: new Date(log.created_at)
    }));
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }
};

/**
 * Get content moderation queue
 * @param status Optional status filter
 * @param contentType Optional content type filter
 * @param limit Maximum number of items to return
 * @param offset Number of items to skip (for pagination)
 * @returns A promise that resolves to an array of content moderation items
 */
export const getModerationQueue = async (
  status?: 'pending' | 'approved' | 'rejected',
  contentType?: 'job_listing' | 'training_program' | 'resource' | 'partner_profile',
  limit = 50,
  offset = 0
): Promise<models.ContentModerationType[]> => {
  try {
    let query = supabase
      .from('content_moderation')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(limit)
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (contentType) {
      query = query.eq('content_type', contentType);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map(item => ({
      ...item,
      created_at: new Date(item.created_at),
      updated_at: new Date(item.updated_at)
    }));
  } catch (error) {
    console.error('Error fetching moderation queue:', error);
    return [];
  }
};

/**
 * Update content moderation status
 * @param moderationId The ID of the moderation item
 * @param status The new status
 * @param reviewerId The ID of the reviewer
 * @param reviewNotes Optional review notes
 * @returns A promise that resolves to the updated moderation item
 */
export const updateModerationStatus = async (
  moderationId: string,
  status: 'approved' | 'rejected',
  reviewerId: string,
  reviewNotes?: string
): Promise<models.ContentModerationType | null> => {
  try {
    const { data, error } = await supabase
      .from('content_moderation')
      .update({
        status,
        reviewer_id: reviewerId,
        review_notes: reviewNotes,
        updated_at: new Date().toISOString()
      })
      .eq('id', moderationId)
      .select()
      .single();

    if (error) throw error;

    // Log the action
    await createAuditLog(
      reviewerId,
      `moderation_${status}`,
      'content_moderation',
      moderationId,
      {
        content_type: data.content_type,
        content_id: data.content_id,
        review_notes: reviewNotes
      }
    );

    return {
      ...data,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    };
  } catch (error) {
    console.error('Error updating moderation status:', error);
    return null;
  }
};

export default {
  getAdminUsers,
  getSystemConfig,
  updateSystemConfig,
  createAuditLog,
  getAuditLogs,
  getModerationQueue,
  updateModerationStatus
};
