import React from 'react';
import { Pressable, Text } from 'react-native';

interface PillProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  color?: string;
  accessibilityLabel?: string;
}

export function Pill({ label, active, onPress, color, accessibilityLabel }: PillProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={onPress ? { selected: !!active } : undefined}
      className={[
        'h-9 px-4 rounded-pill flex-row items-center justify-center border',
        active ? 'bg-mint border-mint' : 'bg-transparent border-asphalt/30 dark:border-dark-border',
      ].join(' ')}
      style={color && !active ? { borderColor: color } : undefined}
    >
      <Text
        className={['text-sm font-medium', active ? 'text-mint-900' : 'text-asphalt dark:text-dark-textSecondary'].join(' ')}
        style={color && !active ? { color } : undefined}
      >
        {label}
      </Text>
    </Pressable>
  );
}
