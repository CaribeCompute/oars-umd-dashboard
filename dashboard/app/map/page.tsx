import { redirect } from 'next/navigation';
// Legacy spatial-context URLs use the same verified layer registry as /gis.
export default function MapPage() {
  redirect('/gis');
}
