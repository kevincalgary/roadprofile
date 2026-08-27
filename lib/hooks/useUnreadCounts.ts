import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../auth-context';
import { getUnreadMessageCount, getUnreadNotificationCount, subscribeToNotifications } from '../api/notifications';
import { supabase } from '../supabase';

export function useUnreadCounts() {
  const { user } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) {
      setUnreadMessages(0);
      setUnreadNotifications(0);
      return;
    }
    const [messages, notifications] = await Promise.all([getUnreadMessageCount(), getUnreadNotificationCount()]);
    setUnreadMessages(messages);
    setUnreadNotifications(notifications);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!user) return;
    const unsubscribeNotifications = subscribeToNotifications(user.id, () => refresh());
    const messagesChannel = supabase
      .channel(`unread-messages:${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => refresh())
      .subscribe();
    return () => {
      unsubscribeNotifications();
      supabase.removeChannel(messagesChannel);
    };
  }, [user, refresh]);

  return { unreadMessages, unreadNotifications, refresh };
}
