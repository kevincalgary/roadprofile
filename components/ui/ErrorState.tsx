import React from 'react';
import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Button } from './Button';

export function ErrorState({ message = 'Something went wrong.', onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <View className="items-center justify-center px-8 py-16 gap-3" accessibilityLiveRegion="assertive">
      <View className="w-16 h-16 rounded-full bg-danger-bg items-center justify-center mb-1">
        <Feather name="alert-triangle" size={26} color="#C43D3D" />
      </View>
      <Text className="text-lg font-bold text-charcoal dark:text-dark-text text-center">We hit a snag</Text>
      <Text className="text-sm text-asphalt dark:text-dark-textSecondary text-center max-w-xs">{message}</Text>
      {onRetry ? (
        <View className="mt-3">
          <Button label="Try again" onPress={onRetry} variant="outline" />
        </View>
      ) : null}
    </View>
  );
}

export function InlineOfflineNotice() {
  return (
    <View className="mx-4 mb-2 px-4 py-3 rounded-xl bg-amber-bg flex-row items-center gap-2" accessibilityLiveRegion="polite">
      <Feather name="wifi-off" size={16} color="#B8791A" />
      <Text className="text-sm text-amber flex-1">You're offline. Showing the last loaded content.</Text>
    </View>
  );
}
