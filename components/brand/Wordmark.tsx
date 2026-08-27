import React from 'react';
import { View, Text } from 'react-native';

/**
 * Original RoadProfile wordmark: "Road" in the primary text color, "Profile"
 * in the mint accent, sitting on a short dashed underline that reads as a
 * road lane-marker beneath the wordmark. No relation to any other
 * automotive brand's logotype.
 */
export function Wordmark({ height = 24, dark }: { height?: number; dark?: boolean }) {
  const fontSize = height;
  return (
    <View>
      <View className="flex-row items-baseline">
        <Text style={{ fontSize }} className={dark ? 'font-extrabold text-dark-text' : 'font-extrabold text-charcoal dark:text-dark-text'}>
          Road
        </Text>
        <Text style={{ fontSize }} className="font-extrabold text-mint-500">
          Profile
        </Text>
      </View>
      <View className="flex-row gap-1 mt-1 ml-0.5">
        {[10, 6, 10, 6].map((w, i) => (
          <View key={i} style={{ width: w, height: 3, borderRadius: 2 }} className="bg-mint-400" />
        ))}
      </View>
    </View>
  );
}
