import React from 'react';
import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: keyof typeof Feather.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon = 'inbox', title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View className="items-center justify-center px-8 py-16 gap-3">
      <View className="w-16 h-16 rounded-full bg-cardgray dark:bg-dark-card items-center justify-center mb-1">
        <Feather name={icon} size={28} color="#8A919B" />
      </View>
      <Text className="text-lg font-bold text-charcoal dark:text-dark-text text-center">{title}</Text>
      {description ? (
        <Text className="text-sm text-asphalt dark:text-dark-textSecondary text-center max-w-xs">{description}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <View className="mt-3">
          <Button label={actionLabel} onPress={onAction} variant="primary" />
        </View>
      ) : null}
    </View>
  );
}
