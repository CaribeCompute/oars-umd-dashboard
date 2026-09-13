import Link from 'next/link';
import { Faqs } from '@/components/faqs';
export default function FaqPage() {
  return <main className="min-h-screen bg-[var(--mist)]"><nav className="flex flex-wrap gap-5 bg-[var(--navy)] p-5 text-white"><Link href="/">OARS dashboard</Link><Link href="/programs">Programs</Link><Link href="/gis">GIS explorer</Link><Link href="/faqs" aria-current="page">FAQs</Link></nav><Faqs /></main>;
}
