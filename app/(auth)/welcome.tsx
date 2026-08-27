import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Logo } from '../../components/brand/Logo';
import { Wordmark } from '../../components/brand/Wordmark';
import { Button } from '../../components/ui/Button';

export default function Welcome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      className="flex-1 bg-warmwhite dark:bg-dark-bg"
      contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }}
    >
      <View className="flex-1 px-8 items-center justify-center gap-6">
        <Logo size={72} />
        <Wordmark height={30} />
        <Text className="text-base text-asphalt dark:text-dark-textSecondary text-center max-w-sm mt-2">
          The public, crowdsourced history for every vehicle. Search a VIN, document what you know, and help the next
          owner see the whole story.
        </Text>
      </View>
      <View className="px-8 gap-3 pb-4">
        <Button label="Create account" onPress={() => router.push('/sign-up')} fullWidth size="lg" />
        <Button label="Sign in" variant="outline" onPress={() => router.push('/sign-in')} fullWidth size="lg" />
        <Text className="text-xs text-asphalt dark:text-dark-textSecondary text-center mt-3 px-4">
          By continuing you agree that vehicle histories on RoadProfile are public, crowdsourced, and may be
          incomplete or inaccurate.
        </Text>
      </View>
    </ScrollView>
  );
}
