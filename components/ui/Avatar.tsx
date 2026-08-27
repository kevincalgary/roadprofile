import React from 'react';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';

interface AvatarProps {
  url?: string | null;
  name: string;
  size?: number;
}

export function Avatar({ url, name, size = 44 }: AvatarProps) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        accessibilityLabel={`${name}'s avatar`}
        contentFit="cover"
        transition={150}
      />
    );
  }

  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className="bg-mint-200 dark:bg-mint-700 items-center justify-center"
      accessible
      accessibilityLabel={`${name}'s avatar`}
    >
      <Text className="text-mint-900 dark:text-mint-50 font-semibold" style={{ fontSize: size * 0.38 }}>
        {initials || '?'}
      </Text>
    </View>
  );
}
