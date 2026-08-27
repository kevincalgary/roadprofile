import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar } from '../ui/Avatar';
import type { Profile } from '../../lib/types/database';

export function UserRow({ profile, right, onPress }: { profile: Profile; right?: React.ReactNode; onPress?: () => void }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={onPress ?? (() => router.push(`/u/${profile.username}`))}
      accessibilityRole="link"
      accessibilityLabel={`View ${profile.display_name}'s profile`}
      className="flex-row items-center gap-3 py-3 border-b border-black/5 dark:border-dark-border"
    >
      <Avatar url={profile.avatar_url} name={profile.display_name} />
      <View className="flex-1">
        <Text className="font-semibold text-charcoal dark:text-dark-text">{profile.display_name}</Text>
        <Text className="text-xs text-asphalt dark:text-dark-textSecondary">@{profile.username}</Text>
      </View>
      {right}
    </Pressable>
  );
}
