import React from 'react';
import { Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface CircularIconButtonProps {
  icon: keyof typeof Feather.glyphMap;
  onPress?: () => void;
  size?: number;
  color?: string;
  backgroundClassName?: string;
  accessibilityLabel: string;
  badge?: boolean;
}

export function CircularIconButton({
  icon,
  onPress,
  size = 44,
  color = '#1A1D1F',
  backgroundClassName = 'bg-cardgray dark:bg-dark-card',
  accessibilityLabel,
  badge,
}: CircularIconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      style={{ width: Math.max(size, 44), height: Math.max(size, 44), borderRadius: Math.max(size, 44) / 2 }}
      className={['items-center justify-center', backgroundClassName].join(' ')}
    >
      <Feather name={icon} size={size * 0.45} color={color} />
      {badge ? (
        <View
          className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-danger border-2 border-warmwhite dark:border-dark-bg"
          accessibilityElementsHidden
        />
      ) : null}
    </Pressable>
  );
}
