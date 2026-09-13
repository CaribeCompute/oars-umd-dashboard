import { jsPDF } from 'jspdf';
export type ResultsReport = { address: string; landType: string; relationship: string; stage: string; score: number; goals: string[]; answers: { label: string; value: string }[]; programs: { name: string; agency: string; description: string; costShare: string; timeline: string; sourceSheet: string; sourceRow: number; links: {label: string; url: string}[] }[] };
export function createResultsPdf(report: ResultsReport) {
  const pdf = new jsPDF({ unit:'pt', format:'letter' });
  const margin=48, width=516, bottom=738; let y=54;
  const clean=(s:string)=>s.replace(/[\u2010-\u2015]/g,'-').replace(/[\u2018\u2019]/g,"'").replace(/[\u201c\u201d]/g,'"');
  function text(value:string, size=10, bold=false) {
    pdf.setFont('helvetica',bold?'bold':'normal'); pdf.setFontSize(size);
    const lines=pdf.splitTextToSize(clean(value),width) as string[];
    for (const line of lines) { if(y+size*1.4>bottom){pdf.addPage();y=54;} pdf.text(line,margin,y);y+=size*1.4; }
    y+=6;
  }
  function heading(value:string){if(y+65>bottom){pdf.addPage();y=54;} y+=8;pdf.setTextColor(22,87,83);text(value,14,true);pdf.setTextColor(30,41,59);}
  pdf.setProperties({title:'OARS assessment results',subject:'Preliminary assessment snapshot',creator:'OARS dashboard'});
  text('OARS | Assessment results',22,true);
  text(`Created ${new Date().toLocaleDateString('en-US')} | Snapshot of the current assessment`,9);
  text('Planning reference only. The SWI score is a demonstration, not a scientific determination. Program examples use land type and the OARS shortlist; goals and stage do not rank them. Confirm eligibility and funding with each provider.');
  heading('Property and preliminary assessment');
  text(`Location: ${report.address}`);text(`Land use: ${report.landType} | Relationship: ${report.relationship}`);
  text(`Preliminary stage: ${report.stage} | Demonstration score: ${report.score}`,11,true);
  for(const answer of report.answers)text(`${answer.label}: ${answer.value}`);
  heading('Priority goals');report.goals.forEach((goal,i)=>text(`${i+1}. ${goal}`));
  heading('OARS shortlist examples');
  report.programs.forEach((p,i)=>{if(y+75>bottom){pdf.addPage();y=54;}text(`${i+1}. ${p.name}`,12,true);text(p.agency);text(p.description);text(`Cost share: ${p.costShare}`);text(`Timeline: ${p.timeline}`);for(const link of p.links)text(`${link.label}: ${link.url}`,9);text(`Workbook source: ${p.sourceSheet}, row ${p.sourceRow}`,9);y+=8;});
  text('This summary does not include a property map, observation photos, or a validated land trajectory. Saving this PDF does not save assessment inputs to your account; use Save assessment separately.',9);
  const pages=pdf.getNumberOfPages();for(let i=1;i<=pages;i++){pdf.setPage(i);pdf.setFont('helvetica','normal');pdf.setFontSize(9);pdf.setTextColor(80);pdf.text(`OARS - preliminary results | Page ${i} of ${pages}`,margin,766);}
  return pdf;
}
