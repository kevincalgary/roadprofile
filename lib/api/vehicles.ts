import { supabase } from '../supabase';
import { normalizeVin } from '../vin';
import type { Vehicle, VehicleDetails, VehicleStats, VehicleDetailRevision } from '../types/database';

export interface VehicleWithDetails {
  vehicle: Vehicle;
  details: VehicleDetails | null;
  stats: VehicleStats | null;
}

export async function getVehicleByVin(vinInput: string): Promise<VehicleWithDetails | null> {
  const { normalized } = normalizeVin(vinInput);
  const { data: vehicle, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('vin', normalized)
    .is('merged_into_vehicle_id', null)
    .maybeSingle();
  if (error) throw error;
  if (!vehicle) return null;

  const [{ data: details }, { data: stats }] = await Promise.all([
    supabase.from('vehicle_details').select('*').eq('vehicle_id', vehicle.id).maybeSingle(),
    supabase.from('vehicle_stats').select('*').eq('vehicle_id', vehicle.id).maybeSingle(),
  ]);

  return { vehicle, details: details ?? null, stats: stats ?? null };
}

export async function searchVehicles(query: string, limit = 20): Promise<Vehicle[]> {
  const { data, error } = await supabase.rpc('search_vehicles', { q: query, max_results: limit });
  if (error) throw error;
  return data ?? [];
}

export interface CreateVehicleInput {
  vin: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  bodyStyle?: string;
  exteriorColor?: string;
  interiorColor?: string;
  engine?: string;
  transmission?: string;
  drivetrain?: string;
  shortDescription?: string;
  coverPhotoUrl?: string;
  isShortVinException?: boolean;
}

export async function createVehicle(input: CreateVehicleInput): Promise<Vehicle> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Must be signed in to create a vehicle profile.');

  const { normalized } = normalizeVin(input.vin);

  const { data: vehicle, error: vehicleError } = await supabase
    .from('vehicles')
    .insert({
      vin: normalized,
      created_by: user.id,
      cover_photo_url: input.coverPhotoUrl ?? null,
      is_short_vin_exception: normalized.length !== 17 || !!input.isShortVinException,
      is_flagged: normalized.length !== 17, // surfaces in the moderator queue for short-VIN review
    })
    .select()
    .single();
  if (vehicleError) throw vehicleError;

  const { error: detailsError } = await supabase.from('vehicle_details').insert({
    vehicle_id: vehicle.id,
    year: input.year,
    make: input.make,
    model: input.model,
    trim: input.trim ?? null,
    body_style: input.bodyStyle ?? null,
    exterior_color: input.exteriorColor ?? null,
    interior_color: input.interiorColor ?? null,
    engine: input.engine ?? null,
    transmission: input.transmission ?? null,
    drivetrain: input.drivetrain ?? null,
    short_description: input.shortDescription ?? null,
    data_status: 'community_submitted',
  });
  if (detailsError) throw detailsError;

  return vehicle;
}

export async function updateVehicleCoverPhoto(vehicleId: string, coverPhotoUrl: string) {
  const { error } = await supabase.from('vehicles').update({ cover_photo_url: coverPhotoUrl }).eq('id', vehicleId);
  if (error) throw error;
}

export interface MileagePoint {
  event_date: string;
  mileage: number;
  mileage_unit: 'mi' | 'km';
  record_id: string;
  mileage_inconsistency_flag: boolean;
}

export async function getMileageHistory(vehicleId: string): Promise<MileagePoint[]> {
  const { data, error } = await supabase
    .from('records')
    .select('id, event_date, mileage, mileage_unit, mileage_inconsistency_flag')
    .eq('vehicle_id', vehicleId)
    .eq('status', 'published')
    .is('deleted_at', null)
    .not('mileage', 'is', null)
    .order('event_date', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    event_date: r.event_date,
    mileage: r.mileage as number,
    mileage_unit: r.mileage_unit as 'mi' | 'km',
    record_id: r.id,
    mileage_inconsistency_flag: r.mileage_inconsistency_flag,
  }));
}

export async function submitVehicleDetailCorrection(params: {
  vehicleId: string;
  fieldName: string;
  originalValue: string | null;
  suggestedValue: string;
  reason: string;
  evidenceUrls?: string[];
}): Promise<VehicleDetailRevision> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Must be signed in to suggest a correction.');

  const { data, error } = await supabase
    .from('vehicle_detail_revisions')
    .insert({
      vehicle_id: params.vehicleId,
      field_name: params.fieldName,
      original_value: params.originalValue,
      suggested_value: params.suggestedValue,
      reason: params.reason,
      evidence_urls: params.evidenceUrls ?? [],
      submitted_by: user.id,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function submitVinCorrection(params: {
  vehicleId: string;
  originalVin: string;
  suggestedVin: string;
  reason: string;
  evidenceUrls?: string[];
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Must be signed in to report an incorrect VIN.');

  const { normalized } = normalizeVin(params.suggestedVin);
  const { error } = await supabase.from('vin_correction_requests').insert({
    vehicle_id: params.vehicleId,
    original_vin: params.originalVin,
    suggested_vin: normalized,
    reason: params.reason,
    evidence_urls: params.evidenceUrls ?? [],
    submitted_by: user.id,
  });
  if (error) throw error;
}

export async function submitDuplicateVehicleReport(params: {
  vehicleIdA: string;
  vehicleIdB: string;
  reason: string;
  evidenceUrls?: string[];
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Must be signed in to report a duplicate vehicle.');

  const { error } = await supabase.from('duplicate_vehicle_requests').insert({
    vehicle_id_a: params.vehicleIdA,
    vehicle_id_b: params.vehicleIdB,
    reason: params.reason,
    evidence_urls: params.evidenceUrls ?? [],
    submitted_by: user.id,
  });
  if (error) throw error;
}

export async function getVehicleDetailRevisions(vehicleId: string): Promise<VehicleDetailRevision[]> {
  const { data, error } = await supabase
    .from('vehicle_detail_revisions')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function recordVehicleView(vehicleId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from('recently_viewed')
    .upsert(
      { user_id: user.id, target_type: 'vehicle', target_id: vehicleId, viewed_at: new Date().toISOString() },
      { onConflict: 'user_id,target_type,target_id' }
    );
}
