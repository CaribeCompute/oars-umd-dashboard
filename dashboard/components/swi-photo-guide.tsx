'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import photos from '@/data/swi-photos.json';

function PhotoCard({ photo }: { photo: (typeof photos)[number] }) {
  const credit = photo.credit ? `Photo credit: ${photo.credit}` : 'Photographer credit not supplied';
  return <figure className="overflow-hidden rounded-xl border bg-white">
    <Dialog>
      <DialogTrigger className="group block w-full cursor-zoom-in text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--teal-dark)]" aria-label={`Enlarge photo: ${photo.label}`}>
        <Image src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} sizes="(max-width: 640px) 100vw, 50vw" className="h-80 w-full bg-slate-100 object-contain" />
        <span className="block border-t px-4 py-2 text-sm font-semibold text-[var(--teal-dark)] group-hover:underline">Enlarge photo ↗</span>
      </DialogTrigger>
      <DialogContent className="max-h-[95dvh] w-[calc(100%-1rem)] max-w-6xl overflow-y-auto p-4 sm:max-w-6xl">
        <DialogTitle className="pr-10 text-xl leading-7">{photo.label}</DialogTitle>
        <DialogDescription>{photo.alt} {photo.stageLabeled ? 'Stage range supplied in the original filename.' : 'SWI stage not assigned.'} {credit}.</DialogDescription>
        <Image src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} sizes="95vw" className="max-h-[65dvh] w-full bg-slate-950 object-contain" />
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <p>{photo.width} × {photo.height} pixels · OARS archive</p>
          <a className="font-semibold text-[var(--teal-dark)] underline" href={photo.src} target="_blank" rel="noreferrer">Open original image in new tab ↗</a>
        </div>
      </DialogContent>
    </Dialog>
    <figcaption className="p-4 text-sm"><p className="font-semibold">{photo.label}</p><p className="mt-2 text-muted-foreground">{photo.alt}</p>{!photo.stageLabeled && <p className="mt-2 text-xs font-semibold">SWI stage not assigned</p>}<p className="mt-2 text-xs">{credit} · supplied OARS archive</p></figcaption>
  </figure>;
}

export function SwiPhotoGuide({ landType = 'both', expanded = false }: { landType?: string; expanded?: boolean }) {
  const visible = photos.filter(p => landType === 'both' || p.land === landType);
  return <details open={expanded || undefined} className="my-6 rounded-2xl border bg-white p-5">
    <summary className="cursor-pointer font-semibold">OARS field photos: recognizing visible changes</summary>
    <p className="my-4 text-sm leading-6 text-muted-foreground">Select any photo to enlarge it, or open its original image to zoom further. These examples support observation; a photograph alone does not establish salinity or a property’s SWI stage. <Link className="underline" href="/swi-guide">Read the draft farm and forest scorecards.</Link></p>
    <p className="my-4 rounded-lg bg-[var(--mist)] p-3 text-sm leading-6">This collection does not yet illustrate every stage. We still need OARS-labeled no-impact and early-stage examples for farms and forests, along with full photographer credits.</p>
    {[true, false].map(stageLabeled => <section key={String(stageLabeled)} className="mt-6">
      <h3 className="mb-2 text-lg font-semibold">{stageLabeled ? 'Examples with supplied stage labels' : 'Additional field observations'}</h3>
      <p className="mb-4 text-sm text-muted-foreground">{stageLabeled ? 'Labels and photographer initials reproduce the source filenames.' : 'These photos show visible features. The source does not assign a stage or identify the photographer.'}</p>
      <div className="grid gap-5 sm:grid-cols-2">{visible.filter(p => p.stageLabeled === stageLabeled).map(photo => <PhotoCard key={photo.src} photo={photo} />)}</div>
    </section>)}
  </details>;
}
