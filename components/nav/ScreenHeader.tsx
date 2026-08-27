import React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { CircularIconButton } from '../ui/CircularIconButton';

interface ScreenHeaderProps {
  title: string;
  showBell?: boolean;
  unreadNotifications?: number;
  right?: React.ReactNode;
}

export function ScreenHeader({ title, showBell, unreadNotifications = 0, right }: ScreenHeaderProps) {
  const router = useRouter();
  return (
    <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
      <Text accessibilityRole="header" className="text-3xl font-extrabold text-charcoal dark:text-dark-text">
        {title}
      </Text>
      <View className="flex-row items-center gap-2">
        {right}
        {showBell ? (
          <CircularIconButton
            icon="bell"
            accessibilityLabel={unreadNotifications > 0 ? `Notifications, ${unreadNotifications} unread` : 'Notifications'}
            onPress={() => router.push('/notifications')}
            badge={unreadNotifications > 0}
          />
        ) : null}
      </View>
    </View>
  );
}
