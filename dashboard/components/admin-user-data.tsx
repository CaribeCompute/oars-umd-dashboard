'use client';
import { useEffect, useState } from 'react';
import { GisExplorer } from '@/components/gis-explorer';
import { ObservationPhotos } from '@/components/observation-photos';
import { emptyMapData, type PropertyMapData } from '@/lib/property-map';
type Row = Record<string, unknown>;
type Account = { user_id: string; display_name: string; email: string; role: string; status: string };
type Property = Row & { id: string; name: string; address: string; latitude: number | null; longitude: number | null };
type Detail = { profile: Row; properties: Property[]; applications: Row[]; assignments: Row[] };
type PropertyDetail = { property: Property; map: { data: PropertyMapData; updated_at: string } | null; assessment: Row | null };
function useData<T>(query: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/api/admin-user-data${query}`, { cache: 'no-store', signal: controller.signal }).then(async response => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not load user data.');
      if (!controller.signal.aborted) setData(result);
    }).catch(e => { if (!controller.signal.aborted) setError(e.message); });
    return () => controller.abort();
  }, [query]);
  return { data, error };
}
function Fields({ data }: { data: Row }) {
  return <dl className="grid gap-3 sm:grid-cols-2">{Object.entries(data).map(([key, value]) => <div key={key} className="min-w-0"><dt className="text-sm font-semibold capitalize">{key.replaceAll('_', ' ')}</dt><dd className="whitespace-pre-wrap break-words text-sm text-muted-foreground">{value === null || value === '' ? 'Not provided' : typeof value === 'object' ? JSON.stringify(value, null, 2) : typeof value === 'string' ? value : JSON.stringify(value)}</dd></div>)}</dl>;
}
function Records({ title, rows }: { title: string; rows: Row[] }) {
  return <details className="rounded-xl border bg-white p-4"><summary className="cursor-pointer font-semibold">{title} ({rows.length})</summary><div className="mt-4 space-y-5">{rows.map((row, i) => <Fields key={typeof row.id === 'string' ? row.id : i} data={row} />)}{!rows.length && <p>No saved records.</p>}</div></details>;
}
export function AdminUserData() {
  const [revision, setRevision] = useState(0);
  return <section className="space-y-5"><h2 className="text-2xl font-semibold">User profiles and saved property data</h2><p>Review OARS profiles, properties, saved assessments, applications, assignments, GIS boundaries, flooding and salt-patch markers, notes, and observation photos. This administrator view is read-only.</p><button className="rounded border px-4 py-2" onClick={() => setRevision(n => n + 1)}>Refresh user data</button><Accounts key={revision} /></section>;
}
function Accounts() {
  const { data, error } = useData<{ profiles: Account[] }>('');
  const [search, setSearch] = useState('');
  const [userId, setUserId] = useState('');
  if (error) return <p role="alert" className="text-red-700">{error}</p>;
  if (!data) return <output>Loading accounts…</output>;
  return <div className="space-y-5"><label className="block">Search accounts<input className="mt-1 block w-full rounded border p-3" value={search} onChange={e => setSearch(e.target.value)} placeholder="Name, email, or role" /></label><label className="block">Account<select aria-label="Account" className="mt-1 block w-full rounded border p-3" value={userId} onChange={e => setUserId(e.target.value)}><option value="">Select an account</option>{data.profiles.filter(a => `${a.display_name} ${a.email} ${a.role}`.toLowerCase().includes(search.toLowerCase()) || a.user_id === userId).map(a => <option key={a.user_id} value={a.user_id}>{a.display_name} · {a.email} · {a.role} · {a.status}</option>)}</select></label>{userId && <AccountData key={userId} userId={userId} />}</div>;
}
function AccountData({ userId }: { userId: string }) {
  const { data, error } = useData<Detail>(`?userId=${userId}`);
  const [propertyId, setPropertyId] = useState('');
  if (error) return <p role="alert" className="text-red-700">{error}</p>;
  if (!data) return <output>Loading profile…</output>;
  return <div className="space-y-5"><article className="rounded-xl border bg-white p-5"><h3 className="mb-4 text-xl font-semibold">Complete OARS profile</h3><Fields data={data.profile} /></article><Records title="Applications" rows={data.applications} /><Records title="Officer assignments" rows={data.assignments} /><label className="block font-semibold">Properties ({data.properties.length})<select aria-label="Property" className="mt-1 block w-full rounded border p-3 font-normal" value={propertyId} onChange={e => setPropertyId(e.target.value)}><option value="">Select a property to review</option>{data.properties.map(p => <option key={p.id} value={p.id}>{p.name} · {p.address}</option>)}</select></label>{!data.properties.length && <p>This account has no saved properties.</p>}{propertyId && <PropertyData key={propertyId} userId={userId} propertyId={propertyId} />}</div>;
}
function PropertyData({ userId, propertyId }: { userId: string; propertyId: string }) {
  const { data, error } = useData<PropertyDetail>(`?userId=${userId}&propertyId=${propertyId}`);
  if (error) return <p role="alert" className="text-red-700">{error}</p>;
  if (!data) return <output>Loading saved GIS and assessment…</output>;
  const { property, map, assessment } = data;
  const mapData = map?.data ?? emptyMapData;
  const point = mapData.boundary[0] ?? mapData.observations[0]?.coordinates;
  const latitude = property.latitude ?? point?.[0];
  const longitude = property.longitude ?? point?.[1];
  return <div className="space-y-5"><article className="rounded-xl border bg-white p-5"><h3 className="mb-4 text-xl font-semibold">Property details</h3><Fields data={property} /></article><Records title="Saved assessment" rows={assessment ? [assessment] : []} /><p>{map ? `Saved GIS last updated: ${new Date(map.updated_at).toLocaleString()}` : 'This property has no saved GIS additions.'}</p><GisExplorer readOnly initialMapData={mapData} property={latitude != null && longitude != null ? { name: property.name, location: property.address, latitude, longitude } : undefined} /><ObservationPhotos readOnly saved propertyId={propertyId} userId={userId} observations={mapData.observations} /></div>;
}
