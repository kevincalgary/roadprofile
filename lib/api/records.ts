import { supabase } from '../supabase';
import type { VehicleRecord, RecordPhoto, RecordDocument, RecordRevision, RecordCategory, Relationship, MileageUnit } from '../types/database';

export interface RecordDraftInput {
  vehicleId: string;
  relationship: Relationship;
  category: RecordCategory;
  title: string;
  description?: string;
  symptoms?: string;
  diagnosis?: string;
  workPerformed?: string;
  partsReplaced?: string;
  partBrandAndNumbers?: string;
  facilityOrTechnician?: string;
  costAmount?: number;
  costCurrency?: string;
  costIsPrivate?: boolean;
  warrantyInfo?: string;
  nextServiceDate?: string;
  nextServiceMileage?: number;
  eventDate: string;
  mileage?: number;
  mileageUnit?: MileageUnit;
  locationText?: string;
}

function toRow(input: RecordDraftInput, authorId: string) {
  return {
    vehicle_id: input.vehicleId,
    author_id: authorId,
    relationship: input.relationship,
    category: input.category,
    title: input.title,
    description: input.description ?? null,
    symptoms: input.symptoms ?? null,
    diagnosis: input.diagnosis ?? null,
    work_performed: input.workPerformed ?? null,
    parts_replaced: input.partsReplaced ?? null,
    part_brand_and_numbers: input.partBrandAndNumbers ?? null,
    facility_or_technician: input.facilityOrTechnician ?? null,
    cost_amount: input.costAmount ?? null,
    cost_currency: input.costCurrency ?? 'USD',
    cost_is_private: input.costIsPrivate ?? true,
    warranty_info: input.warrantyInfo ?? null,
    next_service_date: input.nextServiceDate ?? null,
    next_service_mileage: input.nextServiceMileage ?? null,
    event_date: input.eventDate,
    mileage: input.mileage ?? null,
    mileage_unit: input.mileage != null ? input.mileageUnit ?? 'mi' : null,
    location_text: input.locationText ?? null,
  };
}

export async function saveRecordDraft(input: RecordDraftInput, existingId?: string): Promise<VehicleRecord> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Must be signed in.');

  const row = toRow(input, user.id);

  if (existingId) {
    const { data, error } = await supabase.from('records').update(row).eq('id', existingId).select().single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await supabase.from('records').insert({ ...row, status: 'draft' }).select().single();
  if (error) throw error;
  return data;
}

export async function publishRecord(recordId: string): Promise<VehicleRecord> {
  const { data, error } = await supabase.from('records').update({ status: 'published' }).eq('id', recordId).select().single();
  if (error) throw error;
  return data;
}

export async function deleteRecord(recordId: string): Promise<void> {
  const { error } = await supabase.from('records').update({ deleted_at: new Date().toISOString() }).eq('id', recordId);
  if (error) throw error;
}

export async function getMyDrafts(): Promise<VehicleRecord[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('records')
    .select('*')
    .eq('author_id', user.id)
    .eq('status', 'draft')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export interface RecordFilters {
  vehicleId: string;
  category?: RecordCategory | 'all';
  cursor?: string;
  limit?: number;
}

export async function getVehicleTimeline({ vehicleId, category, cursor, limit = 20 }: RecordFilters): Promise<VehicleRecord[]> {
  let query = supabase
    .from('records')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('event_date', { ascending: false })
    .limit(limit);

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }
  if (cursor) {
    query = query.lt('event_date', cursor);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getRecordById(recordId: string): Promise<VehicleRecord | null> {
  const { data, error } = await supabase.from('records').select('*').eq('id', recordId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getRecordPhotos(recordId: string): Promise<RecordPhoto[]> {
  const { data, error } = await supabase.from('record_photos').select('*').eq('record_id', recordId).order('position');
  if (error) throw error;
  return data ?? [];
}

export async function getRecordDocuments(recordId: string): Promise<RecordDocument[]> {
  const { data, error } = await supabase.from('record_documents').select('*').eq('record_id', recordId).order('created_at');
  if (error) throw error;
  return data ?? [];
}

export async function getRecordRevisions(recordId: string): Promise<RecordRevision[]> {
  const { data, error } = await supabase.from('record_revisions').select('*').eq('record_id', recordId).order('changed_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function addRecordPhoto(recordId: string, url: string, position: number, width?: number, height?: number) {
  const { error } = await supabase.from('record_photos').insert({
    record_id: recordId,
    url,
    position,
    width: width ?? null,
    height: height ?? null,
    exif_stripped: true,
  });
  if (error) throw error;
}

export async function removeRecordPhoto(photoId: string) {
  const { error } = await supabase.from('record_photos').delete().eq('id', photoId);
  if (error) throw error;
}

export async function addRecordDocument(recordId: string, url: string, filename: string, docType: 'receipt' | 'invoice' | 'other', redactionAck: boolean) {
  const { error } = await supabase.from('record_documents').insert({
    record_id: recordId,
    url,
    filename,
    doc_type: docType,
    redaction_ack: redactionAck,
  });
  if (error) throw error;
}

export async function toggleBookmark(recordId: string, bookmarked: boolean) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Must be signed in.');

  if (bookmarked) {
    const { error } = await supabase.from('bookmarks').insert({ user_id: user.id, record_id: recordId });
    if (error) throw error;
  } else {
    const { error } = await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('record_id', recordId);
    if (error) throw error;
  }
}

export async function getMyBookmarkedRecordIds(): Promise<Set<string>> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Set();
  const { data, error } = await supabase.from('bookmarks').select('record_id').eq('user_id', user.id);
  if (error) throw error;
  return new Set((data ?? []).map((b) => b.record_id));
}

export async function getSavedRecords(): Promise<VehicleRecord[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('bookmarks')
    .select('record_id, records(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: any) => row.records).filter(Boolean);
}
