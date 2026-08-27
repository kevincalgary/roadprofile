import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { ScreenHeader } from '../../../components/nav/ScreenHeader';
import { CircularIconButton } from '../../../components/ui/CircularIconButton';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ListCard } from '../../../components/lists/ListCard';
import { NAV_CLEARANCE } from '../../../components/nav/AppShell';
import { getMyLists, getFollowedLists, exploreLists } from '../../../lib/api/lists';
import type { ListRow } from '../../../lib/types/database';

type Tab = 'my' | 'following' | 'explore';

export default function Lists() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('my');
  const [lists, setLists] = useState<ListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const fetcher = tab === 'my' ? getMyLists : tab === 'following' ? getFollowedLists : exploreLists;
    const data = await fetcher();
    setLists(data);
  }, [tab]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <View className="flex-1 bg-warmwhite dark:bg-dark-bg" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
        <Text accessibilityRole="header" className="text-3xl font-extrabold text-charcoal dark:text-dark-text">Lists</Text>
        <CircularIconButton icon="plus" accessibilityLabel="Create list" onPress={() => router.push('/lists/new')} backgroundClassName="bg-mint" color="#0F2518" />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-5 mb-2" contentContainerStyle={{ gap: 8 }}>
        {(['my', 'following', 'explore'] as Tab[]).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === t }}
            className={['h-9 px-4 rounded-pill items-center justify-center border', tab === t ? 'bg-mint border-mint' : 'border-asphalt/30 dark:border-dark-border'].join(' ')}
          >
            <Text className={['text-sm font-medium capitalize', tab === t ? 'text-mint-900' : 'text-asphalt dark:text-dark-textSecondary'].join(' ')}>
              {t === 'my' ? 'My Lists' : t}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: NAV_CLEARANCE, gap: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#62C58F" />}
      >
        {!loading && lists.length === 0 ? (
          <EmptyState
            icon="list"
            title={tab === 'my' ? 'No lists yet' : tab === 'following' ? 'Not following any lists' : 'Nothing to explore yet'}
            description={tab === 'my' ? 'Create a list to organize vehicles you care about.' : undefined}
            actionLabel={tab === 'my' ? 'Create a list' : undefined}
            onAction={tab === 'my' ? () => router.push('/lists/new') : undefined}
          />
        ) : (
          lists.map((list) => <ListCard key={list.id} list={list} />)
        )}
      </ScrollView>
    </View>
  );
}
