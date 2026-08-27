import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { useAuth } from '../../lib/auth-context';
import { useDebouncedValue } from '../../lib/hooks/usePaginatedQuery';
import { isUsernameAvailable, createProfile } from '../../lib/api/profiles';
import { compressImage, uploadWithRetry } from '../../lib/api/uploads';
import { supabase } from '../../lib/supabase';

const USERNAME_RE = /^[a-zA-Z0-9_]{3,24}$/;

export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, refreshProfile } = useAuth();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [avatarLocalUri, setAvatarLocalUri] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedUsername = useDebouncedValue(username, 400);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');

  React.useEffect(() => {
    if (!debouncedUsername) {
      setUsernameStatus('idle');
      return;
    }
    if (!USERNAME_RE.test(debouncedUsername)) {
      setUsernameStatus('invalid');
      return;
    }
    let cancelled = false;
    setUsernameStatus('checking');
    isUsernameAvailable(debouncedUsername).then((available) => {
      if (!cancelled) setUsernameStatus(available ? 'available' : 'taken');
    });
    return () => {
      cancelled = true;
    };
  }, [debouncedUsername]);

  async function pickAvatar() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarLocalUri(result.assets[0].uri);
    }
  }

  const canSubmit = usernameStatus === 'available' && displayName.trim().length > 0 && !submitting;

  async function handleSubmit() {
    if (!canSubmit || !user) return;
    setSubmitting(true);
    setError(null);
    try {
      let avatarUrl: string | undefined;
      if (avatarLocalUri) {
        setUploadingAvatar(true);
        const compressed = await compressImage(avatarLocalUri, 512);
        const { publicUrl } = await uploadWithRetry('avatars', compressed.uri, 'avatar.jpg');
        avatarUrl = publicUrl;
        setUploadingAvatar(false);
      }
      await createProfile({
        username: debouncedUsername,
        displayName: displayName.trim(),
        avatarUrl,
        locationText: location.trim() || undefined,
        bio: bio.trim() || undefined,
      });
      await supabase.from('users').update({ onboarding_completed: true }).eq('id', user.id);
      await refreshProfile();
      router.replace('/(app)');
    } catch (err: any) {
      setError(err?.message ?? 'Could not finish setting up your account.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-warmwhite dark:bg-dark-bg"
      contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }}
    >
      <View className="px-6 gap-5">
        <Text className="text-3xl font-extrabold text-charcoal dark:text-dark-text">Set up your profile</Text>
        <Text className="text-sm text-asphalt dark:text-dark-textSecondary -mt-2">
          Your username and display name are public. Never include personal contact information.
        </Text>

        <Pressable onPress={pickAvatar} accessibilityRole="button" accessibilityLabel="Choose profile photo" className="self-center my-2">
          <View className="relative">
            <Avatar url={avatarLocalUri} name={displayName || '?'} size={96} />
            <View className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-mint items-center justify-center border-2 border-warmwhite dark:border-dark-bg">
              {uploadingAvatar ? <ActivityIndicator size="small" color="#0F2518" /> : <Feather name="camera" size={14} color="#0F2518" />}
            </View>
          </View>
        </Pressable>

        <TextField
          label="Username"
          required
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
          helperText="3-24 characters: letters, numbers, underscores. Case-insensitive and unique."
          error={
            usernameStatus === 'taken'
              ? 'That username is taken.'
              : usernameStatus === 'invalid'
                ? 'Use 3-24 letters, numbers, or underscores.'
                : undefined
          }
        />
        {usernameStatus === 'checking' ? <Text className="text-xs text-asphalt -mt-3">Checking availability…</Text> : null}
        {usernameStatus === 'available' ? <Text className="text-xs text-mint-600 -mt-3">@{debouncedUsername} is available</Text> : null}

        <TextField label="Display name" required value={displayName} onChangeText={setDisplayName} />
        <TextField label="General location" placeholder="City, region" value={location} onChangeText={setLocation} helperText="City/region only — never a precise address." />
        <TextField
          label="Short bio"
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={3}
          style={{ height: 88, textAlignVertical: 'top', paddingTop: 12 }}
        />

        {error ? <Text className="text-sm text-danger">{error}</Text> : null}

        <Button label="Finish setup" onPress={handleSubmit} loading={submitting} disabled={!canSubmit} fullWidth size="lg" />
      </View>
    </ScrollView>
  );
}
