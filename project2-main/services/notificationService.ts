// @ts-nocheck - Supabase type definitions incompatible with strict mode
import { supabase } from '@/lib/supabase';
import { Notification, NotificationUpdate } from '@/types/database';

/**
 * Get notifications for a user
 */
export async function getNotifications(
  userId: string,
  unreadOnly: boolean = false,
  limit: number = 50
): Promise<Notification[]> {
  try {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq('read', false);
    }

    const { data, error } = await query;

    if (error) {
      console.error('GetNotifications error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('GetNotifications error:', error);
    return [];
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      console.error('GetUnreadCount error:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('GetUnreadCount error:', error);
    return 0;
  }
}

/**
 * Mark a notification as read
 */
export async function markAsRead(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // @ts-expect-error Supabase types issue
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('MarkAsRead error:', error);
    return { success: false, error: 'Failed to mark notification as read' };
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // @ts-expect-error Supabase types issue
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('MarkAllAsRead error:', error);
    return { success: false, error: 'Failed to mark all notifications as read' };
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('DeleteNotification error:', error);
    return { success: false, error: 'Failed to delete notification' };
  }
}

/**
 * Delete all read notifications
 */
export async function clearReadNotifications(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)
      .eq('read', true);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('ClearReadNotifications error:', error);
    return { success: false, error: 'Failed to clear notifications' };
  }
}

/**
 * Subscribe to real-time notifications
 */
export function subscribeToNotifications(
  userId: string,
  onNewNotification: (notification: Notification) => void
) {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onNewNotification(payload.new as Notification);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
