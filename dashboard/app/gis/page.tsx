import Link from 'next/link';
import { GisExplorer } from '@/components/gis-explorer';
export default function GisPage() {
  return (
    <main>
      <nav className="bg-[var(--navy)] px-6 py-4 text-white">
        <Link href="/">← Back to OARS dashboard</Link>
      </nav>
      <GisExplorer />
    </main>
  );
}
