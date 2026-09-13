'use client';
import { useState } from 'react';
import { PropertyAddressFields } from '@/components/property-address-fields';
import { Button } from '@/components/ui/button';
export type FoundAddress = { address: string; latitude: number; longitude: number };
export function AssessmentAddressFinder({ address, onFound, onEdit }: { address: string; onFound: (result: FoundAddress)=>void; onEdit: ()=>void }) {
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState('');
  const [error,setError] = useState('');
  return <div className="space-y-3"><PropertyAddressFields existingAddress={address} onEdit={()=>{setMessage('');setError('');onEdit();}}/>
    <Button type="button" disabled={busy} onClick={async event=>{
      const form=event.currentTarget.form;
      if (!form || !form.reportValidity()) return;
      setBusy(true);setMessage('');setError('');
      try {
        const data=new FormData(form);
        const payload=data.has('street')?Object.fromEntries(['street','unit','city','state','zip'].map(key=>[key,data.get(key)])):{address:data.get('address')};
        const response=await fetch('/api/validate-address',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
        const result=await response.json();
        if(!response.ok || !result.address || !Number.isFinite(result.latitude) || !Number.isFinite(result.longitude)) throw new Error(result.error||'The address could not be located.');
        onFound(result);setMessage(`Location found: ${result.address}`);
      } catch(error) {setError(error instanceof Error?error.message:'Address lookup failed. Please retry.');}
      finally {setBusy(false);}
    }}>{busy?'Finding address…':'Find'}</Button>
    {message&&<output className="block text-sm text-[var(--teal-dark)]">{message}</output>}{error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
  </div>;
}
