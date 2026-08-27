import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Redirect, Slot } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth-context';

export default function ModerationLayout() {
  const { session, isModerator, loading } = useAuth();
  const insets = useSafeAreaInsets();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-warmwhite dark:bg-dark-bg">
        <ActivityIndicator color="#62C58F" size="large" />
      </View>
    );
  }

  if (!session) return <Redirect href="/welcome" />;

  if (!isModerator) {
    return (
      <View className="flex-1 items-center justify-center bg-warmwhite dark:bg-dark-bg px-8" style={{ paddingTop: insets.top }}>
        <Text className="text-lg font-bold text-charcoal dark:text-dark-text text-center">Moderator access required</Text>
        <Text className="text-sm text-asphalt dark:text-dark-textSecondary text-center mt-2">
          This area is only available to RoadProfile moderators.
        </Text>
      </View>
    );
  }

  return <Slot />;
}
