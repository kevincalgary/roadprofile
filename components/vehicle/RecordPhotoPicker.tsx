import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { compressImage, uploadWithRetry } from '../../lib/api/uploads';
import { addRecordPhoto, removeRecordPhoto } from '../../lib/api/records';
import type { RecordPhoto } from '../../lib/types/database';

export function RecordPhotoPicker({ recordId, photos, onChange }: { recordId: string; photos: RecordPhoto[]; onChange: (photos: RecordPhoto[]) => void }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleAdd() {
    if (photos.length >= 5) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9, allowsMultipleSelection: true, selectionLimit: 5 - photos.length });
    if (result.canceled || !result.assets.length) return;

    setUploading(true);
    setUploadError(null);
    try {
      let position = photos.length;
      const newPhotos: RecordPhoto[] = [...photos];
      for (const asset of result.assets) {
        if (position >= 5) break;
        position += 1;
        const compressed = await compressImage(asset.uri, 1600);
        const { publicUrl } = await uploadWithRetry('record-photos', compressed.uri, `photo-${position}.jpg`);
        await addRecordPhoto(recordId, publicUrl, position, compressed.width, compressed.height);
        newPhotos.push({
          id: `${recordId}-${position}`,
          record_id: recordId,
          url: publicUrl,
          thumbnail_url: publicUrl,
          position,
          width: compressed.width,
          height: compressed.height,
          exif_stripped: true,
          created_at: new Date().toISOString(),
        });
      }
      onChange(newPhotos);
    } catch (err: any) {
      setUploadError('One or more photos failed to upload. You can try again.');
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove(photo: RecordPhoto) {
    onChange(photos.filter((p) => p.id !== photo.id));
    try {
      await removeRecordPhoto(photo.id);
    } catch {
      // best-effort; row may not exist if this was optimistic-only
    }
  }

  return (
    <View>
      <Text className="text-sm font-medium text-charcoal dark:text-dark-text mb-1.5">Photos ({photos.length}/5)</Text>
      <View className="flex-row flex-wrap gap-2">
        {photos.map((photo) => (
          <View key={photo.id} className="w-20 h-20 rounded-xl overflow-hidden relative">
            <Image source={{ uri: photo.thumbnail_url ?? photo.url }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
            <Pressable
              onPress={() => handleRemove(photo)}
              accessibilityRole="button"
              accessibilityLabel="Remove photo"
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 items-center justify-center"
            >
              <Feather name="x" size={12} color="#fff" />
            </Pressable>
          </View>
        ))}
        {photos.length < 5 ? (
          <Pressable
            onPress={handleAdd}
            accessibilityRole="button"
            accessibilityLabel="Add photo"
            className="w-20 h-20 rounded-xl bg-cardgray dark:bg-dark-card items-center justify-center"
          >
            {uploading ? <ActivityIndicator color="#3B8C60" /> : <Feather name="plus" size={20} color="#8A919B" />}
          </Pressable>
        ) : null}
      </View>
      {uploadError ? <Text className="text-xs text-danger mt-2">{uploadError}</Text> : null}
    </View>
  );
}
