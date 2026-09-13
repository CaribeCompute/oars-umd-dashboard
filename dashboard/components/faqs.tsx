import Link from 'next/link';
const questions = [
  ['What does OARS help me do?', 'Organize property information, explore coastal datasets, record field observations, and compare adaptation programs and practices.'],
  ['Who needs account approval?', 'Landowners, Agencies, and Extension Officers can sign in after email verification. Administrator access requires authorization by an existing administrator.'],
  ['How do I save my property map?', 'Sign in, add or select a property, and open its GIS explorer. Boundaries, flooding and salt-patch markers, observation dates, and notes save automatically. Wait for “All map changes saved” before leaving. Public map drawings are temporary.'],
  ['Who can see my saved map?', 'This version restricts saved map records to the property owner. Public visitors cannot read them. Exporting a GeoJSON file includes coordinates and notes, so review it before sharing.'],
  ['What if saving fails?', 'The map shows an error and offers Retry save and GeoJSON export. A browser recovery draft is kept when storage is available. A conflicting newer server version is never silently replaced. Export your work before reloading a conflict.'],
  ['Can I report a salt patch to the Salt Patch Mapper?', 'Use the reporting-form link next to a salt-patch observation. It opens the University of Delaware mapper’s Survey123 form. Review the location and enter the required fields yourself. Saving in OARS does not submit a report or synchronize with that external database.'],
  ['Are soil and flood layers a diagnosis?', 'No. SSURGO shows soil map units, not hydric-soil ratings. NOAA sea-level rise is a scenario, not a current flood measurement. Missing coverage does not mean no risk. Field verification is needed.'],
  ['Who can add programs?', 'Active Agency, Extension Officer, and Administrator accounts can add programs, save private drafts, and publish to the shared catalog. Agencies and Officers manage their own entries; Administrators can manage all contributor entries.'],
  ['Are programs and matches guaranteed?', 'The catalog combines the OARS Mid-Atlantic workbook supplied in September 2026 with published contributor listings. The workbook’s SWI-stage fields are blank, so it does not establish personalized stage matching. Verify current eligibility, deadlines, and funding with the provider. Assessment results support planning rather than guarantee eligibility.'],
  ['Is Google sign-in free?', 'Supabase includes Google social sign-in in its Free plan, subject to its usage quotas. Google Maps or Places billing is not needed for this login flow.'],
];
export function Faqs() {
  return <section id="faqs" className="mx-auto max-w-4xl px-5 py-12">
    <h1 className="text-3xl font-semibold">Frequently asked questions</h1>
    <div className="mt-6 space-y-3">{questions.map(([question, answer]) => <details className="rounded-xl border bg-white p-5" key={question}><summary className="cursor-pointer font-semibold">{question}</summary><p className="mt-3 text-sm leading-6 text-muted-foreground">{answer}</p></details>)}</div>
    <p className="mt-5 text-sm">See the <Link className="underline" href="/swi-guide">SWI photo and draft scorecard guide</Link>. Start with the <Link className="underline" href="/gis">GIS explorer</Link> or browse <Link className="underline" href="/programs">programs</Link>.</p>
  </section>;
}
