import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CircularIconButton } from '../../../components/ui/CircularIconButton';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Badge } from '../../../components/ui/Badge';
import { CATEGORY_LABELS, relativeTime } from '../../../lib/format';
import { getMyDrafts } from '../../../lib/api/records';
import type { VehicleRecord } from '../../../lib/types/database';

export default function Drafts() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [drafts, setDrafts] = useState<VehicleRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyDrafts().then(setDrafts).finally(() => setLoading(false));
  }, []);

  return (
    <View className="flex-1 bg-warmwhite dark:bg-dark-bg" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center gap-3 px-5 pt-4 pb-2">
        <CircularIconButton icon="arrow-left" accessibilityLabel="Back" onPress={() => router.back()} />
        <Text className="text-2xl font-extrabold text-charcoal dark:text-dark-text">Drafts</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        {!loading && drafts.length === 0 ? (
          <EmptyState icon="file-text" title="No drafts" description="Records you save without publishing appear here." />
        ) : (
          drafts.map((d) => (
            <Pressable
              key={d.id}
              onPress={() => router.push({ pathname: '/record/new', params: { recordId: d.id, vehicleId: d.vehicle_id, vin: '' } })}
              className="py-3 border-b border-black/5 dark:border-dark-border"
            >
              <View className="flex-row items-center gap-2">
                <Badge label={CATEGORY_LABELS[d.category]} />
                <Badge label="Draft" tone="amber" />
              </View>
              <Text className="font-semibold text-charcoal dark:text-dark-text mt-1">{d.title || 'Untitled record'}</Text>
              <Text className="text-xs text-asphalt dark:text-dark-textSecondary mt-0.5">Last edited {relativeTime(d.updated_at)}</Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}
