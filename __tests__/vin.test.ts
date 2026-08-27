import { normalizeVin, validateVin, verifyCheckDigit } from '../lib/vin';

describe('normalizeVin', () => {
  it('uppercases and strips separators without altering characters', () => {
    const result = normalizeVin('1hgc m826-33a.004352');
    expect(result.normalized).toBe('1HGCM82633A004352');
  });

  it('flags when normalization changed the input', () => {
    expect(normalizeVin('abc123').changed).toBe(true);
    expect(normalizeVin('ABC123').changed).toBe(false);
  });
});

describe('validateVin', () => {
  it('accepts a well-formed 17-character VIN', () => {
    const result = validateVin('1HGCM82633A004352');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects VINs containing I, O, or Q', () => {
    const result = validateVin('1HGCM8263IA004352');
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toMatch(/I, O, or Q/);
  });

  it('rejects VINs shorter than 5 or longer than 17 characters', () => {
    expect(validateVin('AB12').valid).toBe(false);
    expect(validateVin('A'.repeat(18)).valid).toBe(false);
  });

  it('requires moderator review (warning, not hard error) for non-17-length VINs', () => {
    const result = validateVin('AB1234567');
    expect(result.valid).toBe(true);
    expect(result.requiresShortVinException).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('never silently modifies the VIN beyond case/whitespace normalization', () => {
    const withTypo = validateVin('1HGCM8263XA004352'); // deliberately altered check digit
    expect(withTypo.normalized).toBe('1HGCM8263XA004352');
  });
});

describe('verifyCheckDigit', () => {
  it('returns null for non-17-character input', () => {
    expect(verifyCheckDigit('SHORTVIN')).toBeNull();
  });

  it('validates a known-good North American VIN check digit', () => {
    // Textbook NHTSA check-digit example; position 9 ('X') is correct for
    // this VIN under the standard transliteration/weight table.
    expect(verifyCheckDigit('1M8GDM9AXKP042788')).toBe(true);
  });

  it('detects a mismatched check digit', () => {
    expect(verifyCheckDigit('1M8GDM9A0KP042788')).toBe(false);
  });
});
