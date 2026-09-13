'use client';
import { ObservationPhotos } from '@/components/observation-photos';
import { useEffect, useState, useRef } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';
import { GisExplorer } from '@/components/gis-explorer';
import { emptyMapData, validMapData, mapGeoJSON, type PropertyMapData } from '@/lib/property-map';
type SavedProperty = { id: string; name: string; address: string; latitude: number | null; longitude: number | null };
function exportMap(data: PropertyMapData) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(mapGeoJSON(data), null, 2)], { type: 'application/geo+json' }));
  const a = document.createElement('a'); a.href = url; a.download = 'oars-property-observations.geojson'; a.click(); URL.revokeObjectURL(url);
}
function SavedMap({ property, userId, onBusy }: { property: SavedProperty; userId: string; onBusy: (busy: boolean) => void }) {
  const [data, setData] = useState<PropertyMapData | null>(null);
  const [seed, setSeed] = useState<PropertyMapData>(emptyMapData);
  const [saved, setSaved] = useState('');
  const [version, setVersion] = useState(0);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const saving = useRef(false);
  const [conflict, setConflict] = useState(false);
  const key = `oars-map-draft:${userId}:${property.id}`;
  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/property-map?propertyId=${property.id}`).then(async r => { const result = await r.json(); if (!r.ok) throw new Error(result.error); return result; }).then(result => {
      if (cancelled) return;
      let next = result.data;
      try {
        const raw = localStorage.getItem(key);
        if (raw) { const draft = JSON.parse(raw); if (validMapData(draft.data)) { next = draft.data; if (draft.version !== result.version) { setConflict(true); setError('A newer map exists on the server. Export this recovered draft, then load the server version.'); } } }
      } catch { /* The remote record remains available when browser storage is disabled. */ }
      setVersion(result.version); setSaved(JSON.stringify(result.data)); setSeed(next); setData(next);
    }).catch(e => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [property.id, key]);
  const serialized = JSON.stringify(data);
  const dirty = data !== null && serialized !== saved;
  useEffect(() => {
    onBusy(dirty);
    const warn = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); } };
    window.addEventListener('beforeunload', warn);
    return () => { window.removeEventListener('beforeunload', warn); onBusy(false); };
  }, [dirty, onBusy]);
  useEffect(() => {
    if (!data || !dirty || conflict) return;
    try { localStorage.setItem(key, JSON.stringify({ version, data })); } catch { /* Server save is still attempted. */ }
    if (saving.current) return;
    const timer = setTimeout(async () => {
      saving.current = true; setError('');
      try {
        const r = await fetch(`/api/property-map?propertyId=${property.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ version, data }) });
        const result = await r.json();
        if (!r.ok) throw new Error(result.error);
        setVersion(result.version); setSaved(serialized);
        try { const draft = JSON.parse(localStorage.getItem(key) || 'null'); if (draft && JSON.stringify(draft.data) === serialized) localStorage.removeItem(key); else if (draft) localStorage.setItem(key, JSON.stringify({ ...draft, version: result.version })); } catch { /* Optional browser recovery copy. */ }
      } catch (e) { setError(e instanceof Error ? e.message : 'Save failed.'); }
      finally { saving.current = false; }
    }, 800);
    return () => clearTimeout(timer);
  }, [data, dirty, serialized, saved, version, property.id, key, retry, conflict]);
  if (!data) return <output className="block p-5">{error || 'Loading saved map…'}</output>;
  return <>
    <div className="flex flex-wrap items-center gap-4 border-b p-4">
      <output>{error || (dirty ? 'Unsaved changes · saving…' : 'All map changes saved')}</output>
      {error && !conflict && <button className="underline" onClick={() => setRetry(n => n + 1)}>Retry save</button>}
      <button className="underline" onClick={() => { localStorage.removeItem(key); window.location.reload(); }}>Discard local draft and reload saved map</button>
      <button className="underline" onClick={() => exportMap(data)}>Export GeoJSON</button>
      <p className="text-xs">Export includes your boundary, coordinates, and notes. Share it only when intended.</p>
    </div>
    <GisExplorer saved initialMapData={seed} onDataChange={setData} property={property.latitude !== null && property.longitude !== null ? { name: property.name, location: property.address, latitude: property.latitude, longitude: property.longitude } : undefined} />
    <ObservationPhotos propertyId={property.id} userId={userId} observations={data.observations} saved={!dirty && !error && !conflict} />
  </>;
}
export function PersonalGis({ initialPropertyId }: { initialPropertyId?: string }) {
  const [properties, setProperties] = useState<SavedProperty[]>([]);
  const [selected, setSelected] = useState(initialPropertyId || '');
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const db = createBrowserSupabaseClient(); if (!db) return;
        const { data: { user } } = await db.auth.getUser(); if (!user || cancelled) return;
        setUserId(user.id);
        const { data, error } = await db.from('properties').select('id,name,address,latitude,longitude').eq('owner_id', user.id).order('created_at');
        if (error) throw error;
        if (!cancelled) { setProperties(data || []); setSelected(current => { const requested = current || new URLSearchParams(window.location.search).get('propertyId') || ''; return data?.some(p => p.id === requested) ? requested : data?.[0]?.id || ''; }); }
      } catch { if (!cancelled) setError('Could not load properties. Check your connection and account access.'); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);
  const property = properties.find(p => p.id === selected);
  if (loading) return <p className="p-5">Loading your GIS workspace…</p>;
  return <>
    {userId && <div data-tour="properties" className="border-b p-4"><label className="font-semibold">My properties <select className="ml-3 rounded border p-2" value={selected} disabled={busy || !properties.length} onChange={e => setSelected(e.target.value)}>{properties.map(p => <option value={p.id} key={p.id}>{p.name}</option>)}</select></label><p className="mt-2 text-sm">{error || (!properties.length ? 'Add a property in your dashboard to save a map.' : 'Choose a property to load its boundary and observations.')}</p></div>}
    {property ? <SavedMap key={property.id} property={property} userId={userId} onBusy={setBusy} /> : <GisExplorer />}
  </>;
}
