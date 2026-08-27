import React, { useState } from 'react';
import { Modal, View, Text, Pressable } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Feather } from '@expo/vector-icons';
import { Button } from '../ui/Button';
import { normalizeVin } from '../../lib/vin';

interface VinScannerProps {
  visible: boolean;
  onClose: () => void;
  onScanned: (vin: string) => void;
}

/**
 * Scans a VIN barcode (Code 39 is the AIAG/NHTSA standard for VIN plates;
 * Code 128 and PDF417 cover dealer/registration barcodes that also encode
 * the VIN). The scanned value is always shown back to the user for
 * confirmation before it's used anywhere — never auto-submitted.
 */
export function VinScanner({ visible, onClose, onScanned }: VinScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);

  function handleBarcodeScanned(result: { data: string }) {
    if (locked) return;
    const { normalized } = normalizeVin(result.data);
    if (normalized.length >= 5 && normalized.length <= 17) {
      setLocked(true);
      setScanned(normalized);
    }
  }

  function handleConfirm() {
    if (scanned) onScanned(scanned);
    reset();
  }

  function reset() {
    setScanned(null);
    setLocked(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View className="flex-1 bg-black">
        {!permission ? null : !permission.granted ? (
          <View className="flex-1 items-center justify-center px-8 gap-4">
            <Feather name="camera-off" size={32} color="#fff" />
            <Text className="text-white text-center">RoadProfile needs camera access to scan a VIN barcode.</Text>
            <Button label="Grant camera access" onPress={requestPermission} />
            <Button label="Cancel" variant="ghost" onPress={handleClose} />
          </View>
        ) : (
          <>
            <CameraView
              style={{ flex: 1 }}
              barcodeScannerSettings={{ barcodeTypes: ['code39', 'code128', 'pdf417', 'datamatrix'] }}
              onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            />
            <View className="absolute inset-0 items-center justify-center" pointerEvents="none">
              <View className="w-[85%] h-32 border-2 border-mint rounded-2xl" />
              <Text className="text-white mt-4 text-sm">Align the VIN barcode within the frame</Text>
            </View>
            <View className="absolute top-0 left-0 right-0 flex-row justify-between items-center px-4 pt-14">
              <Pressable onPress={handleClose} accessibilityRole="button" accessibilityLabel="Close scanner" className="w-11 h-11 items-center justify-center rounded-full bg-black/50">
                <Feather name="x" size={20} color="#fff" />
              </Pressable>
            </View>
            {scanned ? (
              <View className="absolute bottom-0 left-0 right-0 bg-white dark:bg-dark-card rounded-t-2xl p-5 gap-3">
                <Text className="text-sm text-asphalt dark:text-dark-textSecondary">Scanned VIN — please verify before continuing:</Text>
                <Text className="text-xl font-bold text-charcoal dark:text-dark-text tracking-wider">{scanned}</Text>
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Button label="Rescan" variant="outline" onPress={reset} fullWidth />
                  </View>
                  <View className="flex-1">
                    <Button label="Use this VIN" onPress={handleConfirm} fullWidth />
                  </View>
                </View>
              </View>
            ) : null}
          </>
        )}
      </View>
    </Modal>
  );
}
