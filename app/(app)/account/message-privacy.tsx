import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { CircularIconButton } from '../../../components/ui/CircularIconButton';
import { useAuth } from '../../../lib/auth-context';
import { supabase } from '../../../lib/supabase';
import type { MessagePrivacy } from '../../../lib/types/database';

const OPTIONS: { value: MessagePrivacy; label: string; description: string }[] = [
  { value: 'everyone', label: 'Everyone', description: 'Any registered user can message you. Messages from people you don\'t follow arrive as requests.' },
  { value: 'followed_only', label: 'People you follow', description: 'Only users you follow can start a conversation with you.' },
  { value: 'no_one', label: 'No one', description: 'No one can start a new conversation with you.' },
];

export default function MessagePrivacySettings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, account, refreshProfile } = useAuth();
  const [value, setValue] = useState<MessagePrivacy>(account?.message_privacy ?? 'everyone');

  async function handleSelect(v: MessagePrivacy) {
    setValue(v);
    if (!user) return;
    await supabase.from('users').update({ message_privacy: v }).eq('id', user.id);
    refreshProfile();
  }

  return (
    <View className="flex-1 bg-warmwhite dark:bg-dark-bg" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center gap-3 px-5 pt-4 pb-2">
        <CircularIconButton icon="arrow-left" accessibilityLabel="Back" onPress={() => router.back()} />
        <Text className="text-2xl font-extrabold text-charcoal dark:text-dark-text">Message privacy</Text>
      </View>
      <View className="px-5 gap-3 mt-2">
        {OPTIONS.map((o) => (
          <Pressable
            key={o.value}
            onPress={() => handleSelect(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: value === o.value }}
            className={['rounded-2xl border p-4', value === o.value ? 'border-mint bg-mint-50 dark:bg-mint-900' : 'border-black/5 dark:border-dark-border bg-white dark:bg-dark-card'].join(' ')}
          >
            <View className="flex-row items-center justify-between">
              <Text className="font-semibold text-charcoal dark:text-dark-text">{o.label}</Text>
              {value === o.value ? <Feather name="check-circle" size={18} color="#3B8C60" /> : null}
            </View>
            <Text className="text-sm text-asphalt dark:text-dark-textSecondary mt-1">{o.description}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
