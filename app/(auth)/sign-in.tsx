import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';
import { CircularIconButton } from '../../components/ui/CircularIconButton';
import { signInWithEmail, signInWithOAuth } from '../../lib/api/auth';

export default function SignIn() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    setError(null);
    setLoading(true);
    try {
      await signInWithEmail(email.trim(), password);
      router.replace('/');
    } catch (err: any) {
      setError(err?.message ?? 'Could not sign in. Check your email and password.');
    } finally {
      setLoading(false);
    }
  }

  async function handleOAuth(provider: 'apple' | 'google') {
    try {
      await signInWithOAuth(provider);
    } catch (err: any) {
      setError(err?.message ?? `${provider} sign-in is not available yet.`);
    }
  }

  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        className="flex-1 bg-warmwhite dark:bg-dark-bg"
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }}
      >
        <View className="px-5 flex-row items-center mb-4">
          <CircularIconButton icon="arrow-left" accessibilityLabel="Back" onPress={() => router.back()} />
        </View>
        <View className="px-6 gap-5">
          <Text className="text-3xl font-extrabold text-charcoal dark:text-dark-text">Welcome back</Text>
          <TextField
            label="Email"
            required
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
          />
          <TextField
            label="Password"
            required
            secureTextEntry
            autoComplete="password"
            value={password}
            onChangeText={setPassword}
          />
          {error ? <Text className="text-sm text-danger">{error}</Text> : null}
          <Link href="/forgot-password" className="self-end">
            <Text className="text-sm text-mint-600 font-medium">Forgot password?</Text>
          </Link>
          <Button label="Sign in" onPress={handleSignIn} loading={loading} disabled={!email || !password} fullWidth size="lg" />

          <View className="flex-row items-center gap-3 my-2">
            <View className="flex-1 h-px bg-black/10 dark:bg-white/10" />
            <Text className="text-xs text-asphalt dark:text-dark-textSecondary">or continue with</Text>
            <View className="flex-1 h-px bg-black/10 dark:bg-white/10" />
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Button label="Apple" variant="outline" icon={<Feather name="smartphone" size={16} color="#1A1D1F" />} onPress={() => handleOAuth('apple')} fullWidth />
            </View>
            <View className="flex-1">
              <Button label="Google" variant="outline" icon={<Feather name="chrome" size={16} color="#1A1D1F" />} onPress={() => handleOAuth('google')} fullWidth />
            </View>
          </View>

          <View className="flex-row justify-center gap-1 mt-4">
            <Text className="text-sm text-asphalt dark:text-dark-textSecondary">New to RoadProfile?</Text>
            <Link href="/sign-up">
              <Text className="text-sm text-mint-600 font-semibold">Create an account</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
