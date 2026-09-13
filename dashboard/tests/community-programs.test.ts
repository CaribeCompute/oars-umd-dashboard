import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyProgram, validateProgram, communityProgram } from '../lib/community-programs.ts';
test('program validation rejects unsafe links, invalid visibility, and incomplete entries',()=>{
 const valid={...emptyProgram,name:'Coastal grant',agency:'Extension',description:'Planning support'};
 assert.equal(validateProgram(valid).status,'draft');
 for(const patch of [{website:'javascript:alert(1)'},{status:'approved'},{name:' '},{description:'x'.repeat(5001)},{land:'invalid'}]) assert.throws(()=>validateProgram({...valid,...patch}));
 assert.equal(validateProgram({...valid,website:'https://example.org/apply',status:'published'}).status,'published');
 assert.equal('created_by' in validateProgram({...valid,created_by:'spoofed'}),false);
});
test('contributor entries retain provider details without claiming workbook shortlisting',()=>{
 const entry=communityProgram({...emptyProgram,id:'example',created_by:'owner',updated_at:'now',name:'Grant',agency:'Provider',description:'Help',eligibility:'MD farms',website:'https://example.org',status:'published'});
 assert.equal(entry.shortlisted,false);assert.equal(entry.sourceRow,0);assert.equal(entry.links[0].url,'https://example.org/');assert.equal(entry.details[0].value,'MD farms');
});

test('every catalog detail and resource survives contributor validation and display',async()=>{
 const {programDetailFields,programLinkFields} = await import('../lib/program-fields.ts');
 const draft = {...emptyProgram,name:'Complete program',agency:'Provider',description:'Description'};
 for (const {key} of programDetailFields) draft[key] = `Value for ${key}`;
 for (const {key} of programLinkFields) draft[key] = `https://example.org/${key}?a=1&b=2`;
 const validated = validateProgram(draft);
 const entry = communityProgram({...validated,id:'example',created_by:'owner',updated_at:'now'});
 for (const {key,label} of programDetailFields) assert.deepEqual(entry.details.find(detail=>detail.label===label),{label,value:draft[key]});
 for (const {key,label} of programLinkFields) assert.deepEqual(entry.links.find(link=>link.label===label),{label,url:draft[key]});
 assert.equal(entry.stage,draft.stage);assert.equal(entry.deadline,draft.deadline);assert.equal(entry.costShare,draft.cost_share);assert.equal(entry.reason,draft.goals);
 assert.ok(entry.tags.includes(draft.strategies));assert.ok(entry.tags.includes(draft.practice));
 for(const {key} of programLinkFields) assert.throws(()=>validateProgram({...draft,[key]:'javascript:alert(1)'}));
});

test('older contributor records retain existing fields while new optional fields default blank',()=>{
 const legacy={name:'Legacy program',agency:'Provider',description:'Description',county:'Somerset',eligibility:'Farms',cost_share:'50%',timeline:'Spring',website:'',type:'Program',land:'farm',scope:'MD',status:'draft'};
 const validated=validateProgram(legacy);
 assert.equal(validated.cost_share,'50%');assert.equal(validated.requirements,'');assert.equal(validated.practiceWebsite,'');
 const entry=communityProgram({...validated,id:'example',created_by:'owner',updated_at:'now'});
 assert.equal(entry.details.some(detail=>detail.label==='Program requirements'),false);
});
