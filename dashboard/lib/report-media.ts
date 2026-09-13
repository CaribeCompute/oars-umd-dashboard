import { createBrowserSupabaseClient } from './supabase/browser';
import { validMapData, type PropertyMapData } from './property-map';
export type ReportPhoto = { bytes: Uint8Array; caption: string };
export type ReportMedia = { map: PropertyMapData; center?: [number,number]; photos: ReportPhoto[] };
export async function loadReportMedia(propertyId: string, center: [number,number] | undefined, includePhotos: boolean, progress: (message:string)=>void): Promise<ReportMedia> {
  progress('Loading saved property map…');
  const response=await fetch(`/api/property-map?propertyId=${encodeURIComponent(propertyId)}`,{cache:'no-store'});
  const result=await response.json();
  if(!response.ok || !validMapData(result.data)) throw Error('Could not load the saved map. Check GIS saving before exporting.');
  const media:ReportMedia={map:result.data,center,photos:[]};
  if(!includePhotos)return media;
  const db=createBrowserSupabaseClient();if(!db)throw Error('Sign in to include private observation photos.');
  const {data:{user}}=await db.auth.getUser();if(!user)throw Error('Sign in to include private observation photos.');
  const bucket=db.storage.from('observation-photos');
  for(const [index,observation] of media.map.observations.entries()) {
    const prefix=`${user.id}/${propertyId}/${observation.id}`;
    for(let offset=0;;offset+=100) {
      const {data:files,error}=await bucket.list(prefix,{limit:100,offset,sortBy:{column:'name',order:'asc'}});
      if(error)throw Error('Could not list observation photos. Retry, or explicitly turn off photos.');
      for(const file of files ?? []) {
        progress(`Loading observation photo ${media.photos.length+1}…`);
        const {data,error}=await bucket.download(`${prefix}/${file.name}`);
        if(error || !data)throw Error('A saved photo could not be downloaded. Retry, or explicitly turn off photos.');
        media.photos.push({bytes:new Uint8Array(await data.arrayBuffer()),caption:`Marker ${index+1}: ${observation.category.replace('_',' ')} | ${observation.observedAt} | ${observation.coordinates.join(', ')}\n${observation.notes}`});
      }
      if(!files || files.length<100)break;
    }
  }
  return media;
}
