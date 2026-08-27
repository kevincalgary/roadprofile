import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Pressable, Linking } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';
import { CircularIconButton } from '../../components/ui/CircularIconButton';
import { signUpWithEmail } from '../../lib/api/auth';
import { supabase } from '../../lib/supabase';

function Checkbox({ checked, onToggle, children }: { checked: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <Pressable onPress={onToggle} accessibilityRole="checkbox" accessibilityState={{ checked }} className="flex-row items-start gap-3 py-1">
      <View
        className={['w-6 h-6 rounded-md items-center justify-center border mt-0.5', checked ? 'bg-mint border-mint' : 'border-asphalt/40'].join(' ')}
      >
        {checked ? <Feather name="check" size={14} color="#0F2518" /> : null}
      </View>
      <Text className="flex-1 text-sm text-charcoal dark:text-dark-text">{children}</Text>
    </Pressable>
  );
}

export default function SignUp() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [tosAccepted, setTosAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [guidelinesAccepted, setGuidelinesAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = email && password.length >= 8 && ageConfirmed && tosAccepted && privacyAccepted && guidelinesAccepted;

  async function handleSignUp() {
    if (!canSubmit) return;
    setError(null);
    setLoading(true);
    try {
      await signUpWithEmail(email.trim(), password);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const now = new Date().toISOString();
        await supabase
          .from('users')
          .update({
            minimum_age_confirmed: true,
            terms_accepted_at: now,
            privacy_accepted_at: now,
            guidelines_accepted_at: now,
          })
          .eq('id', user.id);
      }
      router.push('/verify-email');
    } catch (err: any) {
      setError(err?.message ?? 'Could not create your account.');
    } finally {
      setLoading(false);
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
          <Text className="text-3xl font-extrabold text-charcoal dark:text-dark-text">Create your account</Text>

          <TextField label="Email" required autoCapitalize="none" keyboardType="email-address" autoComplete="email" value={email} onChangeText={setEmail} />
          <TextField
            label="Password"
            required
            secureTextEntry
            autoComplete="new-password"
            helperText="At least 8 characters."
            value={password}
            onChangeText={setPassword}
          />

          <View className="gap-1 mt-2">
            <Checkbox checked={ageConfirmed} onToggle={() => setAgeConfirmed((v) => !v)}>
              I confirm I am at least 16 years old.
            </Checkbox>
            <Checkbox checked={tosAccepted} onToggle={() => setTosAccepted((v) => !v)}>
              I agree to the{' '}
              <Text className="text-mint-600 font-medium" onPress={() => Linking.openURL('https://roadprofile.app/legal/terms')}>
                Terms of Service
              </Text>
              .
            </Checkbox>
            <Checkbox checked={privacyAccepted} onToggle={() => setPrivacyAccepted((v) => !v)}>
              I agree to the{' '}
              <Text className="text-mint-600 font-medium" onPress={() => Linking.openURL('https://roadprofile.app/legal/privacy')}>
                Privacy Policy
              </Text>
              .
            </Checkbox>
            <Checkbox checked={guidelinesAccepted} onToggle={() => setGuidelinesAccepted((v) => !v)}>
              I agree to follow the{' '}
              <Text className="text-mint-600 font-medium" onPress={() => Linking.openURL('https://roadprofile.app/legal/guidelines')}>
                Community Guidelines
              </Text>
              , including never posting a vehicle owner's personal information.
            </Checkbox>
          </View>

          {error ? <Text className="text-sm text-danger">{error}</Text> : null}

          <Button label="Create account" onPress={handleSignUp} loading={loading} disabled={!canSubmit} fullWidth size="lg" />

          <View className="flex-row justify-center gap-1 mt-2">
            <Text className="text-sm text-asphalt dark:text-dark-textSecondary">Already have an account?</Text>
            <Link href="/sign-in">
              <Text className="text-sm text-mint-600 font-semibold">Sign in</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
