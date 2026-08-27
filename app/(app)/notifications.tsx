import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { CircularIconButton } from '../../components/ui/CircularIconButton';
import { Avatar } from '../../components/ui/Avatar';
import { EmptyState } from '../../components/ui/EmptyState';
import { NAV_CLEARANCE } from '../../components/nav/AppShell';
import { relativeTime } from '../../lib/format';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../../lib/api/notifications';
import { getProfilesMap } from '../../lib/api/profiles';
import type { Notification, Profile } from '../../lib/types/database';

const NOTIFICATION_COPY: Record<Notification['type'], (name: string) => string> = {
  new_follower: (n) => `${n} started following you`,
  new_comment: (n) => `${n} commented on your record`,
  comment_reply: (n) => `${n} replied to your comment`,
  mention: (n) => `${n} mentioned you`,
  list_invitation: (n) => `${n} invited you to collaborate on a list`,
  new_contribution: (n) => `${n} added a new record to a vehicle you follow`,
  record_correction: (n) => `A correction was decided on a record you contributed to`,
  moderation_update: () => `There's an update on your account or content`,
  message_request: (n) => `${n} sent you a message request`,
};

const ICONS: Record<Notification['type'], keyof typeof Feather.glyphMap> = {
  new_follower: 'user-plus',
  new_comment: 'message-circle',
  comment_reply: 'corner-up-left',
  mention: 'at-sign',
  list_invitation: 'list',
  new_contribution: 'plus-circle',
  record_correction: 'edit-3',
  moderation_update: 'shield',
  message_request: 'mail',
};

export default function Notifications() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [profiles, setProfiles] = useState<Map<string, Profile>>(new Map());

  const load = useCallback(async () => {
    const list = await getNotifications();
    setNotifications(list);
    const ids = list.map((n) => n.actor_id).filter(Boolean) as string[];
    setProfiles(await getProfilesMap(ids));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handlePress(n: Notification) {
    if (!n.is_read) {
      await markNotificationRead(n.id);
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
    }
    if (n.target_type === 'record' && n.target_id) router.push(`/record/${n.target_id}`);
    else if (n.target_type === 'vehicle' && n.target_id) router.push(`/record/${n.target_id}`);
    else if (n.target_type === 'user' && n.target_id) {
      const p = profiles.get(n.actor_id ?? '');
      if (p) router.push(`/u/${p.username}`);
    } else if (n.target_type === 'list' && n.target_id) router.push(`/list/${n.target_id}`);
    else if (n.target_type === 'comment' && n.target_id) router.push(`/record/${n.target_id}`);
  }

  const now = Date.now();
  const isNew = (n: Notification) => now - new Date(n.created_at).getTime() < 24 * 60 * 60 * 1000;
  const newer = notifications.filter(isNew);
  const earlier = notifications.filter((n) => !isNew(n));

  const sections = [
    ...(newer.length ? [{ title: 'New', data: newer }] : []),
    ...(earlier.length ? [{ title: 'Earlier', data: earlier }] : []),
  ];

  return (
    <View className="flex-1 bg-warmwhite dark:bg-dark-bg" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
        <View className="flex-row items-center gap-3">
          <CircularIconButton icon="arrow-left" accessibilityLabel="Back" onPress={() => router.back()} />
          <Text accessibilityRole="header" className="text-2xl font-extrabold text-charcoal dark:text-dark-text">Notifications</Text>
        </View>
        <Pressable onPress={() => markAllNotificationsRead().then(load)} accessibilityRole="button" className="px-3 py-2">
          <Text className="text-sm font-semibold text-mint-600">Mark all read</Text>
        </Pressable>
      </View>

      {notifications.length === 0 ? (
        <EmptyState icon="bell" title="No notifications yet" />
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(s) => s.title}
          contentContainerStyle={{ paddingBottom: NAV_CLEARANCE }}
          renderItem={({ item: section }) => (
            <View>
              <Text className="px-5 py-2 text-xs font-bold text-asphalt dark:text-dark-textSecondary uppercase">{section.title}</Text>
              {section.data.map((n) => {
                const actor = profiles.get(n.actor_id ?? '');
                return (
                  <Pressable
                    key={n.id}
                    onPress={() => handlePress(n)}
                    accessibilityRole="button"
                    className={['flex-row items-center gap-3 px-5 py-3', !n.is_read ? 'bg-mint-50 dark:bg-mint-900/30' : ''].join(' ')}
                  >
                    {actor ? (
                      <Avatar url={actor.avatar_url} name={actor.display_name} size={40} />
                    ) : (
                      <View className="w-10 h-10 rounded-full bg-cardgray dark:bg-dark-card items-center justify-center">
                        <Feather name={ICONS[n.type]} size={16} color="#5C6470" />
                      </View>
                    )}
                    <View className="flex-1">
                      <Text className="text-sm text-charcoal dark:text-dark-text">{NOTIFICATION_COPY[n.type](actor?.display_name ?? 'Someone')}</Text>
                      <Text className="text-xs text-asphalt dark:text-dark-textSecondary mt-0.5">{relativeTime(n.created_at)}</Text>
                    </View>
                    {!n.is_read ? <View className="w-2 h-2 rounded-full bg-mint" /> : null}
                  </Pressable>
                );
              })}
            </View>
          )}
        />
      )}
    </View>
  );
}
