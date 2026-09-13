import Link from 'next/link';
import { SwiPhotoGuide } from '@/components/swi-photo-guide';
import scorecards from '@/data/swi-scorecards.json';
export default function SwiGuide() {
  return <main className="min-h-screen bg-[var(--mist)]"><nav className="flex flex-wrap gap-5 bg-[var(--navy)] p-5 text-white"><Link href="/">OARS dashboard</Link><Link href="/programs">Programs</Link><Link href="/gis">GIS explorer</Link><Link href="/faqs">FAQs</Link></nav><article className="mx-auto max-w-6xl px-5 py-10">
    <h1 className="font-heading text-4xl font-semibold">Saltwater intrusion field guide</h1>
    <p className="mt-4 max-w-3xl leading-7">OARS supplied these photos and draft scorecards in September 2026. The drafts describe five stages, from no impact (0) to marsh (4), using the average of three indicators. They do not specify how to classify fractional averages. The dashboard’s demonstration score has not yet been replaced by this methodology.</p>
    <SwiPhotoGuide expanded />
    {scorecards.map(card => <section key={card.land} className="my-10"><h2 className="text-2xl font-semibold capitalize">Draft {card.land} scorecard</h2><p className="my-3 text-sm">Source: {card.source}. Draft wording is reproduced below for review; it remains subject to change.</p><div className="overflow-x-auto rounded-xl border bg-white"><table className="w-full min-w-[850px] text-left text-sm"><caption className="sr-only">Draft {card.land} saltwater intrusion stages</caption><thead><tr>{card.rows[1].map((cell,i) => <th key={i} className="border-b bg-[var(--navy)] p-4 whitespace-pre-line text-white">{cell || (i === 0 ? 'Stage' : 'Indicator')}</th>)}</tr></thead><tbody>{card.rows.slice(2).map((row,i) => <tr key={i}>{row.map((cell,j) => j === 0 ? <th scope="row" key={j} className="border-b p-4 align-top whitespace-pre-line">{cell}</th> : <td key={j} className="border-b p-4 align-top whitespace-pre-line leading-6">{cell}</td>)}</tr>)}</tbody></table></div></section>)}
  </article></main>;
}
