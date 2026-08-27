import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../components/nav/ScreenHeader';
import { FeedPostCard } from '../../components/feed/FeedPostCard';
import { FeedPostSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { NAV_CLEARANCE } from '../../components/nav/AppShell';
import { useUnreadCounts } from '../../lib/hooks/useUnreadCounts';
import { usePaginatedQuery } from '../../lib/hooks/usePaginatedQuery';
import { getDiscoverFeed, getFollowingFeed } from '../../lib/api/feed';
import { hydrateRecords, type HydratedFeed } from '../../lib/api/hydrate';
import type { VehicleRecord } from '../../lib/types/database';

type Tab = 'following' | 'discover';

export default function Home() {
  const insets = useSafeAreaInsets();
  const { unreadNotifications } = useUnreadCounts();
  const [tab, setTab] = useState<Tab>('discover');
  const [hydrated, setHydrated] = useState<HydratedFeed | null>(null);

  const fetchPage = useCallback(
    async (cursor?: string) => {
      const page = tab === 'discover' ? await getDiscoverFeed(cursor) : await getFollowingFeed(cursor);
      const nextHydrated = await hydrateRecords(page.items);
      setHydrated((prev) => mergeHydrated(prev, nextHydrated));
      return page;
    },
    [tab]
  );

  const { items, loading, refreshing, loadingMore, error, refresh, loadMore } = usePaginatedQuery<VehicleRecord>(fetchPage, [tab]);

  return (
    <View className="flex-1 bg-warmwhite dark:bg-dark-bg" style={{ paddingTop: insets.top }}>
      <ScreenHeader title="RoadProfile" showBell unreadNotifications={unreadNotifications} />

      <View className="flex-row px-5 gap-6 border-b border-black/5 dark:border-dark-border">
        {(['following', 'discover'] as Tab[]).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === t }}
            className="pb-3 pt-1"
          >
            <Text className={['text-base capitalize', tab === t ? 'font-bold text-charcoal dark:text-dark-text' : 'text-asphalt dark:text-dark-textSecondary'].join(' ')}>
              {t}
            </Text>
            {tab === t ? <View className="h-0.5 bg-mint rounded-full mt-2" /> : null}
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View>
          <FeedPostSkeleton />
          <FeedPostSkeleton />
        </View>
      ) : error ? (
        <ErrorState message="Couldn't load the feed. Check your connection and try again." onRetry={refresh} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={tab === 'following' ? 'users' : 'compass'}
          title={tab === 'following' ? 'Nothing here yet' : 'No posts yet'}
          description={
            tab === 'following'
              ? 'Follow contributors, vehicles, or lists to see their history updates here.'
              : 'Be the first to document a vehicle today.'
          }
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <FeedPostCard
              record={item}
              author={hydrated?.authors.get(item.author_id)}
              vehicle={hydrated?.vehicles.get(item.vehicle_id)}
              photos={hydrated?.photosByRecord.get(item.id) ?? []}
              commentCount={hydrated?.commentCounts.get(item.id) ?? 0}
              bookmarked={hydrated?.bookmarked.has(item.id) ?? false}
            />
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#62C58F" />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={loadingMore ? <FeedPostSkeleton /> : <View style={{ height: NAV_CLEARANCE }} />}
        />
      )}
    </View>
  );
}

function mergeHydrated(prev: HydratedFeed | null, next: HydratedFeed): HydratedFeed {
  if (!prev) return next;
  return {
    vehicles: new Map([...prev.vehicles, ...next.vehicles]),
    authors: new Map([...prev.authors, ...next.authors]),
    photosByRecord: new Map([...prev.photosByRecord, ...next.photosByRecord]),
    commentCounts: new Map([...prev.commentCounts, ...next.commentCounts]),
    bookmarked: new Set([...prev.bookmarked, ...next.bookmarked]),
  };
}
