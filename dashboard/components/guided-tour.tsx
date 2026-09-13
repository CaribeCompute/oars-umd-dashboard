'use client';
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
type Step={title:string;body:string;selector?:string};
const intro:Step={title:'Welcome to OARS',body:'OARS helps you organize a property, record visible conditions, and explore adaptation programs. You can close this tour at any time and restart it with Take a tour.'};
const gis:Step[]=[
 {title:'Choose your property',body:'Select a saved property to load its own map. Public drawings are temporary; sign in and choose a property for persistence.',selector:'[data-tour="properties"]'},
 {title:'Explore map layers',body:'Choose a basemap and turn layers on or off. Read each layer’s description: scenario layers are context, not a diagnosis.',selector:'#gis-layer-controls'},
 {title:'Draw and mark observations',body:'Draw a boundary by adding at least three points. For a field observation, choose Flooding or Salt Patch, select Add observation, and click the map.',selector:'[aria-label="Interactive OARS property map"]'},
 {title:'Report a salt patch',body:'Under the map, each salt-patch marker has notes, a date, and Report this salt patch to Salt Patch Mapper. Review the information to share. The external survey requires your own photo, CAPTCHA, and submission.'},
 {title:'Save original photos',body:'Use Your observation photos below the map: choose a saved marker, upload a JPG or PNG, and download it when you need to attach it in Survey123. Check All map changes saved before leaving.',selector:'[data-tour="observation-photos"]'},
];
const assessment:Step[]=[
 {title:'Describe the property',body:'Confirm the property location, land use, and your relationship to the land. Use the saved property GIS link to manage its boundary and field notes.'},
 {title:'Describe visible conditions',body:'Choose the plant, soil, and water descriptions that match your observations. Open the photo guide for examples. The current score is a demonstration, not a scientific determination.'},
 {title:'Choose your goals',body:'Select priorities in the order that matters to you. They are saved for planning; they do not yet rank program results.'},
 {title:'Save and export',body:'Use Save assessment to store answers. At Results, choose Print / download results for a PDF with the saved map and optional observation photos. Wait for GIS saves before exporting. Program examples are starting points, not eligibility decisions.'},
];
const dashboard:Step[]=[
 {title:'Start with your property',body:'Sign in or create an account. In the landowner dashboard, add or edit a property with its address and land use. Keep separate properties as separate records.'},
 {title:'Build a field record',body:'Open GIS explorer, select a property, and add a boundary, flooding or salt-patch markers, notes, and photos. Use Take a tour there for the map walkthrough.',selector:'a[href="/gis"]'},
 {title:'Complete an assessment',body:'Choose Open assessment for a property. Work through Property, SWI score, Goals, and Results, then save the assessment.'},
 {title:'Explore programs',body:'Search the OARS catalog and filter by location, land use, resource type, or shortlist. Open a detail page for the source information and provider links.',selector:'a[href="/programs"]'},
 {title:'Get help anytime',body:'Read FAQs for account, saving, and reporting guidance. Take a tour is always available. The tour does not change or submit any records.',selector:'a[href="/faqs"]'},
];
export function GuidedTour(){
 const [open,setOpen]=useState(false),[index,setIndex]=useState(0),[steps,setSteps]=useState<Step[]>([intro]);
 const current=steps[index];
 useEffect(()=>{if(!open || !current.selector)return;const target=document.querySelector<HTMLElement>(current.selector);if(!target)return;const outline=target.style.outline,offset=target.style.outlineOffset;target.scrollIntoView({behavior:'smooth',block:'center'});target.style.outline='4px solid #dba530';target.style.outlineOffset='5px';return()=>{target.style.outline=outline;target.style.outlineOffset=offset;};},[open,current]);
 function start(){const content=document.querySelector('[data-tour="assessment"]')?assessment:document.querySelector('[aria-label="Interactive OARS property map"]')?gis:dashboard;setSteps([intro,...content]);setIndex(0);setOpen(true);}
 return <><Button className="fixed bottom-4 left-4 z-40 shadow-lg print:hidden" onClick={start}>Take a tour</Button><Dialog open={open} onOpenChange={setOpen}><DialogContent className="top-auto bottom-5 max-h-[70dvh] translate-y-0 overflow-y-auto print:hidden sm:max-w-lg"><p className="text-xs font-semibold text-muted-foreground">OARS walkthrough · {index+1} of {steps.length}</p><DialogTitle>{current.title}</DialogTitle><DialogDescription className="text-base leading-7">{current.body}</DialogDescription><div className="flex flex-wrap justify-between gap-3"><Button variant="outline" onClick={()=>setOpen(false)}>End tour</Button><div className="flex gap-2"><Button variant="outline" disabled={index===0} onClick={()=>setIndex(i=>i-1)}>Back</Button><Button onClick={()=>index===steps.length-1?setOpen(false):setIndex(i=>i+1)}>{index===steps.length-1?'Finish':'Next'}</Button></div></div></DialogContent></Dialog></>;
}
