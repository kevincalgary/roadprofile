import React, { useState } from 'react';
import { Modal, View, Text, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CircularIconButton } from './CircularIconButton';

export interface OverflowMenuItem {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  onPress: () => void;
  destructive?: boolean;
}

export function OverflowMenu({ items, accessibilityLabel = 'More options' }: { items: OverflowMenuItem[]; accessibilityLabel?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <CircularIconButton icon="more-horizontal" onPress={() => setOpen(true)} accessibilityLabel={accessibilityLabel} />
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 bg-black/30 justify-end" onPress={() => setOpen(false)} accessibilityLabel="Dismiss menu">
          <View className="bg-white dark:bg-dark-card rounded-t-2xl pb-8 pt-2" accessibilityViewIsModal>
            <View className="w-10 h-1 rounded-full bg-black/10 dark:bg-white/10 self-center my-2" />
            {items.map((item) => (
              <Pressable
                key={item.label}
                onPress={() => {
                  setOpen(false);
                  item.onPress();
                }}
                accessibilityRole="menuitem"
                className="flex-row items-center gap-3 px-5 h-14"
              >
                <Feather name={item.icon} size={18} color={item.destructive ? '#C43D3D' : '#5C6470'} />
                <Text className={['text-base', item.destructive ? 'text-danger' : 'text-charcoal dark:text-dark-text'].join(' ')}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
