import React, { useState } from 'react';
import { Modal, View, Text, Pressable, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { TextField } from '../ui/TextField';
import { Button } from '../ui/Button';
import { submitVehicleDetailCorrection, submitVinCorrection } from '../../lib/api/vehicles';
import type { VehicleDetails } from '../../lib/types/database';

const EDITABLE_FIELDS: { key: keyof VehicleDetails; label: string }[] = [
  { key: 'year', label: 'Year' },
  { key: 'make', label: 'Make' },
  { key: 'model', label: 'Model' },
  { key: 'trim', label: 'Trim' },
  { key: 'body_style', label: 'Body style' },
  { key: 'exterior_color', label: 'Exterior color' },
  { key: 'interior_color', label: 'Interior color' },
  { key: 'engine', label: 'Engine' },
  { key: 'transmission', label: 'Transmission' },
  { key: 'drivetrain', label: 'Drivetrain' },
];

interface SuggestCorrectionDialogProps {
  visible: boolean;
  onClose: () => void;
  vehicleId: string;
  vin: string;
  details: VehicleDetails | null;
  mode: 'field' | 'vin';
}

export function SuggestCorrectionDialog({ visible, onClose, vehicleId, vin, details, mode }: SuggestCorrectionDialogProps) {
  const [field, setField] = useState<keyof VehicleDetails>('make');
  const [suggestedValue, setSuggestedValue] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    if (!suggestedValue.trim() || !reason.trim()) return;
    setSubmitting(true);
    try {
      if (mode === 'vin') {
        await submitVinCorrection({ vehicleId, originalVin: vin, suggestedVin: suggestedValue, reason });
      } else {
        const originalValue = details ? String(details[field] ?? '') : null;
        await submitVehicleDetailCorrection({ vehicleId, fieldName: field, originalValue, suggestedValue, reason });
      }
      setDone(true);
    } catch (err) {
      console.warn('Correction submission failed', err);
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    setSuggestedValue('');
    setReason('');
    setDone(false);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View className="flex-1 bg-black/40 justify-end">
        <Pressable className="absolute inset-0" onPress={handleClose} />
        <View className="bg-white dark:bg-dark-card rounded-t-2xl max-h-[85%]">
          <View className="flex-row items-center justify-between px-5 pt-5 pb-3">
            <Text className="text-lg font-bold text-charcoal dark:text-dark-text">{mode === 'vin' ? 'Report incorrect VIN' : 'Suggest a correction'}</Text>
            <Pressable onPress={handleClose} accessibilityRole="button" accessibilityLabel="Close" className="w-11 h-11 items-center justify-center">
              <Feather name="x" size={22} color="#5C6470" />
            </Pressable>
          </View>
          {done ? (
            <View className="items-center px-6 pb-8 gap-3">
              <Feather name="check-circle" size={40} color="#62C58F" />
              <Text className="text-base text-charcoal dark:text-dark-text text-center">
                Submitted for moderator review. Thanks for helping keep RoadProfile accurate.
              </Text>
              <Button label="Done" onPress={handleClose} />
            </View>
          ) : (
            <ScrollView className="px-5 pb-6" contentContainerStyle={{ gap: 14 }}>
              {mode === 'field' ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {EDITABLE_FIELDS.map((f) => (
                    <Pressable
                      key={String(f.key)}
                      onPress={() => setField(f.key)}
                      className={['h-9 px-4 rounded-pill items-center justify-center border', field === f.key ? 'bg-mint border-mint' : 'border-asphalt/30 dark:border-dark-border'].join(' ')}
                    >
                      <Text className={field === f.key ? 'text-mint-900 text-sm font-medium' : 'text-asphalt dark:text-dark-textSecondary text-sm'}>{f.label}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              ) : (
                <Text className="text-sm text-asphalt dark:text-dark-textSecondary">Current VIN: {vin}</Text>
              )}
              <TextField
                label={mode === 'vin' ? 'Correct VIN' : `Correct ${EDITABLE_FIELDS.find((f) => f.key === field)?.label}`}
                value={suggestedValue}
                onChangeText={mode === 'vin' ? (t) => setSuggestedValue(t.toUpperCase()) : setSuggestedValue}
                autoCapitalize={mode === 'vin' ? 'characters' : 'sentences'}
                required
              />
              <TextField
                label="Reason / evidence"
                value={reason}
                onChangeText={setReason}
                multiline
                numberOfLines={3}
                required
                style={{ height: 80, textAlignVertical: 'top', paddingTop: 12 }}
                helperText="Moderators review every correction before it's applied."
              />
              <Button label="Submit for review" onPress={handleSubmit} loading={submitting} disabled={!suggestedValue.trim() || !reason.trim()} fullWidth />
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
