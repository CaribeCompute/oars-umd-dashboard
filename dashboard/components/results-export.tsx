'use client';
import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import type { ResultsReport } from '@/lib/results-pdf';
export function ResultsExport({ report }: { report: ResultsReport }) {
  const [busy,setBusy]=useState(false);const [status,setStatus]=useState('');
  async function download(){setBusy(true);setStatus('Preparing PDF…');try{const {createResultsPdf}=await import('@/lib/results-pdf');const pdf=createResultsPdf(report);pdf.save('oars-assessment-results.pdf');setStatus('PDF download started. Open the downloaded file to print it.');}catch{setStatus('PDF export failed. Please retry or use browser printing.');}finally{setBusy(false);}}
  return <Dialog><DialogTrigger render={<Button variant="outline" size="lg" className="print:hidden" />}><Download /> Print / download results</DialogTrigger><DialogContent className="print:hidden sm:max-w-lg"><DialogTitle>Print or download your results</DialogTitle><DialogDescription>Download a PDF, then open it to print. Browser printing is also available; some embedded browsers do not show a print dialog.</DialogDescription><Button disabled={busy} onClick={() => void download()}>{busy?'Preparing PDF…':'Download results PDF'}</Button><Button variant="outline" onClick={() => {setStatus('If no print dialog appears, download the PDF and print it from your PDF viewer.');window.print();}}>Use browser print dialog</Button><p className="text-xs text-muted-foreground">Includes the assessment summary and displayed program examples. Property maps and photos are not included. The PDF is generated on your device.</p><output aria-live="polite" className="text-sm">{status}</output></DialogContent></Dialog>;
}
