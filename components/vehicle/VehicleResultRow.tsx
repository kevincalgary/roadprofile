import React, { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { formatVinForDisplay } from '../../lib/format';
import type { Vehicle, VehicleDetails } from '../../lib/types/database';

export function VehicleResultRow({ vehicle }: { vehicle: Vehicle }) {
  const router = useRouter();
  const [details, setDetails] = useState<VehicleDetails | null>(null);

  useEffect(() => {
    supabase
      .from('vehicle_details')
      .select('*')
      .eq('vehicle_id', vehicle.id)
      .maybeSingle()
      .then(({ data }) => setDetails(data));
  }, [vehicle.id]);

  return (
    <Pressable
      onPress={() => router.push(`/vehicle/${vehicle.vin}`)}
      accessibilityRole="link"
      className="flex-row items-center gap-3 py-3 border-b border-black/5 dark:border-dark-border"
    >
      {vehicle.cover_photo_url ? (
        <Image source={{ uri: vehicle.cover_photo_url }} style={{ width: 56, height: 56, borderRadius: 12 }} contentFit="cover" />
      ) : (
        <View className="w-14 h-14 rounded-xl bg-cardgray dark:bg-dark-card" />
      )}
      <View className="flex-1">
        <Text className="font-semibold text-charcoal dark:text-dark-text">
          {details ? `${details.year} ${details.make} ${details.model}` : 'Loading…'}
          {details?.trim ? ` ${details.trim}` : ''}
        </Text>
        <Text className="text-xs text-asphalt dark:text-dark-textSecondary mt-0.5 tracking-wide">{formatVinForDisplay(vehicle.vin)}</Text>
      </View>
    </Pressable>
  );
}
