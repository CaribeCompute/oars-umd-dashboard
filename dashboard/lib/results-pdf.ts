import { jsPDF } from 'jspdf';
import type { ReportMedia } from './report-media';
export type ResultsReport = { address: string; landType: string; relationship: string; stage: string; score: number; goals: string[]; answers: { label: string; value: string }[]; programs: { name: string; agency: string; description: string; costShare: string; timeline: string; sourceSheet: string; sourceRow: number; links: {label: string; url: string}[] }[] };
export function createResultsPdf(report: ResultsReport, media?: ReportMedia) {
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
  if(media) {
    pdf.addPage();y=54;heading('Saved property map and observations');
    text('Coordinate reference map: saved boundary and numbered observation pins. North is up. No satellite imagery or risk layers are included; this is not a surveyed parcel map.',9);
    const points=[...media.map.boundary,...media.map.observations.map(o=>o.coordinates),...(media.center?[media.center]:[])];
    if(points.length) {
      const lat0=points.reduce((a,p)=>a+p[0],0)/points.length;
      const lon0=points[0][1]; const factor=Math.max(0.01,Math.cos(lat0*Math.PI/180));
      const project=([lat,lon]:[number,number])=>[(((lon-lon0+540)%360)-180)*factor,lat];
      const projected=points.map(project);const xs=projected.map(p=>p[0]),ys=projected.map(p=>p[1]);
      const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
      const scale=Math.min(456/Math.max(maxX-minX,0.002),290/Math.max(maxY-minY,0.002));
      const top=y; const xy=(p:[number,number])=>{const q=project(p);return [306+(q[0]-(minX+maxX)/2)*scale,top+170-(q[1]-(minY+maxY)/2)*scale];};
      pdf.setFillColor(242,247,246);pdf.rect(48,top,516,340,'F');pdf.setDrawColor(55,90,85);pdf.setLineWidth(1.5);
      const b=media.map.boundary.map(xy);for(let i=1;i<b.length;i++)pdf.line(b[i-1][0],b[i-1][1],b[i][0],b[i][1]);if(b.length>=3)pdf.line(b[b.length-1][0],b[b.length-1][1],b[0][0],b[0][1]);
      if(media.center){const c=xy(media.center);pdf.setDrawColor(60);pdf.line(c[0]-4,c[1],c[0]+4,c[1]);pdf.line(c[0],c[1]-4,c[0],c[1]+4);}
      media.map.observations.forEach((o,i)=>{const c=xy(o.coordinates);pdf.setFillColor(o.category==='salt_patch'?175:30,90,o.category==='salt_patch'?40:160);pdf.circle(c[0],c[1],8,'F');pdf.setFontSize(8);pdf.setTextColor(255);pdf.text(String(i+1),c[0],c[1]+3,{align:'center'});});
      pdf.setTextColor(30,41,59);pdf.setFontSize(10);pdf.text('N',540,top+20);y=top+356;
      text('Line: boundary | Brown: salt patch | Blue: flooding | Cross: property location',9);
      if(media.map.boundary.length<3)text('No complete boundary saved.',9);
    }else text('No boundary, observation pins, or property coordinates are saved.');
    if(media.map.notes)text(`Map notes: ${media.map.notes}`);
    for(const [i,o] of media.map.observations.entries())text(`${i+1}. ${o.category.replace('_',' ')} | ${o.observedAt} | ${o.coordinates.join(', ')}\n${o.notes}`);
    for(const [i,photo] of media.photos.entries()) {
      pdf.addPage();y=54;heading(`Observation photo ${i+1}`);
      const props=pdf.getImageProperties(photo.bytes);const fit=Math.min(516/props.width,450/props.height);const w=props.width*fit,h=props.height*fit;
      pdf.addImage(photo.bytes,props.fileType,48+(516-w)/2,y,w,h,undefined,'FAST');y+=h+18;text(photo.caption);text('User-supplied field evidence. Location and condition are not independently verified.',9);
    }
    if(!media.photos.length)text('No observation photos included in this export.',9);
  }
  text('Saving this PDF does not save assessment inputs to your account; use Save assessment separately. No validated land trajectory is calculated.',9);
  const pages=pdf.getNumberOfPages();for(let i=1;i<=pages;i++){pdf.setPage(i);pdf.setFont('helvetica','normal');pdf.setFontSize(9);pdf.setTextColor(80);pdf.text(`OARS - preliminary results | Page ${i} of ${pages}`,margin,766);}
  return pdf;
}
