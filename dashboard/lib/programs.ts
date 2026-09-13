import database from '../data/oars-programs.json';
type SourceRecord = { id: string; name: string; type: 'Program' | 'Practice'; land: 'farm' | 'forest' | 'both' | 'unspecified'; scope: string; shortlisted: boolean; sourceSheet: string; sourceRow: number; [key: string]: unknown };
export type Program = {
  id: string; name: string; agency: string; type: 'Program' | 'Practice'; land: SourceRecord['land']; scope: string; county: string; shortlisted: boolean;
  stage: string; description: string; reason: string; costShare: string; timeline: string; deadline: string; tags: string[];
  sourceSheet: string; sourceRow: number; details: { label: string; value: string }[]; links: { label: string; url: string }[];
};
export const catalogSource = { filename: database.sourceFile, importedOn: database.importedOn, counts: database.countsBySheet, excluded: database.excluded };
const text = (r: SourceRecord, key: string) => typeof r[key] === 'string' ? r[key] as string : '';
export function safeProgramUrl(value: string) {
  try { const url = new URL(value.trim()); return ['https:', 'http:'].includes(url.protocol) ? url.href : null; } catch { return null; }
}
const fields = {
  programName: 'Parent program / category', landDescription: 'Land use described in source', scopeDetail: 'Geographic scope', county: 'County / local coverage',
  eligibility: 'Eligibility', requirements: 'Program requirements', practice: 'Practices supported', code: 'Practice code',
  strategies: 'Strategies / plants and species', swiStrategies: 'SWI-specific strategies', goals: 'Landowner goals in source',
  costShare: 'Cost share / financial assistance', benefit: 'Payment / economic benefit', timeline: 'Application to implementation', duration: 'Program duration',
  nextStep: 'Next step', personnel: 'Key personnel', contacts: 'Contact information', experts: 'Strategy specialists',
  limitations: 'Limitations / barriers', quantitative: 'Quantitative evaluation', qualitative: 'Qualitative evaluation', notes: 'Source notes',
};
export const programs: Program[] = (database.records as SourceRecord[]).map(record => ({
  id: record.id, name: record.name, agency: text(record,'agency') || text(record,'programName') || 'Organization not supplied', type: record.type, land: record.land, scope: record.scope, county: text(record,'county'), shortlisted: record.shortlisted,
  stage: text(record,'stage') || 'Not supplied', description: text(record,'description') || text(record,'problem') || 'Description not supplied in the workbook.',
  reason: text(record,'goals') || (record.shortlisted ? 'Included in the OARS workbook shortlist. Confirm suitability with the provider.' : 'Listed in the OARS workbook; eligibility must be checked with the provider.'),
  costShare: text(record,'costShare') || 'Not supplied', timeline: text(record,'timeline') || 'Not supplied', deadline: 'Not separately supplied; check requirements and provider website.',
  tags: [record.scope, text(record,'county'), text(record,'strategies'), text(record,'eligibility'), text(record,'practice'), text(record,'programName')],
  sourceSheet: record.sourceSheet, sourceRow: record.sourceRow,
  details: Object.entries(fields).flatMap(([key,label]) => text(record,key) ? [{ label, value: text(record,key) }] : []),
  links: Object.entries({ website:'Program website', practiceWebsite:'Practice website', overviewUrl:'Practice overview PDF' }).flatMap(([key,label]) => { const url=safeProgramUrl(text(record,key)); return url ? [{ label,url }] : []; }),
}));
