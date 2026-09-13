import type { Program } from './programs';
export const programFields = ['name','agency','description','county','eligibility','cost_share','timeline','website'] as const;
export type ProgramDraft = Record<typeof programFields[number], string> & { type: 'Program'|'Practice'; land: 'farm'|'forest'|'both'|'unspecified'; scope: string; status: 'draft'|'published' };
export type CommunityProgram = ProgramDraft & { id: string; created_by: string; updated_at: string };
export const emptyProgram: ProgramDraft = { name:'',agency:'',description:'',county:'',eligibility:'',cost_share:'',timeline:'',website:'',type:'Program',land:'both',scope:'MD',status:'draft' };
export function validateProgram(input: unknown): ProgramDraft {
  if (!input || typeof input !== 'object') throw new Error('Enter program details.');
  const value = input as Record<string, unknown>;
  const result = {...emptyProgram};
  for (const field of programFields) {
    if (typeof value[field] !== 'string' || value[field].length > 5000) throw new Error(`${field}: use text of at most 5,000 characters.`);
    result[field] = value[field].trim();
  }
  for (const field of ['name','agency','description'] as const) if (!result[field]) throw new Error('Name, organization, and description are required.');
  if (result.website) { let url: URL; try { url = new URL(result.website); } catch { throw new Error('Enter a complete website URL.'); } if (!['https:','http:'].includes(url.protocol)) throw new Error('Website must use HTTPS or HTTP.'); }
  const options = { type:['Program','Practice'],land:['farm','forest','both','unspecified'],scope:['Federal','MD','DE','NJ','VA','Private'],status:['draft','published'] };
  for (const [key, allowed] of Object.entries(options)) if (!allowed.includes(String(value[key]))) throw new Error(`Choose a valid ${key}.`);
  return {...result,type:value.type,land:value.land,scope:value.scope,status:value.status} as ProgramDraft;
}
export function communityProgram(record: CommunityProgram): Program {
  return { id:record.id,name:record.name,agency:record.agency,description:record.description,type:record.type,land:record.land,scope:record.scope,county:record.county,shortlisted:false,stage:'Not supplied',reason:'Published by an OARS contributor. Confirm suitability with the provider.',costShare:record.cost_share||'Not supplied',timeline:record.timeline||'Not supplied',deadline:'Confirm with provider',tags:[record.scope,record.county,record.eligibility],sourceSheet:'OARS contributor',sourceRow:0,
    details:[{label:'Eligibility',value:record.eligibility},{label:'County / coverage',value:record.county},{label:'Financial assistance',value:record.cost_share},{label:'Timeline / deadline',value:record.timeline}].filter(item=>item.value),links:record.website?[{label:'Provider / application website',url:record.website}]:[] };
}
