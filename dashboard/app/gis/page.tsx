import Link from 'next/link';
import { PersonalGis } from '@/components/personal-gis';
export default function GisPage() {
  return (
    <main>
      <nav aria-label="Public navigation" className="flex flex-wrap gap-6 bg-[var(--navy)] px-6 py-4 text-white">
        <Link href="/">← Back to OARS dashboard</Link>
        <Link href="/programs">Programs</Link>
        <Link href="/gis" aria-current="page">GIS explorer</Link>
      <Link href="/faqs">FAQs</Link>
    </nav>
      <PersonalGis />
    </main>
  );
}
