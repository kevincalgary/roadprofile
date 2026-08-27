import React from 'react';
import { ScrollView } from 'react-native';
import { Pill } from '../ui/Pill';
import { CATEGORY_LABELS } from '../../lib/format';
import { categoryColors } from '../../lib/theme';
import type { RecordCategory } from '../../lib/types/database';

export type TimelineFilter = 'all' | RecordCategory;

const FILTERS: { key: TimelineFilter; label: string }[] = [
  { key: 'all', label: 'All History' },
  { key: 'maintenance', label: CATEGORY_LABELS.maintenance },
  { key: 'repair', label: CATEGORY_LABELS.repair },
  { key: 'inspection', label: CATEGORY_LABELS.inspection },
  { key: 'damage', label: CATEGORY_LABELS.damage },
  { key: 'modification', label: CATEGORY_LABELS.modification },
  { key: 'mileage_update', label: 'Mileage' },
  { key: 'ownership_experience', label: 'Ownership Experiences' },
  { key: 'sale_auction', label: 'Sales or Auctions' },
  { key: 'photo_sighting', label: 'Photos' },
];

export function TimelineFilterBar({ value, onChange }: { value: TimelineFilter; onChange: (f: TimelineFilter) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}>
      {FILTERS.map((f) => (
        <Pill key={f.key} label={f.label} active={value === f.key} onPress={() => onChange(f.key)} color={f.key !== 'all' ? categoryColors[f.key] : undefined} />
      ))}
    </ScrollView>
  );
}
