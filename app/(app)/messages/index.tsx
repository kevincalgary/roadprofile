import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CircularIconButton } from '../../../components/ui/CircularIconButton';
import { Avatar } from '../../../components/ui/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { NAV_CLEARANCE } from '../../../components/nav/AppShell';
import { relativeTime } from '../../../lib/format';
import { getConversations, getConversationOtherProfiles, type ConversationSummary } from '../../../lib/api/messages';
import type { Profile } from '../../../lib/types/database';

export default function Messages() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [profiles, setProfiles] = useState<Map<string, Profile>>(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const list = await getConversations();
    setConversations(list);
    setProfiles(await getConversationOtherProfiles(list));
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const accepted = conversations.filter((c) => !c.member.is_request_pending);
  const requests = conversations.filter((c) => c.member.is_request_pending);

  return (
    <View className="flex-1 bg-warmwhite dark:bg-dark-bg" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
        <Text accessibilityRole="header" className="text-3xl font-extrabold text-charcoal dark:text-dark-text">Messages</Text>
        <CircularIconButton icon="edit" accessibilityLabel="New conversation" onPress={() => router.push('/messages/new')} backgroundClassName="bg-mint" color="#0F2518" />
      </View>

      {!loading && conversations.length === 0 ? (
        <EmptyState icon="message-circle" title="No conversations yet" description="Start a conversation with another RoadProfile member." actionLabel="New conversation" onAction={() => router.push('/messages/new')} />
      ) : (
        <FlatList
          data={[...requests, ...accepted]}
          keyExtractor={(item) => item.conversation.id}
          contentContainerStyle={{ paddingBottom: NAV_CLEARANCE }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#62C58F" />}
          ListHeaderComponent={
            requests.length > 0 ? (
              <Text className="px-5 py-2 text-xs font-bold text-asphalt dark:text-dark-textSecondary uppercase">Message requests</Text>
            ) : null
          }
          renderItem={({ item, index }) => {
            const profile = profiles.get(item.otherUserId);
            const isFirstAccepted = index === requests.length && requests.length > 0;
            return (
              <>
                {isFirstAccepted ? <Text className="px-5 py-2 text-xs font-bold text-asphalt dark:text-dark-textSecondary uppercase">Conversations</Text> : null}
                <Pressable
                  onPress={() => router.push(`/messages/${item.conversation.id}`)}
                  accessibilityRole="link"
                  accessibilityLabel={`Conversation with ${profile?.display_name ?? 'user'}${item.unreadCount > 0 ? `, ${item.unreadCount} unread` : ''}`}
                  className="flex-row items-center gap-3 px-5 py-3 border-b border-black/5 dark:border-dark-border"
                >
                  <Avatar url={profile?.avatar_url} name={profile?.display_name ?? '?'} />
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between">
                      <Text className="font-semibold text-charcoal dark:text-dark-text">{profile?.display_name ?? 'RoadProfile user'}</Text>
                      {item.lastMessage ? <Text className="text-xs text-asphalt dark:text-dark-textSecondary">{relativeTime(item.lastMessage.created_at)}</Text> : null}
                    </View>
                    <Text numberOfLines={1} className="text-sm text-asphalt dark:text-dark-textSecondary mt-0.5">
                      {item.lastMessage?.body ?? (item.lastMessage?.shared_object_type ? 'Shared an item' : 'Say hello')}
                    </Text>
                  </View>
                  {item.unreadCount > 0 ? <Badge label={String(item.unreadCount)} tone="mint" /> : null}
                </Pressable>
              </>
            );
          }}
        />
      )}
    </View>
  );
}
