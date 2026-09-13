import Image from 'next/image';
import Link from 'next/link';
import photos from '@/data/swi-photos.json';
export function SwiPhotoGuide({ landType = 'both', expanded = false }: { landType?: string; expanded?: boolean }) {
  return <details open={expanded || undefined} className="my-6 rounded-2xl border bg-white p-5">
    <summary className="cursor-pointer font-semibold">OARS field photos: recognizing visible changes</summary>
    <p className="my-4 text-sm leading-6 text-muted-foreground">Stage labels and photographer initials are reproduced from the supplied filenames. These examples support observation; a photograph alone does not establish salinity or a property’s SWI stage. <Link className="underline" href="/swi-guide">Read the draft farm and forest scorecards.</Link></p>
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{photos.filter(p => landType === 'both' || p.land === landType).map(photo => <figure key={photo.src} className="overflow-hidden rounded-xl border">
      <Image src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="h-64 w-full bg-slate-100 object-contain" />
      <figcaption className="p-4 text-sm"><p className="font-semibold">{photo.label}</p><p className="mt-2 text-muted-foreground">{photo.alt}</p><p className="mt-2 text-xs">Photo credit: {photo.credit} · supplied OARS archive</p></figcaption>
    </figure>)}</div>
  </details>;
}
