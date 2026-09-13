'use client';
import { useEffect, useMemo, useState } from 'react';
import type { Map as LeafletMap, TileLayer } from 'leaflet';
import { createExportLayer } from '@/lib/leaflet-export-layer';
import { FunctionalMap } from '@/components/functional-map';
import {
  basemaps,
  gisLayers,
  type BasemapId,
  type GisLayerId,
} from '@/lib/gis-layers';

type LayerStatus = 'Loading' | 'Loaded' | 'Some tiles unavailable';
function MapLayers({
  map,
  base,
  enabled,
  opacity,
  onStatus,
}: {
  map: LeafletMap;
  base: BasemapId;
  enabled: GisLayerId[];
  opacity: Record<string, number>;
  onStatus: (id: string, status: LayerStatus) => void;
}) {
  // Layer instances survive opacity changes; each overlay has its own pane/order.
  const instances = useMemo(() => new Map<string, TileLayer>(), []);
  useEffect(() => {
    let cancelled = false;
    let tile: TileLayer | undefined;
    void import('leaflet').then((L) => {
      if (cancelled) return;
      const definition = basemaps[base];
      tile = L.tileLayer(definition.url, {
        maxZoom: 20,
        maxNativeZoom: definition.maxNativeZoom,
        attribution: definition.attribution,
        zIndex: 0,
      }).addTo(map);
      let failed = false;
      tile.on('loading', () => {
        failed = false;
        onStatus('base', 'Loading');
      });
      tile.on('tileerror', () => {
        failed = true;
        onStatus('base', 'Some tiles unavailable');
      });
      tile.on('load', () =>
        onStatus('base', failed ? 'Some tiles unavailable' : 'Loaded'),
      );
    });
    return () => {
      cancelled = true;
      tile?.remove();
    };
  }, [map, base, onStatus]);
  useEffect(() => {
    let cancelled = false;
    void import('leaflet').then((L) => {
      if (cancelled) return;
      gisLayers.forEach((definition, index) => {
        let tile = instances.get(definition.id);
        if (!enabled.includes(definition.id)) {
          tile?.remove();
          instances.delete(definition.id);
          return;
        }
        if (!tile) {
          const options = {
            opacity: opacity[definition.id],
            attribution: definition.source,
            maxZoom: 20,
            maxNativeZoom: definition.maxNativeZoom,
            zIndex: index + 1,
          };
          if (definition.kind === 'wms')
            tile = L.tileLayer.wms(definition.url, {
              ...options,
              layers: definition.layer!,
              format: 'image/png',
              transparent: true,
              version: '1.1.1',
            });
          else if (definition.kind === 'export') {
            tile = createExportLayer(L, definition.url, options);
          } else tile = L.tileLayer(definition.url, options);
          let failed = false;
          tile.on('loading', () => {
            failed = false;
            onStatus(definition.id, 'Loading');
          });
          tile.on('tileerror', () => {
            failed = true;
            onStatus(definition.id, 'Some tiles unavailable');
          });
          tile.on('load', () =>
            onStatus(
              definition.id,
              failed ? 'Some tiles unavailable' : 'Loaded',
            ),
          );
          tile.addTo(map);
          instances.set(definition.id, tile);
        }
        tile.setOpacity(opacity[definition.id]);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [map, enabled, opacity, instances, onStatus]);
  useEffect(
    () => () => {
      instances.forEach((layer) => layer.remove());
      instances.clear();
    },
    [instances],
  );
  return null;
}

export function GisExplorer({
  property,
}: {
  property?: {
    name: string;
    location: string;
    latitude: number;
    longitude: number;
  };
}) {
  const [map, setMap] = useState<LeafletMap | null>(null);
  const [base, setBase] = useState<BasemapId>('satellite');
  const [enabled, setEnabled] = useState<GisLayerId[]>(['landcover', 'water']);
  const [opacity, setOpacity] = useState<Record<string, number>>(() =>
    Object.fromEntries(gisLayers.map((layer) => [layer.id, layer.opacity])),
  );
  const [statuses, setStatuses] = useState<Record<string, LayerStatus>>({});
  const onStatus = useMemo(
    () => (id: string, status: LayerStatus) =>
      setStatuses((previous) =>
        previous[id] === status ? previous : { ...previous, [id]: status },
      ),
    [],
  );
  const coordinates = useMemo(
    () =>
      property
        ? { latitude: property.latitude, longitude: property.longitude }
        : undefined,
    [property],
  );
  return (
    <section className="bg-[var(--mist)]">
      <div className="border-b bg-white px-5 py-6 lg:px-8">
        <p className="text-sm font-semibold text-[var(--teal-dark)]">
          OARS · GIS explorer
        </p>
        <h1 className="mt-2 text-3xl font-semibold">
          Map products and field conditions
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Explore public layers, draw a field boundary, and mark observations.{' '}
          {property
            ? `Viewing ${property.name}.`
            : 'Search for a property or pan to your area.'}{' '}
          Drawings stay in this view only and are not saved to your account.
        </p>
      </div>
      <div className="grid gap-5 p-4 lg:grid-cols-[310px_minmax(0,1fr)] lg:p-6">
        <aside
          id="gis-layer-controls"
          className="order-2 space-y-5 rounded-2xl border bg-white p-5 lg:order-1"
        >
          <label className="grid gap-2 font-semibold" htmlFor="gis-basemap">
            Basemap
            <select
              id="gis-basemap"
              value={base}
              onChange={(event) => setBase(event.target.value as BasemapId)}
              className="rounded-lg border p-2 text-sm font-normal"
            >
              {Object.entries(basemaps).map(([id, value]) => (
                <option key={id} value={id}>
                  {value.label}
                </option>
              ))}
            </select>
          </label>
          <p className="text-xs text-muted-foreground" aria-live="polite">
            Basemap: {statuses.base || 'Loading'}
          </p>
          <h2 className="font-semibold">Layers · {enabled.length} enabled</h2>
          {gisLayers.map((layer) => {
            const active = enabled.includes(layer.id);
            return (
              <div key={layer.id} className="border-t pt-4">
                <label className="flex items-start gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={active}
                    className="mt-1"
                    onChange={() =>
                      setEnabled((items) =>
                        active
                          ? items.filter((id) => id !== layer.id)
                          : [...items, layer.id],
                      )
                    }
                  />
                  {layer.label}
                </label>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {layer.description}
                </p>
                <label
                  className="mt-2 grid gap-1 text-xs"
                  htmlFor={`opacity-${layer.id}`}
                >
                  Opacity · {Math.round(opacity[layer.id] * 100)}%
                  <input
                    id={`opacity-${layer.id}`}
                    type="range"
                    min="0"
                    max="1"
                    step=".05"
                    disabled={!active}
                    value={opacity[layer.id]}
                    onChange={(event) =>
                      setOpacity((previous) => ({
                        ...previous,
                        [layer.id]: Number(event.target.value),
                      }))
                    }
                  />
                </label>
                {active && (
                  <p className="mt-1 text-xs" aria-live="polite">
                    {statuses[layer.id] || 'Loading'}
                  </p>
                )}
                <div className="mt-2 flex gap-3 text-xs text-[var(--teal-dark)]">
                  <a
                    href={layer.documentation}
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    Source / metadata
                  </a>
                  {layer.legend && (
                    <a
                      href={layer.legend}
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      Provider legend
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </aside>
        <div className="order-1 min-w-0 space-y-4 lg:order-2">
          <a
            href="#gis-layer-controls"
            className="inline-block text-sm underline lg:hidden"
          >
            Choose map layers and opacity ↓
          </a>
          <FunctionalMap
            initialAddress={property?.location}
            initialCoordinates={coordinates}
            onMapReady={setMap}
            externalBasemap
          />
          {map && (
            <MapLayers
              map={map}
              base={base}
              enabled={enabled}
              opacity={opacity}
              onStatus={onStatus}
            />
          )}
          <div className="rounded-xl border bg-white p-4 text-sm leading-6">
            <strong>How to interpret these layers</strong>
            <p>
              A loaded layer may be blank outside its coverage. Missing tiles do
              not mean there is no flooding or wetland risk. The 4.5 ft layer is
              a scenario; hillshade is relief shading. Soils remain
              experimental. Field summaries and automated risk models are not
              implemented.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
