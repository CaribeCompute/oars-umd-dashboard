'use client';
import { useState } from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { saltPatchSurveyUrl, surveyNotes } from '@/lib/salt-patch-survey';
import type { MapObservation } from '@/lib/property-map';
export function SaltPatchHandoff({ observation }: { observation: MapObservation }) {
  const [name, setName] = useState('');
  const [county, setCounty] = useState('');
  const [notes, setNotes] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const reviewedNotes = notes ?? surveyNotes(observation);
  const valid = name.trim() && county.trim() && reviewedNotes.length <= 1000 && consent;
  return <Dialog><DialogTrigger className="text-left text-sm font-semibold underline" onClick={() => { setNotes(null); setConsent(false); }}>Report this salt patch to Salt Patch Mapper ↗</DialogTrigger>
    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
      <DialogTitle>Review your Salt Patch Mapper report</DialogTitle>
      <DialogDescription>These details will be sent to the University of Delaware Survey123 form when you continue. Review the pin, attach your own patch photo, complete CAPTCHA, and submit there. Opening the form does not submit a report.</DialogDescription>
      <label className="grid gap-1 text-sm">Your name<input className="rounded border p-2" value={name} maxLength={150} onChange={e => setName(e.target.value)} /></label>
      <label className="grid gap-1 text-sm">County, State<input className="rounded border p-2" placeholder="e.g. Somerset, Maryland" value={county} maxLength={150} onChange={e => setCounty(e.target.value)} /></label>
      <p className="text-sm">Salt-patch pin: {observation.coordinates.join(', ')} (latitude, longitude). This must identify the patch, not the property center.</p>
      <label className="grid gap-1 text-sm">Notes to share<textarea className="min-h-32 rounded border p-2" value={reviewedNotes} onChange={e => setNotes(e.target.value)} /><span>{reviewedNotes.length}/1000 characters{reviewedNotes.length > 1000 ? ' — shorten notes before continuing; nothing is silently removed.' : ''}</span></label>
      <p className="text-sm">Survey123 sets today’s date. The observation date is included in the notes above. Download any saved observation photo first, then attach it in the survey.</p>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />I want to share the displayed name, location, and notes with Salt Patch Mapper. These details will be included in the link and may remain in browser history.</label>
      {valid ? <a className="rounded bg-[var(--teal-dark)] p-3 text-center font-semibold text-white" href={saltPatchSurveyUrl(observation, name, county, reviewedNotes)} target="_blank" rel="noreferrer">Continue to Survey123 ↗</a> : <button disabled className="rounded bg-slate-200 p-3 text-slate-600">Complete the review to continue</button>}
    </DialogContent>
  </Dialog>;
}
