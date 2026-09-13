import 'server-only';

type AddressMatch = {
  display_name: string;
  lat: string;
  lon: string;
  address?: { country_code?: string; house_number?: string; road?: string };
};
export async function validateUsAddress(address: string) {
  const query = address.trim();
  if (query.length < 8 || query.length > 500) return null;
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.search = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    countrycodes: 'us',
    addressdetails: '1',
    limit: '1',
  }).toString();
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'OARS-UMD-Dashboard/0.1 (https://github.com/CaribeCompute/oars-umd-dashboard)',
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(10000),
    next: { revalidate: 86400 },
  });
  if (!response.ok) throw new Error('Address provider unavailable.');
  const matches = (await response.json()) as AddressMatch[];
  const match = matches[0];
  if (
    !match?.address?.house_number ||
    !match.address.road ||
    match.address.country_code !== 'us'
  )
    return null;
  const latitude = Number(match.lat);
  const longitude = Number(match.lon);
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  )
    return null;
  return { address: match.display_name, latitude, longitude };
}
