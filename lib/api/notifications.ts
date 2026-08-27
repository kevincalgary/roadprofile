import { supabase } from '../supabase';
import type { Notification } from '../types/database';

export async function getNotifications(cursor?: string, limit = 30): Promise<Notification[]> {
  let query = supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(limit);
  if (cursor) query = query.lt('created_at', cursor);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getUnreadNotificationCount(): Promise<number> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;
  const { data, error } = await supabase.from('unread_notification_counts').select('unread_count').eq('user_id', user.id).maybeSingle();
  if (error) throw error;
  return data?.unread_count ?? 0;
}

export async function getUnreadMessageCount(): Promise<number> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;
  const { data, error } = await supabase.from('unread_message_counts').select('unread_count').eq('user_id', user.id).maybeSingle();
  if (error) throw error;
  return data?.unread_count ?? 0;
}

export async function markNotificationRead(notificationId: string) {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId);
  if (error) throw error;
}

export async function markAllNotificationsRead() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('recipient_id', user.id).eq('is_read', false);
  if (error) throw error;
}

export function subscribeToNotifications(userId: string, onInsert: (n: Notification) => void) {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${userId}` }, (payload) => {
      onInsert(payload.new as Notification);
    })
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
