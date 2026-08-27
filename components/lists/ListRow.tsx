import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import type { ListRow as ListRowType } from '../../lib/types/database';

export function ListRow({ list }: { list: ListRowType }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push(`/list/${list.id}`)}
      accessibilityRole="link"
      accessibilityLabel={`Open list ${list.name}`}
      className="flex-row items-center gap-3 py-3 border-b border-black/5 dark:border-dark-border"
    >
      {list.cover_image_url ? (
        <Image source={{ uri: list.cover_image_url }} style={{ width: 56, height: 56, borderRadius: 12 }} contentFit="cover" />
      ) : (
        <View className="w-14 h-14 rounded-xl bg-cardgray dark:bg-dark-card items-center justify-center">
          <Feather name="list" size={20} color="#8A919B" />
        </View>
      )}
      <View className="flex-1">
        <Text className="font-semibold text-charcoal dark:text-dark-text">{list.name}</Text>
        {list.description ? (
          <Text numberOfLines={1} className="text-xs text-asphalt dark:text-dark-textSecondary mt-0.5">
            {list.description}
          </Text>
        ) : null}
      </View>
      {!list.is_public ? <Feather name="lock" size={14} color="#8A919B" /> : null}
    </Pressable>
  );
}
