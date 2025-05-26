import { supabase } from '../lib/supabase';
import { models } from '../agents';

/**
 * This service handles notifications and events for users
 * in the Climate Ecosystem Assistant platform.
 */

/**
 * Create a notification for a user
 * @param userId The user ID
 * @param title The notification title
 * @param message The notification message
 * @param notificationType The type of notification
 * @param relatedEntityType Optional related entity type
 * @param relatedEntityId Optional related entity ID
 * @returns A promise that resolves to the created notification
 */
export const createNotification = async (
  userId: string,
  title: string,
  message: string,
  notificationType: 'job_match' | 'event' | 'message' | 'system' | 'other',
  relatedEntityType?: string,
  relatedEntityId?: string
): Promise<models.NotificationType | null> => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert([
        {
          user_id: userId,
          title,
          message,
          notification_type: notificationType,
          related_entity_type: relatedEntityType,
          related_entity_id: relatedEntityId,
          read: false,
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
    console.error('Error creating notification:', error);
    return null;
  }
};

/**
 * Get notifications for a user
 * @param userId The user ID
 * @param limit Maximum number of notifications to return
 * @param offset Number of notifications to skip (for pagination)
 * @param unreadOnly Whether to return only unread notifications
 * @returns A promise that resolves to an array of notifications
 */
export const getUserNotifications = async (
  userId: string,
  limit = 10,
  offset = 0,
  unreadOnly = false
): Promise<models.NotificationType[]> => {
  try {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1);

    if (unreadOnly) {
      query = query.eq('read', false);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map(notification => ({
      ...notification,
      created_at: new Date(notification.created_at)
    }));
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

/**
 * Mark a notification as read
 * @param notificationId The notification ID
 * @param userId The user ID (for security check)
 * @returns A promise that resolves to a boolean indicating success
 */
export const markNotificationAsRead = async (
  notificationId: string,
  userId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
};

/**
 * Mark all notifications as read for a user
 * @param userId The user ID
 * @returns A promise that resolves to a boolean indicating success
 */
export const markAllNotificationsAsRead = async (
  userId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
};

/**
 * Get upcoming events
 * @param limit Maximum number of events to return
 * @param offset Number of events to skip (for pagination)
 * @param filters Optional filters to apply
 * @returns A promise that resolves to an array of events
 */
export const getUpcomingEvents = async (
  limit = 10,
  offset = 0,
  filters: Record<string, unknown> = {}
): Promise<models.EventType[]> => {
  try {
    let query = supabase
      .from('events')
      .select('*')
      .gte('start_date', new Date().toISOString())
      .eq('is_published', true)
      .order('start_date', { ascending: true })
      .limit(limit)
      .range(offset, offset + limit - 1);

    // Apply filters
    if (filters.eventType) {
      query = query.eq('event_type', filters.eventType);
    }

    if (filters.virtual !== undefined) {
      query = query.eq('virtual', filters.virtual);
    }

    if (filters.climateSector) {
      query = query.contains('climate_sector', [filters.climateSector]);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map(event => ({
      ...event,
      start_date: new Date(event.start_date),
      end_date: new Date(event.end_date),
      created_at: new Date(event.created_at),
      updated_at: new Date(event.updated_at)
    }));
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    return [];
  }
};

/**
 * Register a user for an event
 * @param userId The user ID
 * @param eventId The event ID
 * @returns A promise that resolves to a boolean indicating success
 */
export const registerForEvent = async (
  userId: string,
  eventId: string
): Promise<boolean> => {
  try {
    // Check if the user is already registered
    const { data: existingRegistration, error: checkError } = await supabase
      .from('event_registrations')
      .select('id')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingRegistration) {
      return true; // Already registered
    }

    // Register the user
    const { error } = await supabase
      .from('event_registrations')
      .insert([
        {
          user_id: userId,
          event_id: eventId,
          registration_date: new Date().toISOString(),
          status: 'registered'
        }
      ]);

    if (error) throw error;

    // Create a notification
    await createNotification(
      userId,
      'Event Registration Confirmed',
      'You have successfully registered for an event. Check your calendar for details.',
      'event',
      'event',
      eventId
    );

    return true;
  } catch (error) {
    console.error('Error registering for event:', error);
    return false;
  }
};

export default {
  createNotification,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUpcomingEvents,
  registerForEvent
};
