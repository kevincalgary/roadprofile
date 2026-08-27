import React from 'react';
import { View, Pressable, Text } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../ui/Avatar';
import { useAuth } from '../../lib/auth-context';
import { Wordmark } from '../brand/Wordmark';

interface NavItem {
  key: string;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  href: '/' | '/search' | '/lists' | '/messages' | '/account';
}

const ITEMS: NavItem[] = [
  { key: 'home', label: 'Home', icon: 'home', href: '/' },
  { key: 'search', label: 'Search', icon: 'search', href: '/search' },
  { key: 'lists', label: 'Lists', icon: 'list', href: '/lists' },
  { key: 'messages', label: 'Messages', icon: 'message-circle', href: '/messages' },
  { key: 'account', label: 'Account', icon: 'user', href: '/account' },
];

export function Sidebar({ unreadMessages }: { unreadMessages: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();

  return (
    <View
      className="w-64 border-r border-black/5 dark:border-dark-border bg-white dark:bg-dark-surface justify-between"
      style={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 16 }}
    >
      <View>
        <View className="px-6 mb-8">
          <Wordmark height={26} />
        </View>
        <View className="gap-1 px-3">
          {ITEMS.map((item) => {
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Pressable
                key={item.key}
                onPress={() => router.push(item.href)}
                accessibilityRole="link"
                accessibilityLabel={item.label + (item.key === 'messages' && unreadMessages > 0 ? `, ${unreadMessages} unread` : '')}
                accessibilityState={{ selected: active }}
                className={['flex-row items-center gap-4 px-4 h-12 rounded-pill', active ? 'bg-mint-50 dark:bg-mint-900' : ''].join(' ')}
              >
                <Feather name={item.icon} size={20} color={active ? '#3B8C60' : '#5C6470'} />
                <Text className={['text-base', active ? 'text-mint-800 dark:text-mint-100 font-semibold' : 'text-charcoal dark:text-dark-text'].join(' ')}>
                  {item.label}
                </Text>
                {item.key === 'messages' && unreadMessages > 0 ? (
                  <View className="ml-auto w-2.5 h-2.5 rounded-full bg-danger" accessibilityElementsHidden />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>
      {profile ? (
        <Pressable
          onPress={() => router.push('/account')}
          accessibilityRole="link"
          accessibilityLabel="Your account"
          className="flex-row items-center gap-3 px-6 h-14"
        >
          <Avatar url={profile.avatar_url} name={profile.display_name} size={36} />
          <View className="flex-1">
            <Text numberOfLines={1} className="text-sm font-semibold text-charcoal dark:text-dark-text">
              {profile.display_name}
            </Text>
            <Text numberOfLines={1} className="text-xs text-asphalt dark:text-dark-textSecondary">
              @{profile.username}
            </Text>
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}
