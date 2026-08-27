import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { ScreenHeader } from '../../../components/nav/ScreenHeader';
import { Avatar } from '../../../components/ui/Avatar';
import { Button } from '../../../components/ui/Button';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { NAV_CLEARANCE } from '../../../components/nav/AppShell';
import { useAuth } from '../../../lib/auth-context';
import { useUnreadCounts } from '../../../lib/hooks/useUnreadCounts';

const LINKS: { label: string; icon: keyof typeof Feather.glyphMap; href: string }[] = [
  { label: 'Edit Profile', icon: 'edit-3', href: '/account/edit' },
  { label: 'Saved records', icon: 'bookmark', href: '/account/saved' },
  { label: 'Drafts', icon: 'file-text', href: '/account/drafts' },
  { label: 'Notification preferences', icon: 'bell', href: '/account/notification-settings' },
  { label: 'Message privacy', icon: 'lock', href: '/account/message-privacy' },
  { label: 'Blocked users', icon: 'slash', href: '/account/blocked-users' },
  { label: 'Download my data', icon: 'download', href: '/account/download-data' },
];

export default function Account() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, isModerator, signOut } = useAuth();
  const { unreadNotifications } = useUnreadCounts();
  const [signOutConfirm, setSignOutConfirm] = useState(false);

  return (
    <View className="flex-1 bg-warmwhite dark:bg-dark-bg" style={{ paddingTop: insets.top }}>
      <ScreenHeader title="Account" showBell unreadNotifications={unreadNotifications} />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: NAV_CLEARANCE }}>
        <Pressable
          onPress={() => profile && router.push(`/u/${profile.username}`)}
          accessibilityRole="link"
          className="flex-row items-center gap-4 py-4"
        >
          <Avatar url={profile?.avatar_url} name={profile?.display_name ?? '?'} size={64} />
          <View className="flex-1">
            <Text className="text-lg font-bold text-charcoal dark:text-dark-text">{profile?.display_name}</Text>
            <Text className="text-sm text-asphalt dark:text-dark-textSecondary">@{profile?.username}</Text>
            <Text className="text-xs text-mint-600 font-medium mt-1">View public profile →</Text>
          </View>
        </Pressable>

        {isModerator ? (
          <Pressable
            onPress={() => router.push('/moderation')}
            accessibilityRole="link"
            className="flex-row items-center gap-3 h-14 px-4 rounded-2xl bg-mint-50 dark:bg-mint-900 mb-3"
          >
            <Feather name="shield" size={18} color="#3B8C60" />
            <Text className="text-mint-800 dark:text-mint-100 font-semibold flex-1">Moderator dashboard</Text>
            <Feather name="chevron-right" size={18} color="#3B8C60" />
          </Pressable>
        ) : null}

        <View className="rounded-2xl bg-white dark:bg-dark-card border border-black/5 dark:border-dark-border overflow-hidden">
          {LINKS.map((link, i) => (
            <Pressable
              key={link.href}
              onPress={() => router.push(link.href as any)}
              accessibilityRole="link"
              className={['flex-row items-center gap-3 h-14 px-4', i < LINKS.length - 1 ? 'border-b border-black/5 dark:border-dark-border' : ''].join(' ')}
            >
              <Feather name={link.icon} size={18} color="#5C6470" />
              <Text className="text-charcoal dark:text-dark-text flex-1">{link.label}</Text>
              <Feather name="chevron-right" size={18} color="#8A919B" />
            </Pressable>
          ))}
        </View>

        <View className="mt-6 gap-3">
          <Button label="Sign Out" variant="outline" onPress={() => setSignOutConfirm(true)} fullWidth />
          <Pressable onPress={() => router.push('/account/delete-account')} accessibilityRole="link" className="items-center py-2">
            <Text className="text-sm text-danger font-medium">Delete Account</Text>
          </Pressable>
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={signOutConfirm}
        title="Sign out?"
        confirmLabel="Sign out"
        onConfirm={() => {
          setSignOutConfirm(false);
          signOut();
        }}
        onCancel={() => setSignOutConfirm(false)}
      />
    </View>
  );
}
