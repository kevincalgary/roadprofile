import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';

interface Option<T extends string> {
  value: T;
  label: string;
}

export function SegmentedPicker<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label?: string;
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View>
      {label ? <Text className="text-sm font-medium text-charcoal dark:text-dark-text mb-1.5">{label}</Text> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {options.map((o) => (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: value === o.value }}
            className={['h-10 px-4 rounded-pill items-center justify-center border', value === o.value ? 'bg-mint border-mint' : 'border-asphalt/30 dark:border-dark-border'].join(' ')}
          >
            <Text className={value === o.value ? 'text-mint-900 font-medium text-sm' : 'text-asphalt dark:text-dark-textSecondary text-sm'}>{o.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
