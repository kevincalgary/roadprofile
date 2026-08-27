import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CircularIconButton } from '../../../components/ui/CircularIconButton';
import { EmptyState } from '../../../components/ui/EmptyState';
import { FeedPostCard } from '../../../components/feed/FeedPostCard';
import { NAV_CLEARANCE } from '../../../components/nav/AppShell';
import { getSavedRecords } from '../../../lib/api/records';
import { hydrateRecords, type HydratedFeed } from '../../../lib/api/hydrate';
import type { VehicleRecord } from '../../../lib/types/database';

export default function SavedRecords() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [records, setRecords] = useState<VehicleRecord[]>([]);
  const [hydrated, setHydrated] = useState<HydratedFeed | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSavedRecords()
      .then(async (r) => {
        setRecords(r);
        setHydrated(await hydrateRecords(r));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <View className="flex-1 bg-warmwhite dark:bg-dark-bg" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center gap-3 px-5 pt-4 pb-2">
        <CircularIconButton icon="arrow-left" accessibilityLabel="Back" onPress={() => router.back()} />
        <Text className="text-2xl font-extrabold text-charcoal dark:text-dark-text">Saved records</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: NAV_CLEARANCE }}>
        {!loading && records.length === 0 ? (
          <EmptyState icon="bookmark" title="Nothing saved yet" description="Bookmark records from the feed or a vehicle profile to find them here." />
        ) : (
          records.map((r) => (
            <FeedPostCard
              key={r.id}
              record={r}
              author={hydrated?.authors.get(r.author_id)}
              vehicle={hydrated?.vehicles.get(r.vehicle_id)}
              photos={hydrated?.photosByRecord.get(r.id) ?? []}
              commentCount={hydrated?.commentCounts.get(r.id) ?? 0}
              bookmarked
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}
