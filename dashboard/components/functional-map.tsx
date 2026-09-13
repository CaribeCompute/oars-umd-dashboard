'use client';
import { SaltPatchHandoff } from '@/components/salt-patch-handoff';

import { useEffect, useRef, useState } from 'react';
import type {
  LatLngExpression,
  Map as LeafletMap,
  Marker,
  Polygon,
  Polyline,
} from 'leaflet';
import { Crosshair, MapPin, Pentagon, RotateCcw, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { emptyMapData, type PropertyMapData } from '@/lib/property-map';
import { boundaryAcres } from '@/lib/gis-layers';

type DrawMode = 'none' | 'boundary' | 'hotspot';
type ObservationCategory = 'flooding' | 'salt_patch';

const observationCategories: Record<
  ObservationCategory,
  { label: string; color: string }
> = {
  flooding: { label: 'Flooding', color: '#2f83a5' },
  salt_patch: { label: 'Salt Patch', color: '#d45e49' },
};

type FunctionalMapProps = {
  readOnly?: boolean;
  initialAddress?: string;
  initialCoordinates?: { latitude: number; longitude: number };
  onAddressChange?: (address: string) => void;
  compact?: boolean;
  activeLayers?: string[];
  onMapReady?: (map: LeafletMap) => void;
  externalBasemap?: boolean;
  initialMapData?: PropertyMapData;
  onDataChange?: (data: PropertyMapData) => void;
};

const defaultCenter: LatLngExpression = [38.08, -75.63];
const noLayers: string[] = [];

export function FunctionalMap({
  initialAddress = 'Somerset County, Maryland',
  initialCoordinates,
  onAddressChange,
  compact = false,
  readOnly = false,
  activeLayers = noLayers,
  onMapReady,
  externalBasemap = false,
  initialMapData = emptyMapData,
  onDataChange,
}: FunctionalMapProps) {
  const [mapData, setMapData] = useState(initialMapData);
  const dataRef = useRef(mapData);
  const readOnlyRef = useRef(readOnly);
  useEffect(() => { readOnlyRef.current = readOnly; }, [readOnly]);
  const changeRef = useRef(onDataChange);
  useEffect(() => { changeRef.current = onDataChange; }, [onDataChange]);
  const [readyMap, setReadyMap] = useState<LeafletMap | null>(null);
  const changeData = (next: PropertyMapData) => {
    if (readOnlyRef.current) return;
    dataRef.current = next;
    setMapData(next);
    changeRef.current?.(next);
  };
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const searchMarkerRef = useRef<Marker | null>(null);
  const boundaryRef = useRef<Polygon | Polyline | null>(null);
  const boundaryPointsRef = useRef<LatLngExpression[]>([]);
  const hotspotRefs = useRef<Marker[]>([]);
  const modeRef = useRef<DrawMode>('none');
  const categoryRef = useRef<ObservationCategory>('salt_patch');
  const [query, setQuery] = useState(initialAddress);
  const [mode, setMode] = useState<DrawMode>('none');
  const [category, setCategory] = useState<ObservationCategory>('salt_patch');
  const [status, setStatus] = useState(
    readOnly ? 'Read-only property map. Pan and zoom to review saved observations.' : 'Click Draw boundary, then add at least three points on the map.',
  );
  const [searching, setSearching] = useState(false);

  const setDrawMode = (next: DrawMode) => {
    modeRef.current = next;
    setMode(next);
    setStatus(
      next === 'boundary'
        ? 'Click the map to add boundary points.'
        : next === 'hotspot'
          ? 'Click the map to mark a saltwater intrusion observation.'
          : 'Map navigation enabled.',
    );
  };

  useEffect(() => {
    let cancelled = false;
    async function initialize() {
      if (!containerRef.current || mapRef.current) return;
      const L = await import('leaflet');
      if (cancelled || !containerRef.current) return;
      const initialCenter: LatLngExpression = initialCoordinates
        ? [initialCoordinates.latitude, initialCoordinates.longitude]
        : defaultCenter;
      const map = L.map(containerRef.current, {
        zoomControl: true,
        attributionControl: true,
      }).setView(initialCenter, initialCoordinates ? 15 : 10);
      if (!externalBasemap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);
      if (activeLayers.includes('Property boundary')) {
        L.polygon(
          [
            [38.105, -75.69],
            [38.12, -75.61],
            [38.065, -75.57],
            [38.035, -75.65],
          ],
          {
            color: '#ecb138',
            fillColor: '#ecb138',
            fillOpacity: 0.14,
            weight: 3,
          },
        )
          .addTo(map)
          .bindPopup('Demonstration property boundary');
      }
      if (activeLayers.includes('Elevation')) {
        L.circle([38.08, -75.63], {
          radius: 6500,
          color: '#0c7771',
          fillColor: '#5bd6c9',
          fillOpacity: 0.08,
          dashArray: '8 6',
        })
          .addTo(map)
          .bindPopup('Demonstration low-elevation area');
      }
      if (activeLayers.includes('Land cover')) {
        L.rectangle(
          [
            [38.02, -75.74],
            [38.13, -75.66],
          ],
          {
            color: '#4f9f76',
            fillColor: '#4f9f76',
            fillOpacity: 0.12,
            weight: 1,
          },
        )
          .addTo(map)
          .bindPopup('Demonstration agricultural land cover');
      }
      if (activeLayers.includes('Tidal reference')) {
        L.polyline(
          [
            [38.0, -75.55],
            [38.06, -75.58],
            [38.14, -75.53],
          ],
          { color: '#2f83a5', weight: 5, opacity: 0.7 },
        )
          .addTo(map)
          .bindPopup('Demonstration tidal reference');
      }
      if (activeLayers.includes('SWI observations')) {
        (
          [
            [[38.09, -75.62], 'salt_patch'],
            [[38.055, -75.67], 'flooding'],
            [[38.115, -75.59], 'salt_patch'],
          ] as Array<[number[], ObservationCategory]>
        ).forEach(([point, observationCategory]) =>
          L.circleMarker(point as LatLngExpression, {
            radius: 8,
            color: '#ffffff',
            weight: 3,
            fillColor: observationCategories[observationCategory].color,
            fillOpacity: 1,
          })
            .addTo(map)
            .bindPopup(
              `Demonstration observation · ${observationCategories[observationCategory].label}`,
            ),
        );
      }
      const markerIcon = (color: string) =>
        L.divIcon({
          className: '',
          html: `<span style="display:block;width:18px;height:18px;border-radius:999px;background:${color};border:3px solid white;box-shadow:0 2px 8px rgb(12 48 53 / 35%)"></span>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });
      if (initialCoordinates) {
        searchMarkerRef.current = L.marker(initialCenter, {
          icon: markerIcon('#0c7771'),
        })
          .addTo(map)
          .bindPopup(
            Object.assign(document.createElement('span'), {
              textContent: initialAddress,
            }),
          )
          .openPopup();
        setStatus('Property located from its saved coordinates.');
      }
      map.on('click', (event) => {
        const data = dataRef.current;
        if (modeRef.current === 'boundary') {
          const boundary: [number, number][] = [...data.boundary, [event.latlng.lat, event.latlng.lng]];
          changeData({ ...data, boundary });
          setStatus(`${boundary.length} boundary points. ${boundary.length >= 3 ? `Approximate area: ${boundaryAcres(boundary).toFixed(2)} acres.` : 'Add at least three points.'}`);
        }
        if (modeRef.current === 'hotspot') {
          changeData({ ...data, observations: [...data.observations, { id: crypto.randomUUID(), category: categoryRef.current, coordinates: [event.latlng.lat, event.latlng.lng], notes: '', observedAt: new Date().toISOString().slice(0, 10) }] });
          setStatus('Observation added. Add notes and date below the map.');
        }
      });
      setReadyMap(map);
      mapRef.current = map;
      onMapReady?.(map);
      window.setTimeout(() => map.invalidateSize(), 50);
    }
    void initialize();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [
    activeLayers,
    initialAddress,
    initialCoordinates,
    onMapReady,
    externalBasemap,
  ]);

  const searchLocation = async () => {
    if (!query.trim() || !mapRef.current) return;
    setSearching(true);
    setStatus('Searching for the location...');
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=us&q=${encodeURIComponent(query.trim())}`,
        { headers: { Accept: 'application/json' } },
      );
      if (!response.ok) throw new Error('Search service unavailable');
      const [result] = (await response.json()) as Array<{
        lat: string;
        lon: string;
        display_name: string;
      }>;
      if (!result) {
        setStatus(
          'No matching location found. Try a county, city, or full address.',
        );
        return;
      }
      const L = await import('leaflet');
      const point: LatLngExpression = [Number(result.lat), Number(result.lon)];
      mapRef.current.setView(point, 14);
      searchMarkerRef.current?.remove();
      const searchIcon = L.divIcon({
        className: '',
        html: '<span style="display:block;width:20px;height:20px;border-radius:999px;background:#0c7771;border:4px solid white;box-shadow:0 2px 10px rgb(12 48 53 / 40%)"></span>',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
      searchMarkerRef.current = L.marker(point, { icon: searchIcon })
        .addTo(mapRef.current)
        .bindPopup(
          Object.assign(document.createElement('span'), {
            textContent: result.display_name,
          }),
        )
        .openPopup();
      setQuery(result.display_name);
      onAddressChange?.(result.display_name);
      setStatus('Location found. Refine the property by drawing its boundary.');
    } catch {
      setStatus(
        'The address search could not connect. You can still pan, zoom, and draw on the map.',
      );
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    if (!readyMap) return;
    let cancelled = false;
    void import('leaflet').then(L => {
      if (cancelled || !readyMap.getPane('overlayPane')) return;
      boundaryRef.current?.remove();
      boundaryPointsRef.current = mapData.boundary;
      boundaryRef.current = mapData.boundary.length >= 3
        ? L.polygon(mapData.boundary, { color: '#ecb138', fillOpacity: 0.18 }).addTo(readyMap)
        : L.polyline(mapData.boundary, { color: '#ecb138', dashArray: '6 5' }).addTo(readyMap);
      hotspotRefs.current.forEach(marker => marker.remove());
      hotspotRefs.current = mapData.observations.map(observation => L.marker(observation.coordinates, {
        icon: L.divIcon({ className: '', html: `<span style="display:block;width:18px;height:18px;border-radius:50%;border:3px solid white;background:${observationCategories[observation.category].color}"></span>`, iconSize: [18,18], iconAnchor: [9,9] }),
      }).addTo(readyMap).bindPopup(Object.assign(document.createElement('span'), { textContent: `${observationCategories[observation.category].label} · ${observation.observedAt} · ${observation.notes}` })));
    });
    return () => { cancelled = true; };
  }, [readyMap, mapData]);
  const clearMap = () => {
    changeData({ ...dataRef.current, boundary: [], observations: [] });
    setDrawMode('none');
    setStatus('Boundary and observation markers cleared.');
  };

  return (
    <div className="relative isolate overflow-hidden rounded-[26px] border border-[var(--line)] bg-white shadow-sm">
      <div className="grid gap-2 border-b bg-white p-3 sm:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void searchLocation();
              }
            }}
            aria-label="Search the map"
            className="h-10 pl-9"
          />
        </div>
        <Button
          onClick={() => void searchLocation()}
          disabled={searching}
          className="h-10"
        >
          {searching ? 'Searching…' : 'Find on map'}
        </Button>
      </div>
      {!readOnly && <div className="flex flex-wrap gap-2 border-b bg-[var(--mist)] p-3">
        <Button
          size="sm"
          variant={mode === 'boundary' ? 'default' : 'outline'}
          onClick={() => setDrawMode(mode === 'boundary' ? 'none' : 'boundary')}
        >
          <Pentagon /> Draw boundary
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            changeData({ ...dataRef.current, boundary: dataRef.current.boundary.slice(0, -1) });
            setDrawMode('boundary');
          }}
        >
          Undo boundary point
        </Button>
        {mode === 'boundary' && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (boundaryPointsRef.current.length < 3) {
                setStatus('Add at least three points to finish the boundary.');
                return;
              }
              setDrawMode('none');
              setStatus(
                `Boundary finished · approximately ${boundaryAcres(boundaryPointsRef.current as [number, number][]).toFixed(2)} acres. Not a surveyed area.`,
              );
            }}
          >
            Finish boundary
          </Button>
        )}
        <Button
          size="sm"
          variant={mode === 'hotspot' ? 'default' : 'outline'}
          onClick={() => setDrawMode(mode === 'hotspot' ? 'none' : 'hotspot')}
        >
          <MapPin /> Add observation
        </Button>
        <label className="flex items-center gap-2 rounded-lg border bg-white px-3 text-sm font-medium">
          <span>Pin category</span>
          <select
            value={category}
            onChange={(event) => {
              const next = event.target.value as ObservationCategory;
              categoryRef.current = next;
              setCategory(next);
            }}
            className="h-8 bg-transparent text-sm outline-none"
            aria-label="Observation pin category"
          >
            <option value="flooding">Flooding</option>
            <option value="salt_patch">Salt Patch</option>
          </select>
        </label>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => mapRef.current?.setView(defaultCenter, 10)}
        >
          <Crosshair /> Reset view
        </Button>
        <Button size="sm" variant="ghost" onClick={clearMap}>
          <RotateCcw /> Clear marks
        </Button>
      </div>}
      <div
        ref={containerRef}
        className={
          compact
            ? 'h-[390px] w-full'
            : 'h-[calc(100vh-230px)] min-h-[560px] w-full'
        }
        aria-label="Interactive OARS property map"
      />
      <p
        className="border-t bg-white px-4 py-3 text-sm text-muted-foreground"
        aria-live="polite"
      >
        {status}
      </p>
      <div className="space-y-4 border-t p-4">
        <label className="block text-sm font-semibold">Property map notes
          <textarea readOnly={readOnly} className="mt-2 w-full rounded border p-2 font-normal" maxLength={10000} value={mapData.notes} onChange={e => changeData({ ...mapData, notes: e.target.value })} />
        </label>
        {mapData.observations.map(o => <div key={o.id} className="grid gap-2 rounded border p-3 sm:grid-cols-[1fr_1fr_auto]">
          <p className="text-sm font-semibold sm:col-span-3">{observationCategories[o.category].label} · {o.coordinates.map(n => n.toFixed(5)).join(', ')}</p>
          <label className="text-sm">Observation date<input readOnly={readOnly} aria-label={`Observation date ${o.id}`} type="date" className="block w-full rounded border p-2" value={o.observedAt} onChange={e => { if (e.target.value) changeData({ ...mapData, observations: mapData.observations.map(item => item.id === o.id ? { ...item, observedAt: e.target.value } : item) }); }} /></label>
          <label className="text-sm">Notes<input readOnly={readOnly} aria-label={`Observation notes ${o.id}`} className="block w-full rounded border p-2" maxLength={2000} value={o.notes} onChange={e => changeData({ ...mapData, observations: mapData.observations.map(item => item.id === o.id ? { ...item, notes: e.target.value } : item) })} /></label>
          {!readOnly && <Button variant="outline" onClick={() => changeData({ ...mapData, observations: mapData.observations.filter(item => item.id !== o.id) })}>Remove marker</Button>}
          {!readOnly && o.category === 'salt_patch' && <div className="sm:col-span-3"><SaltPatchHandoff observation={o} /></div>}
        </div>)}
      </div>
    </div>
  );
}
