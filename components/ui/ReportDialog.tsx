import React, { useState } from 'react';
import { Modal, View, Text, Pressable, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Button } from './Button';
import { TextField } from './TextField';
import { submitReport, type ReportInput } from '../../lib/api/social';

const REASONS: { value: ReportInput['reason']; label: string }[] = [
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'sensitive_information', label: 'Sensitive personal information' },
  { value: 'incorrect_vin', label: 'Incorrect VIN' },
  { value: 'duplicate_vehicle', label: 'Duplicate vehicle' },
  { value: 'inappropriate_content', label: 'Inappropriate content' },
  { value: 'impersonation', label: 'Impersonation' },
  { value: 'unsupported_accusation', label: 'Unsupported accusation' },
  { value: 'other', label: 'Other' },
];

interface ReportDialogProps {
  visible: boolean;
  targetType: ReportInput['targetType'];
  targetId: string;
  onClose: () => void;
  presetReason?: ReportInput['reason'];
}

export function ReportDialog({ visible, targetType, targetId, onClose, presetReason }: ReportDialogProps) {
  const [reason, setReason] = useState<ReportInput['reason'] | null>(presetReason ?? null);

  React.useEffect(() => {
    if (visible && presetReason) setReason(presetReason);
  }, [visible, presetReason]);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    if (!reason) return;
    setSubmitting(true);
    try {
      await submitReport({ targetType, targetId, reason, details: details || undefined });
      setDone(true);
    } catch (err) {
      console.warn('Report submission failed', err);
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    setReason(null);
    setDetails('');
    setDone(false);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View className="flex-1 bg-black/40 justify-end">
        <Pressable className="absolute inset-0" onPress={handleClose} accessibilityLabel="Dismiss dialog" />
        <View className="bg-white dark:bg-dark-card rounded-t-2xl max-h-[85%]" accessibilityViewIsModal>
          <View className="flex-row items-center justify-between px-5 pt-5 pb-3">
            <Text className="text-lg font-bold text-charcoal dark:text-dark-text">Report content</Text>
            <Pressable onPress={handleClose} accessibilityLabel="Close" accessibilityRole="button" className="w-11 h-11 items-center justify-center">
              <Feather name="x" size={22} color="#5C6470" />
            </Pressable>
          </View>
          {done ? (
            <View className="items-center px-6 pb-8 pt-2 gap-3">
              <Feather name="check-circle" size={40} color="#62C58F" />
              <Text className="text-base text-charcoal dark:text-dark-text text-center">
                Thanks — our moderation team will review this report.
              </Text>
              <Button label="Done" onPress={handleClose} />
            </View>
          ) : (
            <ScrollView className="px-5 pb-6" contentContainerStyle={{ gap: 16 }}>
              <View className="gap-2">
                {REASONS.map((r) => (
                  <Pressable
                    key={r.value}
                    onPress={() => setReason(r.value)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: reason === r.value }}
                    className={[
                      'flex-row items-center justify-between px-4 h-12 rounded-xl border',
                      reason === r.value ? 'border-mint bg-mint-50 dark:bg-mint-900' : 'border-black/5 dark:border-dark-border',
                    ].join(' ')}
                  >
                    <Text className="text-charcoal dark:text-dark-text">{r.label}</Text>
                    {reason === r.value ? <Feather name="check" size={18} color="#3B8C60" /> : null}
                  </Pressable>
                ))}
              </View>
              <TextField
                label="Additional details (optional)"
                placeholder="Anything that helps our moderators review this"
                value={details}
                onChangeText={setDetails}
                multiline
                numberOfLines={3}
                style={{ height: 88, textAlignVertical: 'top', paddingTop: 12 }}
              />
              <Button label="Submit report" onPress={handleSubmit} loading={submitting} disabled={!reason} fullWidth />
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
