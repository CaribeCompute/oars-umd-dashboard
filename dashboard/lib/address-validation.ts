export type VerifiedAddress = { address: string; latitude: number; longitude: number };

/**
 * Address verification is deliberately server-side. Without a configured geocoder
 * we return no result instead of fabricating coordinates.
 */
export async function validateUsAddress(address: string): Promise<VerifiedAddress | null> {
  const value = address.trim();
  if (!value || value.length < 8) return null;
  const endpoint = process.env.ADDRESS_VALIDATION_URL;
  if (!endpoint) return null;
  try {
    const response = await fetch(`${endpoint}?q=${encodeURIComponent(value)}`, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return null;
    const data = await response.json() as { address?: unknown; latitude?: unknown; longitude?: unknown };
    if (typeof data.address !== 'string' || typeof data.latitude !== 'number' || typeof data.longitude !== 'number') return null;
    return { address: data.address, latitude: data.latitude, longitude: data.longitude };
  } catch {
    return null;
  }
}
