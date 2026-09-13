import test from 'node:test';
import assert from 'node:assert/strict';
import { createResultsPdf } from '../lib/results-pdf.ts';
test('results PDF paginates long input and preserves the final program', () => {
 const pdf=createResultsPdf({address:'Test property',landType:'farm',relationship:'landowner',stage:'Early signs',score:2,goals:['Habitat'],answers:[{label:'Soil',value:'No visible salt'}],programs:[{name:'Test program',agency:'Test agency',description:'Long field description. '.repeat(1500),costShare:'Not supplied',timeline:'Not supplied',sourceSheet:'Test',sourceRow:1,links:[]},{name:'FINAL PROGRAM',agency:'Test',description:'End of report',costShare:'Not supplied',timeline:'Not supplied',sourceSheet:'Test',sourceRow:2,links:[]}]});
 assert.ok(pdf.getNumberOfPages()>2);
 const output=pdf.output();assert.ok(output.startsWith('%PDF-'));assert.ok(output.includes('FINAL PROGRAM'));assert.ok(output.includes('Page 1 of'));
});
