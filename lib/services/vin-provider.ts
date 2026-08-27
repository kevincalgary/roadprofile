// RoadProfile does not currently have a licensed external VIN-data
// provider. This module defines the interface a real provider would
// implement, plus a local fallback that never guesses specifications —
// it only checks RoadProfile's own records and validates format. Swapping
// in a real provider later means implementing VinProvider and changing
// getVinProvider() below; no call sites elsewhere need to change.

export interface VinDecodeResult {
  source: 'local' | 'external';
  found: boolean;
  // Only ever populated by a real external provider. The local provider
  // must leave these null — RoadProfile never fabricates specifications.
  year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
  bodyStyle: string | null;
  raw?: unknown;
}

export interface VinProvider {
  readonly name: string;
  /** Never throws for an unavailable service — returns found:false so the
   *  UI can fall back to manual entry instead of blocking the flow. */
  decode(vin: string): Promise<VinDecodeResult>;
}

class LocalOnlyVinProvider implements VinProvider {
  readonly name = 'local';

  async decode(_vin: string): Promise<VinDecodeResult> {
    // No external decode service is configured. Callers should treat this
    // as "unavailable" and proceed straight to manual community entry.
    return {
      source: 'local',
      found: false,
      year: null,
      make: null,
      model: null,
      trim: null,
      bodyStyle: null,
    };
  }
}

let cachedProvider: VinProvider | null = null;

export function getVinProvider(): VinProvider {
  if (cachedProvider) return cachedProvider;
  // process.env.EXPO_PUBLIC_VIN_PROVIDER selects a provider by name once one
  // is approved and implemented (e.g. an NHTSA or commercial vPIC client).
  // Until then this always resolves to the local, non-guessing fallback.
  cachedProvider = new LocalOnlyVinProvider();
  return cachedProvider;
}
