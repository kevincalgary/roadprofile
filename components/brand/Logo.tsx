import React from 'react';
import { View, Text } from 'react-native';

/**
 * Original "RP" app-icon concept: a rounded-square mile-marker badge in
 * charcoal, with the RP monogram in mint and a single diagonal mint stripe
 * evoking a road shoulder line. Used for the icon assets in assets/ (see
 * docs/BRANDING.md for the export spec) and inline as a loading mark.
 */
export function Logo({ size = 48 }: { size?: number }) {
  return (
    <View
      style={{ width: size, height: size, borderRadius: size * 0.28 }}
      className="bg-charcoal items-center justify-center overflow-hidden"
      accessibilityLabel="RoadProfile logo"
    >
      <View
        style={{
          position: 'absolute',
          width: size * 1.4,
          height: size * 0.22,
          backgroundColor: '#62C58F',
          transform: [{ rotate: '-35deg' }],
          top: size * 0.62,
          left: -size * 0.2,
        }}
      />
      <Text style={{ fontSize: size * 0.42 }} className="font-extrabold text-white">
        RP
      </Text>
    </View>
  );
}
