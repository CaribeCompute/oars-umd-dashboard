'use client';
import { useEffect, useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';
import type { MapObservation } from '@/lib/property-map';
export function ObservationPhotos({ propertyId, userId, observations, saved }: { propertyId: string; userId: string; observations: MapObservation[]; saved: boolean }) {
  const [selected, setSelected] = useState('');
  const [files, setFiles] = useState<string[]>([]);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const observation = observations.find(o => o.id === selected);
  const hasObservation = Boolean(observation);
  const prefix = `${userId}/${propertyId}/${selected}`;
  useEffect(() => {
    let cancelled = false;
    if (!hasObservation) return;
    const db = createBrowserSupabaseClient(); if (!db) return;
    void db.storage.from('observation-photos').list(prefix, { limit: 100 }).then(({ data, error }) => {
      if (!cancelled) { setFiles(data?.map(f => f.name) ?? []); if (error) setStatus('Photos unavailable. Check the observation photo migration and your connection.'); }
    }).catch(() => { if (!cancelled) setStatus('Could not load photos. Please retry.'); });
    return () => { cancelled = true; };
  }, [prefix, hasObservation, revision]);
  async function upload(file: File) {
    const db = createBrowserSupabaseClient(); if (!db || !saved || !observation) return;
    if (!['image/jpeg','image/png'].includes(file.type) || !file.size || file.size > 10485760) { setStatus('Choose a JPG or PNG photo up to 10 MB.'); return; }
    setBusy(true); setStatus('Uploading photo…');
    try {
      const { error } = await db.storage.from('observation-photos').upload(`${prefix}/${crypto.randomUUID()}.${file.type === 'image/png' ? 'png' : 'jpg'}`, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      setRevision(n => n + 1); setStatus('Photo saved privately.');
    } catch { setStatus('Upload failed. Check your connection and apply the observation photo migration if needed.'); }
    finally { setBusy(false); }
  }
  async function download(name: string) {
    const db = createBrowserSupabaseClient(); if (!db) return;
    setBusy(true);
    try {
      const { data, error } = await db.storage.from('observation-photos').download(`${prefix}/${name}`);
      if (error || !data) throw error;
      const url = URL.createObjectURL(data); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 60000);
      setStatus('Photo downloaded. Attach it yourself in Survey123.');
    } catch { setStatus('Could not download this photo. Please retry.'); }
    finally { setBusy(false); }
  }
  async function remove(name: string) {
    const db = createBrowserSupabaseClient(); if (!db) return;
    setBusy(true);
    try { const { error } = await db.storage.from('observation-photos').remove([`${prefix}/${name}`]); if (error) throw error; setRevision(n => n + 1); }
    catch { setStatus('Could not delete photo. Please retry.'); }
    finally { setBusy(false); }
  }
  return <section data-tour="observation-photos" className="space-y-3 border-t p-5"><h2 className="text-lg font-semibold">Your observation photos</h2><p className="text-sm">Save original photos privately with a marker. Download a salt-patch photo here before attaching it in Survey123. Photos are not automatically shared. Remove photos before deleting their marker or property.</p>
    <label className="block text-sm">Observation<select className="ml-3 rounded border p-2" value={selected} disabled={busy} onChange={e => { setSelected(e.target.value); setFiles([]); setStatus(''); }}><option value="">Select a marker</option>{observations.map((o,i) => <option key={o.id} value={o.id}>{i + 1}. {o.category.replace('_',' ')} · {o.observedAt} · {o.coordinates.join(', ')}</option>)}</select></label>
    {observation && <><label className="block text-sm">Add photo (JPG/PNG, up to 10 MB)<input className="mt-2 block" type="file" accept="image/jpeg,image/png" disabled={!saved || busy} onChange={e => { const file=e.target.files?.[0]; e.target.value=''; if(file) void upload(file); }} /></label>{!saved && <p className="text-sm">Wait for the map to save before uploading.</p>}<ul className="space-y-2">{files.map((file,i) => <li key={file} className="flex gap-4 text-sm"><button disabled={busy} className="underline" onClick={() => void download(file)}>Download photo {i + 1}</button><button disabled={busy} className="underline" onClick={() => void remove(file)}>Delete photo {i + 1}</button></li>)}</ul>{!files.length && <p className="text-sm">No saved photos loaded for this marker.</p>}</>}
    <output className="block text-sm" aria-live="polite">{status}</output>
  </section>;
}
