import React from 'react';
import { View, Pressable } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../ui/Avatar';
import { useAuth } from '../../lib/auth-context';

interface NavItem {
  key: string;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  href: '/' | '/lists' | '/messages' | '/account';
}

const ITEMS: NavItem[] = [
  { key: 'home', label: 'Home', icon: 'home', href: '/' },
  { key: 'lists', label: 'Lists', icon: 'list', href: '/lists' },
  { key: 'messages', label: 'Messages', icon: 'message-circle', href: '/messages' },
  { key: 'account', label: 'Account', icon: 'user', href: '/account' },
];

export function BottomNav({ unreadMessages }: { unreadMessages: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();

  return (
    <View pointerEvents="box-none" className="absolute left-0 right-0 bottom-0 items-center px-4" style={{ paddingBottom: insets.bottom + 10 }}>
      <View className="flex-row items-center gap-2">
        <View
          className="flex-row items-center bg-charcoal dark:bg-dark-surface rounded-pill px-2 py-2 gap-1"
          style={{ shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 8 }}
        >
          {ITEMS.map((item) => {
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            const showAvatar = item.key === 'account' && profile;
            return (
              <Pressable
                key={item.key}
                onPress={() => router.push(item.href)}
                accessibilityRole="tab"
                accessibilityLabel={item.label + (item.key === 'messages' && unreadMessages > 0 ? `, ${unreadMessages} unread` : '')}
                accessibilityState={{ selected: active }}
                className={['w-12 h-12 rounded-full items-center justify-center', active ? 'bg-mint' : ''].join(' ')}
              >
                {showAvatar ? (
                  <Avatar url={profile?.avatar_url} name={profile?.display_name ?? '?'} size={30} />
                ) : (
                  <Feather name={item.icon} size={22} color={active ? '#0F2518' : '#F2F0EC'} />
                )}
                {item.key === 'messages' && unreadMessages > 0 ? (
                  <View className="absolute top-1.5 right-2.5 w-2 h-2 rounded-full bg-danger" accessibilityElementsHidden />
                ) : null}
              </Pressable>
            );
          })}
        </View>
        <Pressable
          onPress={() => router.push('/search')}
          accessibilityRole="button"
          accessibilityLabel="Search"
          accessibilityState={{ selected: pathname.startsWith('/search') }}
          className={['w-14 h-14 rounded-full items-center justify-center', pathname.startsWith('/search') ? 'bg-mint-600' : 'bg-mint'].join(' ')}
          style={{ shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 8 }}
        >
          <Feather name="search" size={22} color="#0F2518" />
        </Pressable>
      </View>
    </View>
  );
}
