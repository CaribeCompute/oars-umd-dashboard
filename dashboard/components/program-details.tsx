import type { Program } from '@/lib/programs';
export function ProgramDetails({ program }: { program: Program }) {
  return <div className="space-y-5">
    <p className="text-sm text-muted-foreground">OARS-supplied workbook, imported September 13, 2026. Confirm current availability, deadlines, and eligibility with the provider.</p>
    <div className="flex flex-wrap gap-4">{program.links.map(link => <a key={link.label} className="text-sm font-semibold text-[var(--teal-dark)] underline" href={link.url} target="_blank" rel="noreferrer">{link.label} ↗</a>)}</div>
    <dl className="grid gap-5 sm:grid-cols-2">{program.details.map(detail => <div key={detail.label}><dt className="font-semibold">{detail.label}</dt><dd className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-muted-foreground">{detail.value}</dd></div>)}</dl>
    <p className="border-t pt-4 text-xs text-muted-foreground">Source: {program.sourceSheet}, row {program.sourceRow}. Blank fields mean the workbook did not supply the information. Repeated names may represent different counties or source sections.</p>
  </div>;
}
