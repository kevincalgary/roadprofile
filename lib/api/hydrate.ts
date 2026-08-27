import { supabase } from '../supabase';
import { getProfilesMap } from './profiles';
import type { VehicleRecord, Vehicle, VehicleDetails, RecordPhoto, Profile } from '../types/database';

export interface HydratedFeed {
  vehicles: Map<string, { vehicle: Vehicle; details: VehicleDetails | null }>;
  authors: Map<string, Profile>;
  photosByRecord: Map<string, RecordPhoto[]>;
  commentCounts: Map<string, number>;
  bookmarked: Set<string>;
}

/** Batch-fetches everything a list of feed/timeline record cards needs, in a
 *  handful of queries rather than one per card. */
export async function hydrateRecords(records: VehicleRecord[]): Promise<HydratedFeed> {
  const recordIds = records.map((r) => r.id);
  const vehicleIds = Array.from(new Set(records.map((r) => r.vehicle_id)));
  const authorIds = records.map((r) => r.author_id);

  const [{ data: vehicleRows }, { data: detailRows }, authors, { data: photoRows }, { data: commentRows }, bookmarked] = await Promise.all([
    vehicleIds.length ? supabase.from('vehicles').select('*').in('id', vehicleIds) : Promise.resolve({ data: [] as Vehicle[] }),
    vehicleIds.length ? supabase.from('vehicle_details').select('*').in('vehicle_id', vehicleIds) : Promise.resolve({ data: [] as VehicleDetails[] }),
    getProfilesMap(authorIds),
    recordIds.length ? supabase.from('record_photos').select('*').in('record_id', recordIds).order('position') : Promise.resolve({ data: [] as RecordPhoto[] }),
    recordIds.length ? supabase.from('comments').select('record_id').in('record_id', recordIds).is('deleted_at', null) : Promise.resolve({ data: [] as { record_id: string }[] }),
    getMyBookmarkSet(recordIds),
  ]);

  const vehicles = new Map<string, { vehicle: Vehicle; details: VehicleDetails | null }>();
  for (const v of vehicleRows ?? []) {
    vehicles.set(v.id, { vehicle: v as Vehicle, details: null });
  }
  for (const d of detailRows ?? []) {
    const entry = vehicles.get((d as VehicleDetails).vehicle_id);
    if (entry) entry.details = d as VehicleDetails;
  }

  const photosByRecord = new Map<string, RecordPhoto[]>();
  for (const p of photoRows ?? []) {
    const list = photosByRecord.get((p as RecordPhoto).record_id) ?? [];
    list.push(p as RecordPhoto);
    photosByRecord.set((p as RecordPhoto).record_id, list);
  }

  const commentCounts = new Map<string, number>();
  for (const c of commentRows ?? []) {
    commentCounts.set(c.record_id, (commentCounts.get(c.record_id) ?? 0) + 1);
  }

  return { vehicles, authors, photosByRecord, commentCounts, bookmarked };
}

async function getMyBookmarkSet(recordIds: string[]): Promise<Set<string>> {
  if (!recordIds.length) return new Set();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Set();
  const { data } = await supabase.from('bookmarks').select('record_id').eq('user_id', user.id).in('record_id', recordIds);
  return new Set((data ?? []).map((b) => b.record_id));
}
