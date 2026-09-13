export const usStates = 'AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY AS GU MP PR VI'.split(' ');
export type PropertyAddress = { street: string; unit: string; city: string; state: string; zip: string };
export function formatPropertyAddress(value: PropertyAddress) {
  return [value.street.trim(), value.unit.trim(), value.city.trim(), `${value.state} ${value.zip.trim()}`, 'USA'].filter(Boolean).join(', ');
}
export function validatePropertyAddress(value: PropertyAddress) {
  if (!/^\d+\s+\S/.test(value.street.trim()) || value.street.length > 150) return 'Enter a street number and street name.';
  if (!value.city.trim() || value.city.length > 100) return 'Enter the property city or town.';
  if (!usStates.includes(value.state)) return 'Select a valid U.S. state or territory.';
  if (!/^\d{5}(-\d{4})?$/.test(value.zip.trim())) return 'Enter a five-digit ZIP code or ZIP+4 (12345-6789).';
  if (value.unit.length > 100) return 'Unit must be 100 characters or fewer.';
  return null;
}
