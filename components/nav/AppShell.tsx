import React from 'react';
import { View, useWindowDimensions, Platform } from 'react-native';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { useUnreadCounts } from '../../lib/hooks/useUnreadCounts';

const DESKTOP_BREAKPOINT = 900;

/**
 * Wraps the authenticated app's screen content with the navigation shell:
 * a left sidebar on wide/web viewports, a floating pill bottom nav with a
 * separate circular search button on phones. Content gets bottom padding so
 * the floating nav never covers the last item on a page.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= DESKTOP_BREAKPOINT;
  const { unreadMessages } = useUnreadCounts();

  if (isDesktop) {
    return (
      <View className="flex-1 flex-row bg-warmwhite dark:bg-dark-bg">
        <Sidebar unreadMessages={unreadMessages} />
        <View className="flex-1">{children}</View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-warmwhite dark:bg-dark-bg">
      <View className="flex-1">{children}</View>
      <BottomNav unreadMessages={unreadMessages} />
    </View>
  );
}

/** Bottom padding to reserve under scrollable content so the floating nav never overlaps it. */
export const NAV_CLEARANCE = 96;
