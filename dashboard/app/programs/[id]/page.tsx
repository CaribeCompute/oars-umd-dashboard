import Link from 'next/link';
import { notFound } from 'next/navigation';
import { programs } from '@/lib/programs';
import { ProgramDetails } from '@/components/program-details';
export function generateStaticParams() { return programs.map(p => ({ id: p.id })); }
export default async function ProgramPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const program = programs.find(p => p.id === id);
  if (!program) notFound();
  return <main className="min-h-screen bg-[var(--mist)]"><nav className="flex flex-wrap gap-5 bg-[var(--navy)] p-5 text-white"><Link href="/programs">← Programs and practices</Link><Link href="/">OARS dashboard</Link><Link href="/gis">GIS explorer</Link></nav><article className="mx-auto max-w-5xl px-5 py-10"><p className="text-sm font-semibold text-[var(--teal-dark)]">{program.scope} · {program.type}{program.shortlisted ? ' · OARS shortlist' : ''}</p><h1 className="mt-3 text-3xl font-semibold">{program.name}</h1><p className="mt-3 text-muted-foreground">{program.agency}</p><p className="my-6 leading-7">{program.description}</p><div className="rounded-2xl border bg-white p-6"><ProgramDetails program={program} /></div></article></main>;
}
