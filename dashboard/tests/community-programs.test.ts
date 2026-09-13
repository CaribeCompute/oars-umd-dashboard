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
 assert.equal(entry.shortlisted,false);assert.equal(entry.sourceRow,0);assert.equal(entry.links[0].url,'https://example.org');assert.equal(entry.details[0].value,'MD farms');
});
