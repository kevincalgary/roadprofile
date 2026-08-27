import React from 'react';
import { Modal, View, Text, Pressable } from 'react-native';
import { Button } from './Button';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  visible,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive,
  loading,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 bg-black/40 items-center justify-center px-6">
        <Pressable className="absolute inset-0" onPress={onCancel} accessibilityLabel="Dismiss dialog" />
        <View
          className="w-full max-w-sm bg-white dark:bg-dark-card rounded-2xl p-6 gap-2"
          accessibilityViewIsModal
          accessibilityRole="alert"
        >
          <Text className="text-lg font-bold text-charcoal dark:text-dark-text">{title}</Text>
          {description ? <Text className="text-sm text-asphalt dark:text-dark-textSecondary mb-2">{description}</Text> : null}
          <View className="flex-row gap-3 mt-2">
            <View className="flex-1">
              <Button label={cancelLabel} variant="outline" onPress={onCancel} fullWidth />
            </View>
            <View className="flex-1">
              <Button label={confirmLabel} variant={destructive ? 'destructive' : 'primary'} onPress={onConfirm} loading={loading} fullWidth />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
