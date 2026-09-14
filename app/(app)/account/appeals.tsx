import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CircularIconButton } from '../../../components/ui/CircularIconButton';
import { Button } from '../../../components/ui/Button';
import { TextField } from '../../../components/ui/TextField';
import { Badge } from '../../../components/ui/Badge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { relativeTime } from '../../../lib/format';
import { getMyAppealableActions, submitAppeal } from '../../../lib/api/moderation';
import type { AppealableAction } from '../../../lib/types/database';

const ACTION_LABEL: Record<string, string> = {
  warn: 'Warning',
  suspend: 'Suspension',
  ban: 'Ban',
  remove_content: 'Content removed',
};

const STATUS_TONE: Record<string, 'amber' | 'mint' | 'danger'> = {
  pending: 'amber',
  upheld: 'danger',
  overturned: 'mint',
};

export default function AccountAppeals() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<AppealableAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [statement, setStatement] = useState('');
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    getMyAppealableActions().then(setItems).finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleSubmit(action: AppealableAction) {
    if (statement.trim().length < 10) {
      setError('Please explain your appeal in at least 10 characters.');
      return;
    }
    setSubmittingId(action.moderation_action_id);
    setError(null);
    try {
      await submitAppeal(action.moderation_action_id, statement.trim());
      setOpenId(null);
      setStatement('');
      load();
    } catch (err: any) {
      setError(err?.message ?? 'Could not submit your appeal.');
    } finally {
      setSubmittingId(null);
    }
  }

  return (
    <View className="flex-1 bg-warmwhite dark:bg-dark-bg" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center gap-3 px-5 pt-4 pb-2">
        <CircularIconButton icon="arrow-left" accessibilityLabel="Back" onPress={() => router.back()} />
        <Text className="text-2xl font-extrabold text-charcoal dark:text-dark-text">Account standing</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <Text className="text-sm text-asphalt dark:text-dark-textSecondary mb-4">
          Moderation actions taken against your account or content, and any appeals you've filed.
        </Text>
        {!loading && items.length === 0 ? (
          <EmptyState icon="shield" title="No moderation actions on your account" />
        ) : (
          items.map((item) => (
            <View key={item.moderation_action_id} className="bg-white dark:bg-dark-card rounded-2xl p-4 mb-3 border border-black/5 dark:border-dark-border">
              <View className="flex-row items-center gap-2 flex-wrap">
                <Badge label={ACTION_LABEL[item.action] ?? item.action} tone={item.action === 'ban' ? 'danger' : 'amber'} />
                {item.appeal_status ? <Badge label={`Appeal ${item.appeal_status}`} tone={STATUS_TONE[item.appeal_status]} /> : null}
              </View>
              <Text className="text-sm text-charcoal dark:text-dark-text mt-2">{item.reason}</Text>
              <Text className="text-xs text-asphalt dark:text-dark-textSecondary mt-1">{relativeTime(item.created_at)}</Text>
              {item.appeal_decision_notes ? (
                <Text className="text-xs text-asphalt dark:text-dark-textSecondary mt-2">Moderator notes: {item.appeal_decision_notes}</Text>
              ) : null}

              {!item.appeal_id ? (
                openId === item.moderation_action_id ? (
                  <View className="mt-3 gap-2">
                    <TextField
                      placeholder="Explain why this decision should be reconsidered"
                      value={statement}
                      onChangeText={setStatement}
                      multiline
                      numberOfLines={4}
                      className="h-24 py-3"
                      textAlignVertical="top"
                    />
                    {error ? <Text className="text-xs text-danger">{error}</Text> : null}
                    <View className="flex-row gap-2">
                      <Button label="Submit appeal" size="sm" onPress={() => handleSubmit(item)} loading={submittingId === item.moderation_action_id} />
                      <Button
                        label="Cancel"
                        size="sm"
                        variant="outline"
                        onPress={() => {
                          setOpenId(null);
                          setStatement('');
                          setError(null);
                        }}
                      />
                    </View>
                  </View>
                ) : (
                  <View className="mt-3">
                    <Button label="Appeal this decision" size="sm" variant="outline" onPress={() => setOpenId(item.moderation_action_id)} />
                  </View>
                )
              ) : null}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
