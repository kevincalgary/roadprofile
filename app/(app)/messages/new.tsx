import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TextField } from '../../../components/ui/TextField';
import { CircularIconButton } from '../../../components/ui/CircularIconButton';
import { UserRow } from '../../../components/user/UserRow';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useDebouncedValue } from '../../../lib/hooks/usePaginatedQuery';
import { searchProfiles } from '../../../lib/api/profiles';
import { startConversation } from '../../../lib/api/messages';
import { useAuth } from '../../../lib/auth-context';
import type { Profile } from '../../../lib/types/database';

export default function NewMessage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const debounced = useDebouncedValue(query, 300);

  useEffect(() => {
    if (!debounced) {
      setResults([]);
      return;
    }
    setSearching(true);
    searchProfiles(debounced)
      .then((profiles) => setResults(profiles.filter((p) => p.user_id !== user?.id)))
      .finally(() => setSearching(false));
  }, [debounced, user?.id]);

  async function handleSelect(profile: Profile) {
    setStartingId(profile.user_id);
    setError(null);
    try {
      const conversationId = await startConversation(profile.user_id);
      router.replace(`/messages/${conversationId}`);
    } catch (err: any) {
      setError(err?.message ?? 'Could not start this conversation.');
    } finally {
      setStartingId(null);
    }
  }

  return (
    <View className="flex-1 bg-warmwhite dark:bg-dark-bg" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center gap-3 px-5 pt-4 pb-2">
        <CircularIconButton icon="arrow-left" accessibilityLabel="Back" onPress={() => router.back()} />
        <Text className="text-xl font-bold text-charcoal dark:text-dark-text">New conversation</Text>
      </View>
      <View className="px-5 mb-2">
        <TextField placeholder="Search by username or name" value={query} onChangeText={setQuery} autoCapitalize="none" />
      </View>
      {error ? <Text className="text-sm text-danger px-5 mb-2">{error}</Text> : null}
      {searching ? (
        <ActivityIndicator className="mt-6" color="#62C58F" />
      ) : (
        <ScrollView className="px-5">
          {!query ? (
            <EmptyState icon="search" title="Find someone to message" description="Search for a username or display name." />
          ) : results.length === 0 ? (
            <EmptyState icon="user-x" title="No users found" />
          ) : (
            results.map((p) => (
              <UserRow
                key={p.user_id}
                profile={p}
                onPress={() => handleSelect(p)}
                right={startingId === p.user_id ? <ActivityIndicator size="small" color="#62C58F" /> : undefined}
              />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}
