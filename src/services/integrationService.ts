import { supabase } from '../lib/supabase';
import { models } from '../agents';

/**
 * This service handles external system integrations
 * for the Climate Ecosystem Assistant platform.
 */

/**
 * Create an external system configuration
 * @param name The system name
 * @param systemType The type of system
 * @param baseUrl The base URL for the system
 * @param authType The authentication type
 * @param authConfig The authentication configuration
 * @returns A promise that resolves to the created external system
 */
export const createExternalSystem = async (
  name: string,
  systemType: string,
  baseUrl: string,
  authType: 'api_key' | 'oauth2' | 'basic' | 'none',
  authConfig: Record<string, unknown> = {}
): Promise<models.ExternalSystemType | null> => {
  try {
    const { data, error } = await supabase
      .from('external_systems')
      .insert([
        {
          name,
          system_type: systemType,
          base_url: baseUrl,
          auth_type: authType,
          auth_config: authConfig,
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    };
  } catch (error) {
    console.error('Error creating external system:', error);
    return null;
  }
};

/**
 * Get all external systems
 * @param activeOnly Whether to return only active systems
 * @returns A promise that resolves to an array of external systems
 */
export const getExternalSystems = async (
  activeOnly = true
): Promise<models.ExternalSystemType[]> => {
  try {
    let query = supabase
      .from('external_systems')
      .select('*')
      .order('created_at', { ascending: false });

    if (activeOnly) {
      query = query.eq('active', true);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map(system => ({
      ...system,
      created_at: new Date(system.created_at),
      updated_at: new Date(system.updated_at)
    }));
  } catch (error) {
    console.error('Error fetching external systems:', error);
    return [];
  }
};

/**
 * Create an integration mapping
 * @param externalSystemId The external system ID
 * @param localEntity The local entity name
 * @param externalEntity The external entity name
 * @param fieldMappings The field mappings between local and external entities
 * @returns A promise that resolves to the created integration mapping
 */
export const createIntegrationMapping = async (
  externalSystemId: string,
  localEntity: string,
  externalEntity: string,
  fieldMappings: Record<string, string>
): Promise<models.IntegrationMappingType | null> => {
  try {
    const { data, error } = await supabase
      .from('integration_mappings')
      .insert([
        {
          external_system_id: externalSystemId,
          local_entity: localEntity,
          external_entity: externalEntity,
          field_mappings: fieldMappings,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    };
  } catch (error) {
    console.error('Error creating integration mapping:', error);
    return null;
  }
};

/**
 * Get integration mappings for a system
 * @param externalSystemId The external system ID
 * @returns A promise that resolves to an array of integration mappings
 */
export const getIntegrationMappings = async (
  externalSystemId: string
): Promise<models.IntegrationMappingType[]> => {
  try {
    const { data, error } = await supabase
      .from('integration_mappings')
      .select('*')
      .eq('external_system_id', externalSystemId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(mapping => ({
      ...mapping,
      created_at: new Date(mapping.created_at),
      updated_at: new Date(mapping.updated_at)
    }));
  } catch (error) {
    console.error('Error fetching integration mappings:', error);
    return [];
  }
};

/**
 * Log a sync operation
 * @param integrationId The integration ID
 * @param direction The sync direction
 * @param entityType The entity type being synced
 * @param entityId The entity ID (optional)
 * @param status The sync status
 * @param details Additional details about the sync
 * @returns A promise that resolves to the created sync log
 */
export const logSyncOperation = async (
  integrationId: string,
  direction: 'inbound' | 'outbound',
  entityType: string,
  entityId: string | null,
  status: 'success' | 'error' | 'partial',
  details: Record<string, unknown> = {}
): Promise<models.SyncLogType | null> => {
  try {
    const { data, error } = await supabase
      .from('sync_logs')
      .insert([
        {
          integration_id: integrationId,
          direction,
          entity_type: entityType,
          entity_id: entityId,
          status,
          details,
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
    console.error('Error logging sync operation:', error);
    return null;
  }
};

/**
 * Get sync logs for an integration
 * @param integrationId The integration ID
 * @param limit Maximum number of logs to return
 * @param offset Number of logs to skip (for pagination)
 * @returns A promise that resolves to an array of sync logs
 */
export const getSyncLogs = async (
  integrationId: string,
  limit = 50,
  offset = 0
): Promise<models.SyncLogType[]> => {
  try {
    const { data, error } = await supabase
      .from('sync_logs')
      .select('*')
      .eq('integration_id', integrationId)
      .order('created_at', { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return (data || []).map(log => ({
      ...log,
      created_at: new Date(log.created_at)
    }));
  } catch (error) {
    console.error('Error fetching sync logs:', error);
    return [];
  }
};

/**
 * Simulate a data sync operation
 * @param externalSystemId The external system ID
 * @param entityType The entity type to sync
 * @param direction The sync direction
 * @returns A promise that resolves to the sync result
 */
export const simulateDataSync = async (
  externalSystemId: string,
  entityType: string,
  direction: 'inbound' | 'outbound'
): Promise<{ success: boolean; message: string; recordsProcessed: number }> => {
  try {
    // Get the external system configuration
    const { data: system, error: systemError } = await supabase
      .from('external_systems')
      .select('*')
      .eq('id', externalSystemId)
      .single();

    if (systemError) throw systemError;

    // Get the integration mappings
    const mappings = await getIntegrationMappings(externalSystemId);
    const entityMapping = mappings.find(m => m.local_entity === entityType);

    if (!entityMapping) {
      throw new Error(`No mapping found for entity type: ${entityType}`);
    }

    // Simulate the sync operation
    const recordsProcessed = Math.floor(Math.random() * 50) + 1;
    const success = Math.random() > 0.1; // 90% success rate

    // Log the sync operation
    await logSyncOperation(
      entityMapping.id,
      direction,
      entityType,
      null,
      success ? 'success' : 'error',
      {
        records_processed: recordsProcessed,
        system_name: system.name,
        sync_timestamp: new Date().toISOString()
      }
    );

    return {
      success,
      message: success
        ? `Successfully synced ${recordsProcessed} ${entityType} records`
        : `Sync failed for ${entityType} records`,
      recordsProcessed: success ? recordsProcessed : 0
    };
  } catch (error) {
    console.error('Error simulating data sync:', error);

    // Log the error
    await logSyncOperation(
      externalSystemId,
      direction,
      entityType,
      null,
      'error',
      {
        error_message: error.message,
        sync_timestamp: new Date().toISOString()
      }
    );

    return {
      success: false,
      message: `Sync failed: ${error.message}`,
      recordsProcessed: 0
    };
  }
};

export default {
  createExternalSystem,
  getExternalSystems,
  createIntegrationMapping,
  getIntegrationMappings,
  logSyncOperation,
  getSyncLogs,
  simulateDataSync
};
