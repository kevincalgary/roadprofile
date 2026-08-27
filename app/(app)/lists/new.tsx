import React, { useState } from 'react';
import { View, Text, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TextField } from '../../../components/ui/TextField';
import { Button } from '../../../components/ui/Button';
import { CircularIconButton } from '../../../components/ui/CircularIconButton';
import { createList } from '../../../lib/api/lists';

export default function NewList() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const list = await createList({ name: name.trim(), description: description.trim() || undefined, isPublic });
      router.replace(`/list/${list.id}`);
    } catch (err: any) {
      setError(err?.message ?? 'Could not create this list.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView className="flex-1 bg-warmwhite dark:bg-dark-bg" contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 40 }}>
      <View className="px-5 mb-2"><CircularIconButton icon="arrow-left" accessibilityLabel="Back" onPress={() => router.back()} /></View>
      <View className="px-6 gap-5">
        <Text className="text-3xl font-extrabold text-charcoal dark:text-dark-text">New list</Text>
        <TextField label="Name" required value={name} onChangeText={setName} />
        <TextField label="Description" value={description} onChangeText={setDescription} multiline numberOfLines={3} style={{ height: 88, textAlignVertical: 'top', paddingTop: 12 }} />
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="font-medium text-charcoal dark:text-dark-text">Public list</Text>
            <Text className="text-xs text-asphalt dark:text-dark-textSecondary">Anyone can find and follow a public list.</Text>
          </View>
          <Switch value={isPublic} onValueChange={setIsPublic} trackColor={{ true: '#62C58F' }} accessibilityLabel="Public list" />
        </View>
        {error ? <Text className="text-sm text-danger">{error}</Text> : null}
        <Button label="Create list" onPress={handleSubmit} loading={submitting} disabled={!name.trim()} fullWidth size="lg" />
      </View>
    </ScrollView>
  );
}
