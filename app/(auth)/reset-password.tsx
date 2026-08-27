import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';
import { updatePassword } from '../../lib/api/auth';

export default function ResetPassword() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const canSubmit = password.length >= 8 && password === confirm;

  async function handleSubmit() {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      await updatePassword(password);
      setDone(true);
    } catch (err: any) {
      setError(err?.message ?? 'Could not update your password. The reset link may have expired.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-warmwhite dark:bg-dark-bg items-center justify-center px-8" style={{ paddingTop: insets.top }}>
      <Text className="text-2xl font-extrabold text-charcoal dark:text-dark-text mb-6 text-center">
        {done ? 'Password updated' : 'Set a new password'}
      </Text>
      {done ? (
        <Button label="Continue" onPress={() => router.replace('/')} fullWidth size="lg" />
      ) : (
        <View className="w-full gap-4">
          <TextField label="New password" required secureTextEntry helperText="At least 8 characters." value={password} onChangeText={setPassword} />
          <TextField label="Confirm password" required secureTextEntry value={confirm} onChangeText={setConfirm} />
          {error ? <Text className="text-sm text-danger">{error}</Text> : null}
          <Button label="Update password" onPress={handleSubmit} loading={loading} disabled={!canSubmit} fullWidth size="lg" />
        </View>
      )}
    </View>
  );
}
