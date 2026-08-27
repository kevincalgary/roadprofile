import React, { useEffect, useState } from 'react';
import { Modal, View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getMyLists, addVehicleToList, getListVehicles } from '../../lib/api/lists';
import type { ListRow } from '../../lib/types/database';

export function AddToListDialog({ visible, vehicleId, onClose }: { visible: boolean; vehicleId: string; onClose: () => void }) {
  const [lists, setLists] = useState<ListRow[]>([]);
  const [memberOf, setMemberOf] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    getMyLists()
      .then(async (myLists) => {
        setLists(myLists);
        const memberships = await Promise.all(
          myLists.map(async (l) => {
            const vehicles = await getListVehicles(l.id);
            return vehicles.some((v) => v.vehicle_id === vehicleId) ? l.id : null;
          })
        );
        setMemberOf(new Set(memberships.filter(Boolean) as string[]));
      })
      .finally(() => setLoading(false));
  }, [visible, vehicleId]);

  async function handleAdd(list: ListRow) {
    setBusyId(list.id);
    try {
      await addVehicleToList(list.id, vehicleId, 0);
      setMemberOf((prev) => new Set(prev).add(list.id));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/40 justify-end">
        <Pressable className="absolute inset-0" onPress={onClose} />
        <View className="bg-white dark:bg-dark-card rounded-t-2xl max-h-[70%]">
          <View className="flex-row items-center justify-between px-5 pt-5 pb-3">
            <Text className="text-lg font-bold text-charcoal dark:text-dark-text">Add to list</Text>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" className="w-11 h-11 items-center justify-center">
              <Feather name="x" size={22} color="#5C6470" />
            </Pressable>
          </View>
          {loading ? (
            <ActivityIndicator className="my-6" color="#62C58F" />
          ) : lists.length === 0 ? (
            <Text className="text-sm text-asphalt dark:text-dark-textSecondary px-5 pb-6">You don't have any lists yet.</Text>
          ) : (
            <ScrollView className="px-5 pb-6">
              {lists.map((l) => {
                const added = memberOf.has(l.id);
                return (
                  <Pressable
                    key={l.id}
                    onPress={() => !added && handleAdd(l)}
                    accessibilityRole="button"
                    accessibilityLabel={added ? `${l.name}, already added` : `Add to ${l.name}`}
                    className="flex-row items-center justify-between h-14 border-b border-black/5 dark:border-dark-border"
                  >
                    <Text className="text-charcoal dark:text-dark-text">{l.name}</Text>
                    {busyId === l.id ? <ActivityIndicator size="small" color="#62C58F" /> : added ? <Feather name="check" size={18} color="#3B8C60" /> : <Feather name="plus" size={18} color="#8A919B" />}
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
