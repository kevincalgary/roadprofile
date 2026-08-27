import { formatMileage, formatVinForDisplay, CATEGORY_LABELS, RELATIONSHIP_LABELS } from '../lib/format';
import type { RecordCategory, Relationship } from '../lib/types/database';

describe('formatMileage', () => {
  it('formats with thousands separators and unit', () => {
    expect(formatMileage(128400, 'mi')).toBe('128,400 mi');
    expect(formatMileage(0, 'km')).toBe('0 km');
  });
});

describe('formatVinForDisplay', () => {
  it('groups the VIN into 4-character chunks for legibility', () => {
    expect(formatVinForDisplay('1HGCM82633A004352')).toBe('1HGC M826 33A0 0435 2');
  });
});

describe('label maps stay in sync with the schema enums', () => {
  const allCategories: RecordCategory[] = [
    'maintenance', 'repair', 'inspection', 'modification', 'damage', 'recall',
    'sale_auction', 'ownership_experience', 'mileage_update', 'general_history', 'photo_sighting',
  ];
  const allRelationships: Relationship[] = [
    'current_owner', 'former_owner', 'mechanic', 'dealer', 'family_member', 'enthusiast', 'witness', 'other',
  ];

  it('has a label for every record category', () => {
    for (const category of allCategories) {
      expect(CATEGORY_LABELS[category]).toBeTruthy();
    }
  });

  it('has a label for every relationship', () => {
    for (const relationship of allRelationships) {
      expect(RELATIONSHIP_LABELS[relationship]).toBeTruthy();
    }
  });
});
