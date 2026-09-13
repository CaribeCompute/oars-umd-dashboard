import test from 'node:test';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { createResultsPdf } from '../lib/results-pdf.ts';
void test('results PDF paginates long input and preserves the final program', () => {
 const pdf=createResultsPdf({address:'Test property',landType:'farm',relationship:'landowner',stage:'Early signs',score:2,goals:['Habitat'],answers:[{label:'Soil',value:'No visible salt'}],programs:[{name:'Test program',agency:'Test agency',description:'Long field description. '.repeat(1500),costShare:'Not supplied',timeline:'Not supplied',sourceSheet:'Test',sourceRow:1,links:[]},{name:'FINAL PROGRAM',agency:'Test',description:'End of report',costShare:'Not supplied',timeline:'Not supplied',sourceSheet:'Test',sourceRow:2,links:[]}]});
 assert.ok(pdf.getNumberOfPages()>2);
 const output=pdf.output();assert.ok(output.startsWith('%PDF-'));assert.ok(output.includes('FINAL PROGRAM'));assert.ok(output.includes('Page 1 of'));
});
void test('results PDF includes saved map, observation notes, and image data', () => {
 const photo=new Uint8Array(readFileSync(new URL('../public/swi-photos/farm-cracking.jpg',import.meta.url)));
 const pdf=createResultsPdf({address:'Test property',landType:'farm',relationship:'landowner',stage:'Early',score:1,goals:[],answers:[],programs:[]},{center:[38,-75],map:{boundary:[[38,-75],[38.01,-75],[38.01,-75.01]],notes:'Saved boundary note',observations:[{id:'test',category:'salt_patch',coordinates:[38.005,-75.005],observedAt:'2026-09-13',notes:'Saved marker note'}]},photos:[{bytes:photo,caption:'Saved evidence photo'}]});
 const output=pdf.output();assert.ok(output.includes('Saved property map'));assert.ok(output.includes('Saved marker note'));assert.ok(output.includes('Saved evidence photo'));assert.ok(output.includes('/Subtype /Image'));assert.equal(pdf.getNumberOfPages(),3);
});
