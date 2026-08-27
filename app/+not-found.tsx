import React from 'react';
import { View, Text } from 'react-native';
import { Link, Stack } from 'expo-router';
import { Button } from '../components/ui/Button';

export default function NotFound() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <View className="flex-1 bg-warmwhite dark:bg-dark-bg items-center justify-center px-8 gap-4">
        <Text className="text-2xl font-extrabold text-charcoal dark:text-dark-text text-center">Page not found</Text>
        <Text className="text-sm text-asphalt dark:text-dark-textSecondary text-center">This page doesn't exist or may have been removed.</Text>
        <Link href="/" asChild>
          <Button label="Back to RoadProfile" />
        </Link>
      </View>
    </>
  );
}
