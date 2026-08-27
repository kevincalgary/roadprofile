import React, { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { getListStats } from '../../lib/api/lists';
import type { ListRow, ListStats } from '../../lib/types/database';

export function ListCard({ list }: { list: ListRow }) {
  const router = useRouter();
  const [stats, setStats] = useState<ListStats | null>(null);

  useEffect(() => {
    getListStats(list.id).then(setStats);
  }, [list.id]);

  return (
    <Pressable onPress={() => router.push(`/list/${list.id}`)} accessibilityRole="link" accessibilityLabel={`Open list ${list.name}`}>
      <Card className="overflow-hidden">
        <View className="h-32 bg-cardgray dark:bg-dark-card">
          {list.cover_image_url ? (
            <Image source={{ uri: list.cover_image_url }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Feather name="list" size={24} color="#8A919B" />
            </View>
          )}
        </View>
        <View className="p-4">
          <View className="flex-row items-center gap-2">
            <Text className="font-bold text-charcoal dark:text-dark-text flex-1" numberOfLines={1}>{list.name}</Text>
            {!list.is_public ? <Feather name="lock" size={14} color="#8A919B" /> : null}
          </View>
          {list.description ? (
            <Text numberOfLines={2} className="text-sm text-asphalt dark:text-dark-textSecondary mt-1">{list.description}</Text>
          ) : null}
          <Text className="text-xs text-asphalt dark:text-dark-textSecondary mt-2">
            {stats?.vehicle_count ?? 0} vehicles · {stats?.follower_count ?? 0} followers
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}
