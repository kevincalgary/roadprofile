import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';
import { CircularIconButton } from '../../components/ui/CircularIconButton';
import { sendPasswordReset } from '../../lib/api/auth';

export default function ForgotPassword() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      await sendPasswordReset(email.trim());
      setSent(true);
    } catch (err: any) {
      setError(err?.message ?? 'Could not send reset email.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-warmwhite dark:bg-dark-bg" style={{ paddingTop: insets.top + 12 }}>
      <View className="px-5 mb-4">
        <CircularIconButton icon="arrow-left" accessibilityLabel="Back" onPress={() => router.back()} />
      </View>
      <View className="px-6 gap-5">
        <Text className="text-3xl font-extrabold text-charcoal dark:text-dark-text">Reset your password</Text>
        <Text className="text-sm text-asphalt dark:text-dark-textSecondary">
          Enter your account email and we'll send you a link to reset your password.
        </Text>
        {sent ? (
          <Text className="text-sm text-mint-700 dark:text-mint-300">
            If an account exists for {email}, a reset link is on its way.
          </Text>
        ) : (
          <>
            <TextField label="Email" required autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
            {error ? <Text className="text-sm text-danger">{error}</Text> : null}
            <Button label="Send reset link" onPress={handleSubmit} loading={loading} disabled={!email} fullWidth size="lg" />
          </>
        )}
      </View>
    </View>
  );
}
