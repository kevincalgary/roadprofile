import React, { useState } from 'react';
import { View, Text, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { CircularIconButton } from '../../../components/ui/CircularIconButton';
import { Button } from '../../../components/ui/Button';
import { supabase } from '../../../lib/supabase';

export default function DownloadData() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('rpc_export_my_data');
      if (rpcError) throw rpcError;
      const json = JSON.stringify(data, null, 2);

      if (Platform.OS === 'web') {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'roadprofile-data.json';
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const file = new File(Paths.cache, `roadprofile-data-${Date.now()}.json`);
        file.write(json);
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Your RoadProfile data' });
        }
      }
    } catch (err: any) {
      setError(err?.message ?? 'Could not export your data.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-warmwhite dark:bg-dark-bg" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center gap-3 px-5 pt-4 pb-2">
        <CircularIconButton icon="arrow-left" accessibilityLabel="Back" onPress={() => router.back()} />
        <Text className="text-2xl font-extrabold text-charcoal dark:text-dark-text">Download my data</Text>
      </View>
      <View className="px-6 gap-4 mt-2">
        <Text className="text-sm text-asphalt dark:text-dark-textSecondary">
          Export a JSON file of your account, profile, vehicle contributions, records, comments, lists, follows,
          bookmarks, and sent messages.
        </Text>
        {error ? <Text className="text-sm text-danger">{error}</Text> : null}
        <Button label="Export my data" onPress={handleExport} loading={loading} fullWidth size="lg" />
      </View>
    </View>
  );
}
