import React, { useMemo, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { TextField } from '../ui/TextField';
import { VinScanner } from './VinScanner';
import { validateVin } from '../../lib/vin';

interface VinInputProps {
  value: string;
  onChange: (vin: string) => void;
  label?: string;
}

export function VinInput({ value, onChange, label = 'VIN' }: VinInputProps) {
  const [scannerOpen, setScannerOpen] = useState(false);
  const validation = useMemo(() => validateVin(value), [value]);

  return (
    <View>
      <View className="flex-row items-end gap-2">
        <View className="flex-1">
          <TextField
            label={label}
            required
            autoCapitalize="characters"
            autoCorrect={false}
            value={value}
            onChangeText={(text) => onChange(text.toUpperCase())}
            error={value.length > 0 ? validation.errors[0] : undefined}
            maxLength={17}
          />
        </View>
        <Pressable
          onPress={() => setScannerOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Scan VIN barcode"
          className="w-12 h-12 rounded-xl bg-mint items-center justify-center mb-0"
        >
          <Feather name="camera" size={20} color="#0F2518" />
        </Pressable>
      </View>
      {value.length > 0 && validation.warnings.length > 0 ? (
        <View className="mt-2 px-3 py-2 rounded-xl bg-amber-bg flex-row gap-2 items-start">
          <Feather name="alert-triangle" size={14} color="#B8791A" style={{ marginTop: 2 }} />
          <Text className="text-xs text-amber flex-1">{validation.warnings[0]}</Text>
        </View>
      ) : null}
      <VinScanner
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanned={(vin) => {
          onChange(vin);
          setScannerOpen(false);
        }}
      />
    </View>
  );
}
