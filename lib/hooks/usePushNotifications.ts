import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { supabase } from '../supabase';
import { useAuth } from '../auth-context';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
  }),
});

/**
 * Registers the device for push notifications and stores the Expo push
 * token on the signed-in user's account row. No-ops on web (no push
 * transport there yet) and in environments without a physical device.
 */
export function usePushNotifications() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || Platform.OS === 'web' || !Device.isDevice) return;

    (async () => {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') return;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.DEFAULT,
          lightColor: '#62C58F',
        });
      }

      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      const tokenResponse = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
      await supabase.from('users').update({ push_token: tokenResponse.data }).eq('id', user.id);
    })().catch((err) => console.warn('Push registration failed', err));
  }, [user]);
}
