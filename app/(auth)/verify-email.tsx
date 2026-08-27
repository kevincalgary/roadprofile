import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../lib/auth-context';
import { resendVerificationEmail } from '../../lib/api/auth';

export default function VerifyEmail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, session } = useAuth();
  const [resent, setResent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleResend() {
    if (!user?.email) return;
    setLoading(true);
    try {
      await resendVerificationEmail(user.email);
      setResent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-warmwhite dark:bg-dark-bg items-center justify-center px-8" style={{ paddingTop: insets.top }}>
      <View className="w-16 h-16 rounded-full bg-mint-100 dark:bg-mint-800 items-center justify-center mb-5">
        <Feather name="mail" size={28} color="#3B8C60" />
      </View>
      <Text className="text-2xl font-extrabold text-charcoal dark:text-dark-text text-center mb-2">Check your inbox</Text>
      <Text className="text-sm text-asphalt dark:text-dark-textSecondary text-center mb-8 max-w-xs">
        We sent a verification link to {user?.email ?? 'your email'}. Tap it, then continue below.
      </Text>
      <View className="w-full gap-3">
        <Button label="I've verified — continue" onPress={() => router.replace('/onboarding')} fullWidth size="lg" disabled={!session} />
        <Button label={resent ? 'Email sent' : 'Resend verification email'} variant="outline" onPress={handleResend} loading={loading} fullWidth />
      </View>
    </View>
  );
}
