import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Feather } from '@expo/vector-icons';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { compressImage, uploadWithRetry } from '../../lib/api/uploads';
import { addRecordDocument } from '../../lib/api/records';
import type { RecordDocument } from '../../lib/types/database';

const REDACTION_ITEMS = ['Names', 'Home addresses', 'Phone numbers', 'Email addresses', 'Payment information', 'Account numbers', 'Signatures', 'Government ID numbers'];

export function RecordDocumentPicker({ recordId, documents, onChange }: { recordId: string; documents: RecordDocument[]; onChange: (docs: RecordDocument[]) => void }) {
  const [pendingAsset, setPendingAsset] = useState<{ uri: string; name: string; mimeType?: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handlePick() {
    const result = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf'], copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.length) return;
    setPendingAsset({ uri: result.assets[0].uri, name: result.assets[0].name ?? 'document', mimeType: result.assets[0].mimeType });
  }

  async function handleConfirmRedaction() {
    if (!pendingAsset) return;
    setUploading(true);
    try {
      // A picked "document" can be an image (e.g. a phone photo of a
      // receipt), which can carry EXIF/GPS metadata just like a record
      // photo. Route it through the same stripping step before upload so
      // the redaction dialog's "metadata is stripped automatically" claim
      // actually holds for documents too, not just record photos.
      const isImage = pendingAsset.mimeType?.startsWith('image/') ?? /\.(jpe?g|png|heic|heif|webp)$/i.test(pendingAsset.name);
      const uploadUri = isImage ? (await compressImage(pendingAsset.uri)).uri : pendingAsset.uri;
      const { publicUrl } = await uploadWithRetry('record-documents', uploadUri, pendingAsset.name);
      await addRecordDocument(recordId, publicUrl, pendingAsset.name, 'receipt', true);
      onChange([
        ...documents,
        { id: `${recordId}-${documents.length}`, record_id: recordId, url: publicUrl, filename: pendingAsset.name, doc_type: 'receipt', redaction_ack: true, created_at: new Date().toISOString() },
      ]);
    } finally {
      setUploading(false);
      setPendingAsset(null);
    }
  }

  return (
    <View>
      <Text className="text-sm font-medium text-charcoal dark:text-dark-text mb-1.5">Receipts, invoices, or documents (optional)</Text>
      {documents.map((doc) => (
        <View key={doc.id} className="flex-row items-center gap-2 py-2">
          <Feather name="file-text" size={16} color="#5C6470" />
          <Text numberOfLines={1} className="flex-1 text-sm text-charcoal dark:text-dark-text">{doc.filename}</Text>
        </View>
      ))}
      <Pressable onPress={handlePick} accessibilityRole="button" accessibilityLabel="Add document" className="flex-row items-center gap-2 h-11 px-4 rounded-xl bg-cardgray dark:bg-dark-card self-start">
        {uploading ? <ActivityIndicator size="small" color="#3B8C60" /> : <Feather name="paperclip" size={16} color="#5C6470" />}
        <Text className="text-sm text-charcoal dark:text-dark-text">Add document</Text>
      </Pressable>

      <ConfirmDialog
        visible={!!pendingAsset}
        title="Remove personal information first"
        description={`Before you publish this document, make sure it does not show:\n\n${REDACTION_ITEMS.join(', ')}, or any other personal information. RoadProfile strips location and camera metadata automatically, but you're responsible for what's visible on the page itself.`}
        confirmLabel="This document is redacted, publish it"
        cancelLabel="Cancel"
        loading={uploading}
        onConfirm={handleConfirmRedaction}
        onCancel={() => setPendingAsset(null)}
      />
    </View>
  );
}
