import React from 'react';
import { View, Text } from 'react-native';

type Tone = 'neutral' | 'mint' | 'amber' | 'danger';

const TONE_CLASSES: Record<Tone, string> = {
  neutral: 'bg-cardgray dark:bg-dark-card',
  mint: 'bg-mint-100 dark:bg-mint-800',
  amber: 'bg-amber-bg dark:bg-dark-card',
  danger: 'bg-danger-bg dark:bg-dark-card',
};

const TONE_TEXT_CLASSES: Record<Tone, string> = {
  neutral: 'text-asphalt dark:text-dark-textSecondary',
  mint: 'text-mint-800 dark:text-mint-100',
  amber: 'text-amber dark:text-amber',
  danger: 'text-danger dark:text-danger',
};

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  return (
    <View className={['px-2.5 py-1 rounded-pill self-start', TONE_CLASSES[tone]].join(' ')}>
      <Text className={['text-xs font-semibold', TONE_TEXT_CLASSES[tone]].join(' ')}>{label}</Text>
    </View>
  );
}

/** "Not verified by RoadProfile" — required wherever a self-reported relationship is shown. */
export function UnverifiedBadge() {
  return <Badge label="Not verified by RoadProfile" tone="amber" />;
}

export function CommunitySubmittedBadge() {
  return <Badge label="Community submitted" tone="neutral" />;
}

export function VerifiedDataBadge() {
  return <Badge label="Verified data" tone="mint" />;
}

export function DemoDataBadge() {
  return <Badge label="Demo data" tone="amber" />;
}
