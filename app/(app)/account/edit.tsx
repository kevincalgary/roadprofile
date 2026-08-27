import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { TextField } from '../../../components/ui/TextField';
import { Button } from '../../../components/ui/Button';
import { Avatar } from '../../../components/ui/Avatar';
import { CircularIconButton } from '../../../components/ui/CircularIconButton';
import { useAuth } from '../../../lib/auth-context';
import { updateProfile } from '../../../lib/api/profiles';
import { compressImage, uploadWithRetry } from '../../../lib/api/uploads';

export default function EditProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, refreshProfile } = useAuth();

  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [location, setLocation] = useState(profile?.location_text ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [avatarLocalUri, setAvatarLocalUri] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pickAvatar() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.9 });
    if (!result.canceled && result.assets[0]) setAvatarLocalUri(result.assets[0].uri);
  }

  async function handleSave() {
    setSaving(true);
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
      await updateProfile({ displayName: displayName.trim(), locationText: location.trim(), bio: bio.trim(), avatarUrl });
      await refreshProfile();
      router.back();
    } catch (err: any) {
      setError(err?.message ?? 'Could not save your profile.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView className="flex-1 bg-warmwhite dark:bg-dark-bg" contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 40 }}>
      <View className="px-5 mb-2"><CircularIconButton icon="arrow-left" accessibilityLabel="Back" onPress={() => router.back()} /></View>
      <View className="px-6 gap-5">
        <Text className="text-3xl font-extrabold text-charcoal dark:text-dark-text">Edit profile</Text>

        <Pressable onPress={pickAvatar} accessibilityRole="button" accessibilityLabel="Change profile photo" className="self-center my-2">
          <View className="relative">
            <Avatar url={avatarLocalUri ?? profile?.avatar_url} name={profile?.display_name ?? '?'} size={96} />
            <View className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-mint items-center justify-center border-2 border-warmwhite dark:border-dark-bg">
              {uploadingAvatar ? <ActivityIndicator size="small" color="#0F2518" /> : <Feather name="camera" size={14} color="#0F2518" />}
            </View>
          </View>
        </Pressable>

        <TextField label="Username" value={`@${profile?.username ?? ''}`} editable={false} helperText="Usernames can't be changed yet." />
        <TextField label="Display name" required value={displayName} onChangeText={setDisplayName} />
        <TextField label="General location" value={location} onChangeText={setLocation} helperText="City/region only." />
        <TextField label="Bio" value={bio} onChangeText={setBio} multiline numberOfLines={3} style={{ height: 88, textAlignVertical: 'top', paddingTop: 12 }} />

        {error ? <Text className="text-sm text-danger">{error}</Text> : null}

        <Button label="Save changes" onPress={handleSave} loading={saving} fullWidth size="lg" />
      </View>
    </ScrollView>
  );
}
