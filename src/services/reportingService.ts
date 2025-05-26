import { supabase } from '../lib/supabase';
import { models } from '../agents';

/**
 * This service handles report generation and analytics dashboards
 * for the Climate Ecosystem Assistant platform.
 */

/**
 * Create a report template
 * @param name The template name
 * @param description The template description
 * @param reportType The type of report
 * @param query The SQL query for the report
 * @param parameters The parameters for the report
 * @returns A promise that resolves to the created report template
 */
export const createReportTemplate = async (
  name: string,
  description: string,
  reportType: 'user' | 'partner' | 'job' | 'training' | 'system',
  query: string,
  parameters: Record<string, unknown>[] = []
): Promise<models.ReportTemplateType | null> => {
  try {
    const { data, error } = await supabase
      .from('report_templates')
      .insert([
        {
          name,
          description,
          report_type: reportType,
          query,
          parameters,
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
    console.error('Error creating report template:', error);
    return null;
  }
};

/**
 * Get all report templates
 * @param reportType Optional filter by report type
 * @returns A promise that resolves to an array of report templates
 */
export const getReportTemplates = async (
  reportType?: 'user' | 'partner' | 'job' | 'training' | 'system'
): Promise<models.ReportTemplateType[]> => {
  try {
    let query = supabase
      .from('report_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (reportType) {
      query = query.eq('report_type', reportType);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map(template => ({
      ...template,
      created_at: new Date(template.created_at),
      updated_at: new Date(template.updated_at)
    }));
  } catch (error) {
    console.error('Error fetching report templates:', error);
    return [];
  }
};

/**
 * Generate a report from a template
 * @param templateId The template ID
 * @param name The report name
 * @param parameters The parameters for the report
 * @param createdBy The ID of the user creating the report
 * @returns A promise that resolves to the generated report
 */
export const generateReport = async (
  templateId: string,
  name: string,
  parameters: Record<string, unknown> = {},
  createdBy: string
): Promise<models.ReportType | null> => {
  try {
    // Get the template
    const { data: template, error: templateError } = await supabase
      .from('report_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError) throw templateError;

    // In a real implementation, this would execute the SQL query with parameters
    // For this simulation, we'll generate mock data based on the report type
    const results = generateMockReportData(template.report_type, parameters);

    // Create the report
    const { data, error } = await supabase
      .from('reports')
      .insert([
        {
          template_id: templateId,
          name,
          parameters,
          results,
          created_by: createdBy,
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
    console.error('Error generating report:', error);
    return null;
  }
};

/**
 * Get reports created by a user
 * @param userId The user ID
 * @param limit Maximum number of reports to return
 * @param offset Number of reports to skip (for pagination)
 * @returns A promise that resolves to an array of reports
 */
export const getUserReports = async (
  userId: string,
  limit = 20,
  offset = 0
): Promise<models.ReportType[]> => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        template:report_templates(name, description, report_type)
      `)
      .eq('created_by', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return (data || []).map(report => ({
      ...report,
      created_at: new Date(report.created_at)
    }));
  } catch (error) {
    console.error('Error fetching user reports:', error);
    return [];
  }
};

/**
 * Create a dashboard
 * @param name The dashboard name
 * @param description The dashboard description
 * @param layout The dashboard layout configuration
 * @param widgets The dashboard widgets
 * @param accessRoles The roles that can access this dashboard
 * @returns A promise that resolves to the created dashboard
 */
export const createDashboard = async (
  name: string,
  description: string,
  layout: Record<string, unknown>,
  widgets: Record<string, unknown>[],
  accessRoles: string[] = ['admin']
): Promise<models.DashboardType | null> => {
  try {
    const { data, error } = await supabase
      .from('dashboards')
      .insert([
        {
          name,
          description,
          layout,
          widgets,
          access_roles: accessRoles,
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
    console.error('Error creating dashboard:', error);
    return null;
  }
};

/**
 * Get dashboards accessible to a user role
 * @param userRole The user's role
 * @returns A promise that resolves to an array of accessible dashboards
 */
export const getDashboards = async (
  userRole: string = 'admin'
): Promise<models.DashboardType[]> => {
  try {
    const { data, error } = await supabase
      .from('dashboards')
      .select('*')
      .contains('access_roles', [userRole])
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(dashboard => ({
      ...dashboard,
      created_at: new Date(dashboard.created_at),
      updated_at: new Date(dashboard.updated_at)
    }));
  } catch (error) {
    console.error('Error fetching dashboards:', error);
    return [];
  }
};

/**
 * Record a performance metric
 * @param metricName The metric name
 * @param metricValue The metric value
 * @param dimension Optional dimension
 * @param dimensionValue Optional dimension value
 * @returns A promise that resolves to the recorded metric
 */
export const recordPerformanceMetric = async (
  metricName: string,
  metricValue: number,
  dimension?: string,
  dimensionValue?: string
): Promise<models.PerformanceMetricType | null> => {
  try {
    const { data, error } = await supabase
      .from('performance_metrics')
      .insert([
        {
          metric_name: metricName,
          metric_value: metricValue,
          dimension,
          dimension_value: dimensionValue,
          timestamp: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      timestamp: new Date(data.timestamp)
    };
  } catch (error) {
    console.error('Error recording performance metric:', error);
    return null;
  }
};

/**
 * Generate mock report data based on report type
 * @param reportType The type of report
 * @param parameters The report parameters
 * @returns Mock data for the report
 */
const generateMockReportData = (
  reportType: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  parameters: Record<string, unknown>
): Record<string, unknown>[] => {
  switch (reportType) {
    case 'user':
      return [
        { metric: 'Total Users', value: 1250, change: '+12%' },
        { metric: 'Active Users (30d)', value: 890, change: '+8%' },
        { metric: 'New Registrations', value: 45, change: '+15%' },
        { metric: 'User Retention Rate', value: '72%', change: '+3%' }
      ];

    case 'partner':
      return [
        { metric: 'Total Partners', value: 85, change: '+5%' },
        { metric: 'Active Partners', value: 67, change: '+2%' },
        { metric: 'Job Postings', value: 234, change: '+18%' },
        { metric: 'Training Programs', value: 156, change: '+12%' }
      ];

    case 'job':
      return [
        { metric: 'Total Job Listings', value: 456, change: '+22%' },
        { metric: 'Applications Submitted', value: 1890, change: '+35%' },
        { metric: 'Successful Matches', value: 123, change: '+28%' },
        { metric: 'Average Match Score', value: '78%', change: '+5%' }
      ];

    case 'training':
      return [
        { metric: 'Training Programs', value: 89, change: '+15%' },
        { metric: 'Enrollments', value: 567, change: '+42%' },
        { metric: 'Completion Rate', value: '85%', change: '+7%' },
        { metric: 'Certifications Earned', value: 234, change: '+38%' }
      ];

    case 'system':
      return [
        { metric: 'API Requests', value: 45678, change: '+12%' },
        { metric: 'Response Time (avg)', value: '245ms', change: '-8%' },
        { metric: 'Error Rate', value: '0.3%', change: '-15%' },
        { metric: 'Uptime', value: '99.8%', change: '+0.1%' }
      ];

    default:
      return [];
  }
};

export default {
  createReportTemplate,
  getReportTemplates,
  generateReport,
  getUserReports,
  createDashboard,
  getDashboards,
  recordPerformanceMetric
};
