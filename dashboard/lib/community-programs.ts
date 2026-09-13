import type { Program } from './programs';
import { programDetailFields, programLinkFields, safeProgramUrl } from './program-fields.ts';
export const programFields = ['name','agency','description', ...programDetailFields.map(field=>field.key), ...programLinkFields.map(field=>field.key)] as const;
export type ProgramDraft = Record<typeof programFields[number], string> & { type: 'Program'|'Practice'; land: 'farm'|'forest'|'both'|'unspecified'; scope: string; status: 'draft'|'published' };
export type CommunityProgram = ProgramDraft & { id: string; created_by: string; updated_at: string };
export const emptyProgram: ProgramDraft = { ...Object.fromEntries(programFields.map(key=>[key,''])),type:'Program',land:'both',scope:'MD',status:'draft' } as ProgramDraft;
export function validateProgram(input: unknown): ProgramDraft {
  if (!input || typeof input !== 'object') throw new Error('Enter program details.');
  const value = input as Record<string, unknown>;
  const result = {...emptyProgram};
  for (const field of programFields) {
    const entry = value[field] ?? '';
    if (typeof entry !== 'string' || entry.length > 5000) throw new Error(`${field}: use text of at most 5,000 characters.`);
    result[field] = entry.trim();
  }
  for (const field of ['name','agency','description'] as const) if (!result[field]) throw new Error('Name, organization, and description are required.');
  for (const {key,label} of programLinkFields) {
    if (result[key] && !safeProgramUrl(result[key])) throw new Error(`${label}: enter a complete HTTPS or HTTP URL.`);
  }
  const options = { type:['Program','Practice'],land:['farm','forest','both','unspecified'],scope:['Federal','MD','DE','NJ','VA','Private'],status:['draft','published'] };
  for (const [key, allowed] of Object.entries(options)) if (!allowed.includes(String(value[key]))) throw new Error(`Choose a valid ${key}.`);
  return {...result,type:value.type,land:value.land,scope:value.scope,status:value.status} as ProgramDraft;
}
export function communityProgram(saved: CommunityProgram): Program {
  // Defaults also allow older entries to be displayed before new fields are populated.
  const record = {...emptyProgram,...saved};
  return { id:record.id,name:record.name,agency:record.agency,description:record.description,type:record.type,land:record.land,scope:record.scope,county:record.county,shortlisted:false,
    stage:record.stage||'Not supplied',reason:record.goals||'Published by an OARS contributor. Confirm suitability with the provider.',costShare:record.cost_share||'Not supplied',timeline:record.timeline||'Not supplied',deadline:record.deadline||'Confirm with provider',
    tags:[record.scope,record.county,record.strategies,record.eligibility,record.practice,record.programName],sourceSheet:'OARS contributor',sourceRow:0,
    details:programDetailFields.flatMap(({key,label})=>record[key]?[{label,value:record[key]}]:[]),
    links:programLinkFields.flatMap(({key,label})=>{ const url=safeProgramUrl(record[key]); return url?[{label,url}]:[]; }) };
}
