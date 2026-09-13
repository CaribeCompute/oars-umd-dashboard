import Link from 'next/link';
import { ExploreCatalog } from '@/components/explore-catalog';
export default function ProgramsPage() {
  return <main>
    <nav aria-label="Public navigation" className="flex flex-wrap gap-6 bg-[var(--navy)] px-6 py-4 text-white">
      <Link href="/">← OARS dashboard</Link>
      <Link href="/programs" aria-current="page">Programs</Link>
      <Link href="/gis">GIS explorer</Link>
    </nav>
    <ExploreCatalog />
  </main>;
}
