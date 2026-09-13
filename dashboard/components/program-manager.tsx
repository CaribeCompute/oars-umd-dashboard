'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { emptyProgram, type CommunityProgram, type ProgramDraft } from '@/lib/community-programs';
import { programDetailFields, programLinkFields } from '@/lib/program-fields';
async function loadPrograms(): Promise<CommunityProgram[]> {
  const response = await fetch('/api/programs?manage=true', {cache:'no-store'});
  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
  return data.programs;
}
export function ProgramManager({ organization = '' }: { organization?: string }) {
  const [items,setItems] = useState<CommunityProgram[]>([]);
  const [draft,setDraft] = useState<ProgramDraft|CommunityProgram|null>(null);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const [notice,setNotice] = useState('');
  const [loading,setLoading] = useState(true);
  async function refresh() {
    
    try { setItems(await loadPrograms()); setError(''); }
    catch(error) { setError(error instanceof Error?error.message:'Could not load programs.'); }
    finally { setLoading(false); }
  }
  useEffect(()=>{ let active = true; loadPrograms().then(items=>{if(active)setItems(items);}).catch(error=>{if(active)setError(error instanceof Error?error.message:'Could not load programs.');}).finally(()=>{if(active)setLoading(false);}); return ()=>{active=false;}; },[]);
  function fieldInput(key: keyof ProgramDraft, label: string, multiline = true, url = false) {
    if (!draft) return null;
    return <label key={key}><span className="mb-2 block text-sm font-semibold">{label}{['name','agency','description'].includes(key) ? ' *' : ''}</span>{multiline ? <textarea className="min-h-24 w-full rounded-lg border p-3" required={key==='description'} maxLength={5000} value={draft[key] ?? ''} onChange={event=>setDraft({...draft,[key]:event.target.value})}/> : <Input type={url?'url':'text'} required={['name','agency'].includes(key)} maxLength={5000} value={draft[key] ?? ''} onChange={event=>setDraft({...draft,[key]:event.target.value})}/>}</label>;
  }
  return <section className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-2xl font-semibold">Manage programs</h2><p className="mt-2 text-sm text-muted-foreground">Save drafts privately, or publish to the shared catalog. Administrators can manage every contributor entry.</p></div><div className="flex gap-3"><Button variant="outline" disabled={busy||loading} onClick={()=>void refresh()}>Refresh programs</Button><Button disabled={busy} onClick={()=>{setDraft({...emptyProgram,agency:organization});setNotice('');}}>New program</Button></div></div>
    {error&&<p role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}{notice&&<output className="block rounded-lg bg-[var(--teal-soft)] p-4">{notice}</output>}
    {draft&&<form className="rounded-2xl border bg-white p-6" onSubmit={async event=>{event.preventDefault();setBusy(true);setError('');setNotice('');try { const response=await fetch('/api/programs',{method:'id' in draft?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(draft)});const data=await response.json();if(!response.ok)throw new Error(data.error);setDraft(null);await refresh();setNotice(data.program.status==='published'?'Program published. It is now visible in Programs and practices.':'Draft saved. Only you and administrators can see it.'); }catch(error){setError(error instanceof Error?error.message:'Could not save program.');}finally{setBusy(false);}}}>
      <h3 className="text-xl font-semibold">{'id' in draft?'Edit program':'New program'}</h3><p className="mt-2 text-sm text-muted-foreground">Use the same details landowners see in Programs and practices. Fields marked * are required; leave unknown details blank.</p>
      <fieldset disabled={busy} className="mt-6 grid gap-4 sm:grid-cols-2"><legend className="mb-4 text-lg font-semibold">Program basics</legend>
        {fieldInput('name','Program name',false)}{fieldInput('agency','Provider organization',false)}<div className="sm:col-span-2">{fieldInput('description','Description')}</div>
      {Object.entries({type:['Program','Practice'],land:['farm','forest','both','unspecified'],scope:['Federal','MD','DE','NJ','VA','Private'],status:['draft','published']}).map(([key,options])=><label key={key}><span className="mb-2 block text-sm font-semibold">{{type:'Entry type',land:'Land use',scope:'Geographic scope',status:'Visibility'}[key]}</span><select className="h-10 w-full rounded-lg border px-3" value={draft[key as keyof ProgramDraft]} onChange={e=>setDraft({...draft,[key]:e.target.value})}>{options.map(option=><option key={option} value={option}>{option==='published'?'Published — visible to everyone':option==='draft'?'Draft — private':option}</option>)}</select></label>)}</fieldset>
      {Array.from(new Set(programDetailFields.map(field=>field.section))).map(section=><fieldset key={section} disabled={busy} className="mt-7 grid gap-4 border-t pt-4 sm:grid-cols-2"><legend className="pr-3 text-lg font-semibold">{section}</legend>{programDetailFields.filter(field=>field.section===section).map(({key,label})=>fieldInput(key,label))}</fieldset>)}
      <fieldset disabled={busy} className="mt-7 grid gap-4 border-t pt-4 sm:grid-cols-2"><legend className="pr-3 text-lg font-semibold">Websites and resources</legend>{programLinkFields.map(({key,label})=>fieldInput(key,label,false,true))}</fieldset>
      <p className="mt-4 text-sm text-muted-foreground">Publishing makes these details public. To remove your entry from the catalog, change its visibility to Draft and save.</p><div className="mt-5 flex gap-3"><Button disabled={busy} type="submit">{busy?'Saving…':draft.status==='published'?'Save and publish':'Save draft'}</Button><Button disabled={busy} type="button" variant="outline" onClick={()=>setDraft(null)}>Cancel</Button></div>
    </form>}
    {loading?<p>Loading programs…</p>:!items.length&&!error?<p className="rounded-xl border border-dashed p-6">No programs yet. Select New program to add your first entry.</p>:<div className="space-y-3">{items.map(item=><article key={item.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-white p-5"><div><h3 className="font-semibold">{item.name}</h3><p className="text-sm text-muted-foreground">{item.agency} · {item.scope} · {item.status}</p></div><div className="flex gap-4">{item.status==='published'&&<a className="self-center text-sm underline" href={`/programs/${item.id}`} target="_blank" rel="noreferrer">View published program</a>}<Button disabled={busy} variant="outline" onClick={()=>{setDraft({...emptyProgram,...item});setNotice('');}}>Edit</Button></div></article>)}</div>}
  </section>;
}
