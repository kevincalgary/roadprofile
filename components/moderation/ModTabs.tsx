import React from 'react';
import { ScrollView, Pressable, Text } from 'react-native';

export type ModTab = 'reports' | 'vin' | 'duplicates' | 'users' | 'removals' | 'audit';

const TABS: { key: ModTab; label: string }[] = [
  { key: 'reports', label: 'Reports' },
  { key: 'vin', label: 'VIN corrections' },
  { key: 'duplicates', label: 'Duplicates' },
  { key: 'users', label: 'Users' },
  { key: 'removals', label: 'Removal history' },
  { key: 'audit', label: 'Audit log' },
];

export function ModTabs({ value, onChange }: { value: ModTab; onChange: (t: ModTab) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-5 mb-3" contentContainerStyle={{ gap: 8 }}>
      {TABS.map((t) => (
        <Pressable
          key={t.key}
          onPress={() => onChange(t.key)}
          accessibilityRole="tab"
          accessibilityState={{ selected: value === t.key }}
          className={['h-9 px-4 rounded-pill items-center justify-center border', value === t.key ? 'bg-mint border-mint' : 'border-asphalt/30 dark:border-dark-border'].join(' ')}
        >
          <Text className={['text-sm font-medium', value === t.key ? 'text-mint-900' : 'text-asphalt dark:text-dark-textSecondary'].join(' ')}>{t.label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
