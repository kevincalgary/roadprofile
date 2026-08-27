import { formatDistanceToNowStrict } from 'date-fns';
import type { RecordCategory, Relationship } from './types/database';

export function relativeTime(iso: string): string {
  return formatDistanceToNowStrict(new Date(iso), { addSuffix: true });
}

export function formatMileage(mileage: number, unit: 'mi' | 'km'): string {
  return `${mileage.toLocaleString()} ${unit}`;
}

export const CATEGORY_LABELS: Record<RecordCategory, string> = {
  maintenance: 'Maintenance',
  repair: 'Repair',
  inspection: 'Inspection',
  modification: 'Modification',
  damage: 'Damage / Accident',
  recall: 'Recall Work',
  sale_auction: 'Sale or Auction',
  ownership_experience: 'Ownership Experience',
  mileage_update: 'Mileage Update',
  general_history: 'General History',
  photo_sighting: 'Photo / Sighting',
};

export const RELATIONSHIP_LABELS: Record<Relationship, string> = {
  current_owner: 'Self-reported current owner',
  former_owner: 'Self-reported former owner',
  mechanic: 'Self-reported mechanic',
  dealer: 'Self-reported dealer',
  family_member: 'Self-reported family member',
  enthusiast: 'Enthusiast',
  witness: 'Witness',
  other: 'Contributor',
};

export function formatVinForDisplay(vin: string): string {
  return vin.replace(/(.{4})/g, '$1 ').trim();
}
