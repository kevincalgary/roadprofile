import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { VinInput } from '../../components/vehicle/VinInput';
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';
import { CircularIconButton } from '../../components/ui/CircularIconButton';
import { validateVin } from '../../lib/vin';
import { createVehicle } from '../../lib/api/vehicles';
import { compressImage, uploadWithRetry } from '../../lib/api/uploads';

export default function CreateVehicle() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ vin?: string }>();

  const [vin, setVin] = useState(params.vin ?? '');
  const [year, setYear] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [trim, setTrim] = useState('');
  const [bodyStyle, setBodyStyle] = useState('');
  const [exteriorColor, setExteriorColor] = useState('');
  const [description, setDescription] = useState('');
  const [coverLocalUri, setCoverLocalUri] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validation = validateVin(vin);
  const canSubmit = validation.valid && year.length === 4 && make.trim() && model.trim() && confirmed && !submitting;

  async function pickCover() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [16, 10], quality: 0.9 });
    if (!result.canceled && result.assets[0]) setCoverLocalUri(result.assets[0].uri);
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      let coverPhotoUrl: string | undefined;
      if (coverLocalUri) {
        const compressed = await compressImage(coverLocalUri, 1600);
        const { publicUrl } = await uploadWithRetry('vehicle-covers', compressed.uri, 'cover.jpg');
        coverPhotoUrl = publicUrl;
      }
      const vehicle = await createVehicle({
        vin,
        year: Number(year),
        make: make.trim(),
        model: model.trim(),
        trim: trim.trim() || undefined,
        bodyStyle: bodyStyle.trim() || undefined,
        exteriorColor: exteriorColor.trim() || undefined,
        shortDescription: description.trim() || undefined,
        coverPhotoUrl,
      });
      router.replace(`/vehicle/${vehicle.vin}`);
    } catch (err: any) {
      setError(err?.message ?? 'Could not create this vehicle profile.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView className="flex-1 bg-warmwhite dark:bg-dark-bg" contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 40 }}>
      <View className="px-5 mb-2">
        <CircularIconButton icon="arrow-left" accessibilityLabel="Back" onPress={() => router.back()} />
      </View>
      <View className="px-6 gap-5">
        <Text className="text-3xl font-extrabold text-charcoal dark:text-dark-text">Create vehicle profile</Text>

        <View className="bg-amber-bg rounded-2xl p-4 gap-1.5">
          <Text className="text-sm font-semibold text-amber">Before you publish</Text>
          <Text className="text-xs text-amber">• This profile and its VIN will be permanently public.</Text>
          <Text className="text-xs text-amber">• All details are community submitted, not verified by RoadProfile.</Text>
          <Text className="text-xs text-amber">• Creating this profile does not prove ownership.</Text>
          <Text className="text-xs text-amber">• You will not have exclusive control of this profile.</Text>
          <Text className="text-xs text-amber">• Never post another person's personal information.</Text>
        </View>

        <VinInput value={vin} onChange={setVin} />

        <Pressable onPress={pickCover} accessibilityRole="button" accessibilityLabel="Add cover photo" className="rounded-2xl overflow-hidden bg-cardgray dark:bg-dark-card h-40 items-center justify-center">
          {coverLocalUri ? (
            <Image source={{ uri: coverLocalUri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          ) : (
            <View className="items-center gap-2">
              <Feather name="camera" size={24} color="#8A919B" />
              <Text className="text-sm text-asphalt dark:text-dark-textSecondary">Add a cover photo (optional)</Text>
            </View>
          )}
        </Pressable>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <TextField label="Year" required keyboardType="number-pad" maxLength={4} value={year} onChangeText={setYear} />
          </View>
          <View className="flex-[2]">
            <TextField label="Make" required value={make} onChangeText={setMake} />
          </View>
        </View>
        <TextField label="Model" required value={model} onChangeText={setModel} />
        <View className="flex-row gap-3">
          <View className="flex-1">
            <TextField label="Trim (optional)" value={trim} onChangeText={setTrim} />
          </View>
          <View className="flex-1">
            <TextField label="Body style (optional)" value={bodyStyle} onChangeText={setBodyStyle} />
          </View>
        </View>
        <TextField label="Exterior color (optional)" value={exteriorColor} onChangeText={setExteriorColor} />
        <TextField
          label="Short public description (optional)"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          style={{ height: 88, textAlignVertical: 'top', paddingTop: 12 }}
        />

        <Pressable onPress={() => setConfirmed((v) => !v)} accessibilityRole="checkbox" accessibilityState={{ checked: confirmed }} className="flex-row items-start gap-3">
          <View className={['w-6 h-6 rounded-md items-center justify-center border mt-0.5', confirmed ? 'bg-mint border-mint' : 'border-asphalt/40'].join(' ')}>
            {confirmed ? <Feather name="check" size={14} color="#0F2518" /> : null}
          </View>
          <Text className="flex-1 text-sm text-charcoal dark:text-dark-text">
            I understand this VIN and vehicle profile will be public, community submitted, and not exclusively controlled by me.
          </Text>
        </Pressable>

        {error ? <Text className="text-sm text-danger">{error}</Text> : null}

        <Button label="Publish vehicle profile" onPress={handleSubmit} loading={submitting} disabled={!canSubmit} fullWidth size="lg" />
      </View>
    </ScrollView>
  );
}
