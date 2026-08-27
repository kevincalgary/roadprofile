import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CircularIconButton } from '../../../components/ui/CircularIconButton';
import { Avatar } from '../../../components/ui/Avatar';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { getBlockedUsers, unblockUser } from '../../../lib/api/social';

export default function BlockedUsers() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [blocked, setBlocked] = useState<Awaited<ReturnType<typeof getBlockedUsers>>>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    getBlockedUsers().then(setBlocked).finally(() => setLoading(false));
  }

  useEffect(load, []);

  return (
    <View className="flex-1 bg-warmwhite dark:bg-dark-bg" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center gap-3 px-5 pt-4 pb-2">
        <CircularIconButton icon="arrow-left" accessibilityLabel="Back" onPress={() => router.back()} />
        <Text className="text-2xl font-extrabold text-charcoal dark:text-dark-text">Blocked users</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        {!loading && blocked.length === 0 ? (
          <EmptyState icon="slash" title="No blocked users" />
        ) : (
          blocked.map((b) => (
            <View key={b.blocked_id} className="flex-row items-center gap-3 py-3 border-b border-black/5 dark:border-dark-border">
              <Avatar url={b.blocked?.avatar_url} name={b.blocked?.display_name ?? 'User'} />
              <Text className="flex-1 text-charcoal dark:text-dark-text font-medium">{b.blocked?.display_name ?? 'RoadProfile user'}</Text>
              <Button
                label="Unblock"
                variant="outline"
                size="sm"
                onPress={() =>
                  unblockUser(b.blocked_id).then(() => setBlocked((prev) => prev.filter((x) => x.blocked_id !== b.blocked_id)))
                }
              />
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
