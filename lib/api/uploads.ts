import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from '../supabase';

export type UploadBucket =
  | 'avatars'
  | 'vehicle-covers'
  | 'list-covers'
  | 'record-photos'
  | 'record-documents'
  | 'moderation-evidence';

/**
 * Re-encodes an image through expo-image-manipulator, which strips EXIF/GPS
 * metadata as a side effect (the manipulator re-renders pixel data into a
 * new file rather than copying metadata blocks) and downscales it so
 * uploads stay small on slow connections.
 */
export async function compressImage(uri: string, maxDimension = 1600): Promise<{ uri: string; width: number; height: number }> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: maxDimension } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
  );
  return { uri: result.uri, width: result.width, height: result.height };
}

export interface UploadProgress {
  loaded: number;
  total: number;
}

/**
 * Uploads a local file URI to Supabase Storage under the current user's own
 * folder prefix (required by the storage RLS policies — see
 * 0013_storage_buckets.sql). Returns the public URL for public buckets.
 */
export async function uploadToBucket(
  bucket: UploadBucket,
  localUri: string,
  filename: string
): Promise<{ path: string; publicUrl: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Must be signed in to upload.');

  const response = await fetch(localUri);
  const blob = await response.blob();
  const path = `${user.id}/${Date.now()}-${filename}`;

  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    cacheControl: '3600',
    upsert: false,
    contentType: blob.type || 'application/octet-stream',
  });
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

/** Retries a failed upload once with a fresh blob read (handles interrupted connections). */
export async function uploadWithRetry(
  bucket: UploadBucket,
  localUri: string,
  filename: string,
  retries = 2
): Promise<{ path: string; publicUrl: string }> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await uploadToBucket(bucket, localUri, filename);
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}
