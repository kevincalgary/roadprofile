import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CircularIconButton } from '../../../components/ui/CircularIconButton';
import { Button } from '../../../components/ui/Button';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { supabase } from '../../../lib/supabase';

export default function DeleteAccount() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      const { error: fnError } = await supabase.functions.invoke('delete-account', { method: 'POST' });
      if (fnError) throw fnError;
      await supabase.auth.signOut();
      router.replace('/welcome');
    } catch (err: any) {
      setError(err?.message ?? 'Could not delete your account. Please try again or contact support.');
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  return (
    <View className="flex-1 bg-warmwhite dark:bg-dark-bg" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center gap-3 px-5 pt-4 pb-2">
        <CircularIconButton icon="arrow-left" accessibilityLabel="Back" onPress={() => router.back()} />
        <Text className="text-2xl font-extrabold text-charcoal dark:text-dark-text">Delete account</Text>
      </View>
      <View className="px-6 gap-4 mt-2">
        <View className="bg-danger-bg rounded-2xl p-4 gap-2">
          <Text className="text-sm font-semibold text-danger">This can't be undone</Text>
          <Text className="text-xs text-danger">• Your account, profile, and login access are permanently deleted.</Text>
          <Text className="text-xs text-danger">• Vehicle records and comments you contributed stay on their vehicle's public history, attributed to a removed account, since RoadProfile's history is shared and permanent.</Text>
          <Text className="text-xs text-danger">• Your private messages, drafts, lists, and follows are removed.</Text>
        </View>
        {error ? <Text className="text-sm text-danger">{error}</Text> : null}
        <Button label="Delete my account" variant="destructive" onPress={() => setConfirmOpen(true)} fullWidth size="lg" />
      </View>

      <ConfirmDialog
        visible={confirmOpen}
        title="Permanently delete your account?"
        description="This immediately and permanently deletes your RoadProfile account."
        confirmLabel="Delete permanently"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </View>
  );
}
