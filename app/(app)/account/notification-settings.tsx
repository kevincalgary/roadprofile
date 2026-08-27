import React, { useState } from 'react';
import { View, Text, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CircularIconButton } from '../../../components/ui/CircularIconButton';
import { useAuth } from '../../../lib/auth-context';
import { supabase } from '../../../lib/supabase';
import type { AccountSettings } from '../../../lib/types/database';

const TOGGLES: { key: keyof AccountSettings; label: string }[] = [
  { key: 'notify_new_follower', label: 'New follower' },
  { key: 'notify_comment', label: 'New comment' },
  { key: 'notify_comment_reply', label: 'Comment replies' },
  { key: 'notify_mention', label: 'Mentions' },
  { key: 'notify_list_invitation', label: 'List invitations' },
  { key: 'notify_followed_vehicle_contribution', label: 'New contributions to vehicles you follow' },
  { key: 'notify_record_correction', label: 'Record corrections' },
  { key: 'notify_moderation_update', label: 'Moderation updates' },
  { key: 'notify_message_request', label: 'Message requests' },
];

export default function NotificationSettings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, account, refreshProfile } = useAuth();
  const [local, setLocal] = useState<Partial<AccountSettings>>(account ?? {});

  async function handleToggle(key: keyof AccountSettings, value: boolean) {
    setLocal((prev) => ({ ...prev, [key]: value }));
    if (!user) return;
    await supabase.from('users').update({ [key]: value }).eq('id', user.id);
    refreshProfile();
  }

  return (
    <View className="flex-1 bg-warmwhite dark:bg-dark-bg" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center gap-3 px-5 pt-4 pb-2">
        <CircularIconButton icon="arrow-left" accessibilityLabel="Back" onPress={() => router.back()} />
        <Text className="text-2xl font-extrabold text-charcoal dark:text-dark-text">Notifications</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        {TOGGLES.map((t) => (
          <View key={t.key} className="flex-row items-center justify-between py-3 border-b border-black/5 dark:border-dark-border">
            <Text className="text-charcoal dark:text-dark-text flex-1">{t.label}</Text>
            <Switch
              value={!!local[t.key]}
              onValueChange={(v) => handleToggle(t.key, v)}
              trackColor={{ true: '#62C58F' }}
              accessibilityLabel={t.label}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
