// RoadProfile VIN normalization, validation, and (advisory-only) check-digit
// verification. Per the product rules:
//   - Normalize letters to uppercase, remove spaces/accidental separators.
//   - Never silently "correct" a submitted character — normalization only
//     touches case and whitespace, nothing else.
//   - 17 characters required for modern vehicles; I, O, Q are always invalid.
//   - Check-digit validation only applies to modern 17-character
//     North-American-scheme VINs, and is surfaced as a warning, not a hard
//     rejection — many legitimate non-NA VINs don't follow that scheme.
//   - Vehicles with 5-16 character VINs require a moderated exception before
//     the profile is treated as fully published (see vehicles.ts).

export interface VinNormalizationResult {
  raw: string;
  normalized: string;
  changed: boolean;
}

export function normalizeVin(input: string): VinNormalizationResult {
  const raw = input;
  const normalized = input.toUpperCase().replace(/[\s\-_.]/g, '');
  return { raw, normalized, changed: normalized !== input };
}

export interface VinValidationResult {
  valid: boolean;
  normalized: string;
  errors: string[];
  warnings: string[];
  requiresShortVinException: boolean;
}

const INVALID_CHARS = /[IOQ]/;
const VALID_CHARSET = /^[A-HJ-NPR-Z0-9]+$/;

export function validateVin(input: string): VinValidationResult {
  const { normalized } = normalizeVin(input);
  const errors: string[] = [];
  const warnings: string[] = [];

  if (normalized.length === 0) {
    errors.push('VIN is required.');
  } else if (normalized.length < 5 || normalized.length > 17) {
    errors.push('VIN must be between 5 and 17 characters.');
  }

  if (INVALID_CHARS.test(normalized)) {
    errors.push('VIN cannot contain the letters I, O, or Q.');
  } else if (normalized.length > 0 && !VALID_CHARSET.test(normalized)) {
    errors.push('VIN can only contain letters and numbers.');
  }

  const requiresShortVinException = normalized.length > 0 && normalized.length !== 17;
  if (requiresShortVinException) {
    warnings.push(
      'This VIN is not the modern 17-character length. Older or non-standard chassis/serial numbers require moderator review before the profile is fully published.'
    );
  }

  if (normalized.length === 17 && errors.length === 0) {
    const checkDigitResult = verifyCheckDigit(normalized);
    if (checkDigitResult === false) {
      warnings.push(
        'The check digit (position 9) does not match the North American VIN scheme. This is common for VINs issued outside North America — double-check the VIN before publishing.'
      );
    }
  }

  return {
    valid: errors.length === 0,
    normalized,
    errors,
    warnings,
    requiresShortVinException,
  };
}

const TRANSLITERATION: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
  J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
  S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
};
const WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

/** Returns true/false for a clear match/mismatch, or null if not applicable. */
export function verifyCheckDigit(vin17: string): boolean | null {
  if (vin17.length !== 17) return null;
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const ch = vin17[i];
    const value = /[0-9]/.test(ch) ? Number(ch) : TRANSLITERATION[ch];
    if (value === undefined) return null;
    sum += value * WEIGHTS[i];
  }
  const remainder = sum % 11;
  const expected = remainder === 10 ? 'X' : String(remainder);
  return vin17[8] === expected;
}
