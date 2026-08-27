import { supabase } from '../supabase';
import type { VehicleRecord, VehicleDetailRevision } from '../types/database';

export interface HistorySummary {
  maintenance: VehicleRecord[];
  repairs: VehicleRecord[];
  damage: VehicleRecord[];
  modifications: VehicleRecord[];
  recalls: VehicleRecord[];
  salesOrAuctions: VehicleRecord[];
  contributorCount: number;
  disputedRevisions: VehicleDetailRevision[];
  gapYears: number[];
}

export async function getHistorySummary(vehicleId: string, vehicleYear: number): Promise<HistorySummary> {
  const { data: allRecords, error } = await supabase
    .from('records')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('event_date', { ascending: true });
  if (error) throw error;

  const records = allRecords ?? [];
  const byCategory = (cat: string) => records.filter((r) => r.category === cat);

  const contributorCount = new Set(records.map((r) => r.author_id)).size;

  const { data: revisions } = await supabase
    .from('vehicle_detail_revisions')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: false });

  const currentYear = new Date().getFullYear();
  const yearsWithRecords = new Set(records.map((r) => new Date(r.event_date).getFullYear()));
  const gapYears: number[] = [];
  for (let y = vehicleYear; y <= currentYear; y++) {
    if (!yearsWithRecords.has(y)) gapYears.push(y);
  }

  return {
    maintenance: byCategory('maintenance'),
    repairs: byCategory('repair'),
    damage: byCategory('damage'),
    modifications: byCategory('modification'),
    recalls: byCategory('recall'),
    salesOrAuctions: byCategory('sale_auction'),
    contributorCount,
    disputedRevisions: (revisions ?? []) as VehicleDetailRevision[],
    gapYears,
  };
}
