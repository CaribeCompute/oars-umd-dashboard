import { programDetailFields, programLinkFields, safeProgramUrl } from './program-fields';
export { safeProgramUrl } from './program-fields';
import database from '../data/oars-programs.json';
type SourceRecord = { id: string; name: string; type: 'Program' | 'Practice'; land: 'farm' | 'forest' | 'both' | 'unspecified'; scope: string; shortlisted: boolean; sourceSheet: string; sourceRow: number; [key: string]: unknown };
export type Program = {
  id: string; name: string; agency: string; type: 'Program' | 'Practice'; land: SourceRecord['land']; scope: string; county: string; shortlisted: boolean;
  stage: string; description: string; reason: string; costShare: string; timeline: string; deadline: string; tags: string[];
  sourceSheet: string; sourceRow: number; details: { label: string; value: string }[]; links: { label: string; url: string }[];
};
export const catalogSource = { filename: database.sourceFile, importedOn: database.importedOn, counts: database.countsBySheet, excluded: database.excluded };
const text = (r: SourceRecord, key: string) => typeof r[key] === 'string' ? r[key] as string : '';
export const programs: Program[] = (database.records as SourceRecord[]).map(record => ({
  id: record.id, name: record.name, agency: text(record,'agency') || text(record,'programName') || 'Organization not supplied', type: record.type, land: record.land, scope: record.scope, county: text(record,'county'), shortlisted: record.shortlisted,
  stage: text(record,'stage') || 'Not supplied', description: text(record,'description') || text(record,'problem') || 'Description not supplied in the workbook.',
  reason: text(record,'goals') || (record.shortlisted ? 'Included in the OARS workbook shortlist. Confirm suitability with the provider.' : 'Listed in the OARS workbook; eligibility must be checked with the provider.'),
  costShare: text(record,'costShare') || 'Not supplied', timeline: text(record,'timeline') || 'Not supplied', deadline: 'Not separately supplied; check requirements and provider website.',
  tags: [record.scope, text(record,'county'), text(record,'strategies'), text(record,'eligibility'), text(record,'practice'), text(record,'programName')],
  sourceSheet: record.sourceSheet, sourceRow: record.sourceRow,
  details: programDetailFields.flatMap(({sourceKey,label}) => text(record,sourceKey) ? [{ label, value: text(record,sourceKey) }] : []),
  links: programLinkFields.flatMap(({key,label}) => { const url=safeProgramUrl(text(record,key)); return url ? [{ label,url }] : []; }),
}));
