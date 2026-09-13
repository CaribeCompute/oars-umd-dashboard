'use client';
import { useId, useState } from 'react';
import { Input } from '@/components/ui/input';
import { formatPropertyAddress, usStates, type PropertyAddress } from '@/lib/property-address';

export function PropertyAddressFields({ existingAddress = '', onEdit }: { existingAddress?: string; onEdit?: () => void }) {
  const id = useId();
  const [editing, setEditing] = useState(!existingAddress);
  const [address, setAddress] = useState<PropertyAddress>({ street: '', unit: '', city: '', state: '', zip: '' });
  const update = (key: keyof PropertyAddress, value: string) => {setAddress(previous => ({ ...previous, [key]: value }));onEdit?.();};
  if (!editing && existingAddress) return <fieldset className="sm:col-span-2"><legend className="mb-3 text-sm font-semibold">Property address</legend><p className="rounded-lg border bg-[var(--mist)] p-3">{existingAddress}</p><input type="hidden" name="address" value={existingAddress}/><button type="button" className="mt-2 text-sm underline" onClick={()=>{setEditing(true);onEdit?.();}}>Change address</button></fieldset>;
  return <fieldset className="sm:col-span-2">
    <legend className="mb-3 text-sm font-semibold">Property address</legend>
    <div className="grid gap-4 sm:grid-cols-2">
      <label htmlFor={`${id}-street`} className="sm:col-span-2"><span className="mb-2 block text-sm">Street address</span><Input id={`${id}-street`} name="street" required pattern="[0-9]+ .+" maxLength={150} autoComplete="address-line1" placeholder="123 Main Street" value={address.street} onChange={event => update('street', event.target.value)} /></label>
      <label htmlFor={`${id}-unit`} className="sm:col-span-2"><span className="mb-2 block text-sm">Apartment, unit, or suite (optional)</span><Input id={`${id}-unit`} name="unit" maxLength={100} autoComplete="address-line2" value={address.unit} onChange={event => update('unit', event.target.value)} /></label>
      <label htmlFor={`${id}-city`}><span className="mb-2 block text-sm">City or town</span><Input id={`${id}-city`} name="city" required maxLength={100} autoComplete="address-level2" value={address.city} onChange={event => update('city', event.target.value)} /></label>
      <label htmlFor={`${id}-state`}><span className="mb-2 block text-sm">State or territory</span><select aria-label="State or territory" id={`${id}-state`} name="state" required autoComplete="address-level1" className="h-10 w-full rounded-lg border bg-white px-3" value={address.state} onChange={event => update('state', event.target.value)}><option value="">Select state</option>{usStates.map(state => <option key={state} value={state}>{state}</option>)}</select></label>
      <label htmlFor={`${id}-zip`}><span className="mb-2 block text-sm">ZIP code</span><Input id={`${id}-zip`} name="zip" required pattern="[0-9]{5}(-[0-9]{4})?" maxLength={10} autoComplete="postal-code" placeholder="21853 or 21853-1234" value={address.zip} onChange={event => update('zip', event.target.value)} /></label>
    </div>
    <input type="hidden" name="address" value={formatPropertyAddress(address)} />
    <p className="mt-2 text-xs text-muted-foreground">U.S. addresses only. Your browser can autofill these fields. We check the map location when you submit; this is not postal delivery verification.</p>
  </fieldset>;
}
