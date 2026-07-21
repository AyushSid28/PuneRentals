"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ReactMap, { Marker, NavigationControl } from "react-map-gl/maplibre";
import { usePostHog } from "posthog-js/react";
import { EmptyState } from "@/components/EmptyState";
import type { MapRef } from "react-map-gl/maplibre";
import type { MapFilters } from "@/models/filters";
import type { SocietyIntel } from "@/app/api/societies/route";

const PUNE_BOUNDS: [[number, number], [number, number]] = [
  [73.62, 18.3],
  [74.13, 18.82],
];

const MAP_THEMES = {
  white:
    process.env.NEXT_PUBLIC_MAP_STYLE_WHITE_URL ??
    "https://tiles.openfreemap.org/styles/positron",
  blue:
    process.env.NEXT_PUBLIC_MAP_STYLE_BLUE_URL ??
    "https://tiles.openfreemap.org/styles/dark",
} as const;

type MapTheme = keyof typeof MAP_THEMES;

const BLUE_MAP_COLORS = {
  background: "#17182c",
  land: "#1b1c33",
  road: "#383a63",
  majorRoad: "#51537f",
  boundary: "#2a2c4b",
  label: "#b6bacb",
  minorLabel: "#8f94a9",
  water: "#070d1b",
  park: "#102820",
};

function formatRent(rent: number | null) {
  if (rent === null) return "—";
  const rentInThousands = rent / 1000;
  return `${Number.isInteger(rentInThousands) ? rentInThousands : rentInThousands.toFixed(1)}K`;
}

function applyBluePalette(map: MapRef["getMap"] extends () => infer T ? T : never) {
  const style = map.getStyle();
  if (!style.layers) {
    return;
  }

  for (const layer of style.layers) {
    const id = layer.id.toLowerCase();
    const sourceLayer =
      "source-layer" in layer && typeof layer["source-layer"] === "string"
        ? layer["source-layer"].toLowerCase()
        : "";
    const name = `${id} ${sourceLayer}`;

    try {
      if (layer.type === "background") {
        map.setPaintProperty(layer.id, "background-color", BLUE_MAP_COLORS.background);
      }

      if (layer.type === "fill") {
        if (name.includes("water")) {
          map.setPaintProperty(layer.id, "fill-color", BLUE_MAP_COLORS.water);
          map.setPaintProperty(layer.id, "fill-opacity", 0.92);
        } else if (
          name.includes("park") ||
          name.includes("forest") ||
          name.includes("wood") ||
          name.includes("green")
        ) {
          map.setPaintProperty(layer.id, "fill-color", BLUE_MAP_COLORS.park);
          map.setPaintProperty(layer.id, "fill-opacity", 0.7);
        } else {
          map.setPaintProperty(layer.id, "fill-color", BLUE_MAP_COLORS.land);
          map.setPaintProperty(layer.id, "fill-opacity", 0.86);
        }
      }

      if (layer.type === "line") {
        if (name.includes("road") || name.includes("highway") || name.includes("transport")) {
          const isMajor =
            name.includes("motorway") ||
            name.includes("trunk") ||
            name.includes("primary") ||
            name.includes("secondary");

          map.setPaintProperty(
            layer.id,
            "line-color",
            isMajor ? BLUE_MAP_COLORS.majorRoad : BLUE_MAP_COLORS.road
          );
          map.setPaintProperty(layer.id, "line-opacity", isMajor ? 0.76 : 0.5);
        } else if (name.includes("boundary")) {
          map.setPaintProperty(layer.id, "line-color", BLUE_MAP_COLORS.boundary);
          map.setPaintProperty(layer.id, "line-opacity", 0.55);
        }
      }

      if (layer.type === "symbol") {
        map.setPaintProperty(
          layer.id,
          "text-color",
          name.includes("minor") || name.includes("place") ? BLUE_MAP_COLORS.minorLabel : BLUE_MAP_COLORS.label
        );
        map.setPaintProperty(layer.id, "text-halo-color", BLUE_MAP_COLORS.background);
        map.setPaintProperty(layer.id, "text-halo-width", 1.15);

        if (name.includes("road")) {
          map.setPaintProperty(layer.id, "text-color", "#aeb3c9");
        }
      }
    } catch {
      // Some third-party style layers do not expose every paint property.
    }
  }
}

export default function PuneMap({
  filters,
  searchedLocation,
  isPickingLocation = false,
  onSelect,
  onPickLocation,
  onClearFilters,
  refreshKey = 0,
}: {
  filters?: MapFilters;
  searchedLocation?: { lat: number; lng: number; name: string } | null;
  isPickingLocation?: boolean;
  /** Called with the society UUID when a marker is clicked */
  onSelect?: (id: string) => void;
  onPickLocation?: (location: { lat: number; lng: number }) => void;
  onClearFilters?: () => void;
  refreshKey?: number;
}) {
  const [societies, setSocieties] = useState<SocietyIntel[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pickedLocation, setPickedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [theme, setTheme] = useState<MapTheme>("blue");
  const [zoom, setZoom] = useState(12);
  const posthog = usePostHog();

  function handleStyleReady(map: MapRef["getMap"] extends () => infer T ? T : never) {
    if (theme === "blue") {
      applyBluePalette(map);
    }
  }

  // ── Data fetching ──────────────────────────────────────────────────────────
  useEffect(() => {
    setIsLoading(true);
    setLoadError(null);

    const params = new URLSearchParams();
    if (filters?.query) params.set("q", filters.query);
    if (filters?.areaSlug) params.set("areaSlug", filters.areaSlug);
    if (filters?.bhk) params.set("bhk", filters.bhk.toString());
    if (filters?.furnishing) params.set("furnishing", filters.furnishing);
    if (filters?.rentMin) params.set("rentMin", filters.rentMin.toString());
    if (filters?.rentMax) params.set("rentMax", filters.rentMax.toString());
    if (filters?.bachelorOnly) params.set("bachelorOnly", "true");

    fetch(`/api/societies?${params.toString()}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Could not load societies");
        setSocieties(data.societies ?? []);
      })
      .catch((error) =>
        setLoadError(error instanceof Error ? error.message : "Could not load societies")
      )
      .finally(() => setIsLoading(false));
  }, [refreshKey, filters]);

  const mapRef = useRef<MapRef>(null);

  useEffect(() => {
    if (searchedLocation && mapRef.current) {
      mapRef.current.flyTo({
        center: [searchedLocation.lng, searchedLocation.lat],
        zoom: 14,
        duration: 1000,
      });
    }
  }, [searchedLocation]);

  // ── Client-side filtering removed since API handles it ──────────────────────
  const filteredSocieties = societies;

  // ── Clustering ────────────────────────────────────────────────────────────
  const clusters = useMemo(() => {
    if (zoom >= 12.6) {
      return filteredSocieties.map((s) => ({ type: "society" as const, society: s }));
    }

    const precision = zoom < 11.2 ? 0.06 : 0.035;
    const grouped = new Map<string, SocietyIntel[]>();
    for (const s of filteredSocieties) {
      const lat = Math.round(s.lat / precision) * precision;
      const lng = Math.round(s.lng / precision) * precision;
      const key = `${lat.toFixed(3)}:${lng.toFixed(3)}`;
      grouped.set(key, [...(grouped.get(key) ?? []), s]);
    }

    return Array.from(grouped.values()).map((group) => {
      if (group.length === 1) return { type: "society" as const, society: group[0] };
      return {
        type: "cluster" as const,
        id: group.map((s) => s.id).join(":"),
        count: group.length,
        lat: group.reduce((sum, s) => sum + s.lat, 0) / group.length,
        lng: group.reduce((sum, s) => sum + s.lng, 0) / group.length,
        societies: group,
      };
    });
  }, [filteredSocieties, zoom]);

  return (
    <ReactMap
      ref={mapRef}
      initialViewState={{
        longitude: 73.8567,
        latitude: 18.5204,
        zoom: 12,
      }}
      style={{
        width: "100%",
        height: "100%",
      }}
      minZoom={10.5}
      maxBounds={PUNE_BOUNDS}
      mapStyle={MAP_THEMES[theme]}
      dragRotate={false}
      pitchWithRotate={false}
      cursor="grab"
      onContextMenu={(event) => {
        event.preventDefault(); // Prevent the browser's right-click menu
        const location = {
          lat: Number(event.lngLat.lat.toFixed(6)),
          lng: Number(event.lngLat.lng.toFixed(6)),
        };
        setPickedLocation(location);
        onPickLocation?.(location);
      }}
      onClick={(event) => {
        // Only handle touch taps (mobile) — desktop uses right-click above
        const orig = event.originalEvent as PointerEvent;
        if (orig.pointerType !== "touch") return;
        if (event.defaultPrevented) return; // marker click already handled
        const location = {
          lat: Number(event.lngLat.lat.toFixed(6)),
          lng: Number(event.lngLat.lng.toFixed(6)),
        };
        setPickedLocation(location);
        onPickLocation?.(location);
      }}
      onLoad={(event) => {
        handleStyleReady(event.target);
        posthog?.capture("map_loaded");
      }}
      onMove={(event) => setZoom(event.viewState.zoom)}
      onStyleData={(event) => handleStyleReady(event.target)}
    >
      <NavigationControl position="bottom-right" showCompass={false} />
      {clusters.map((item) =>
        item.type === "cluster" ? (
          <Marker key={item.id} longitude={item.lng} latitude={item.lat} anchor="bottom">
            <button
              type="button"
              className="pune-rent-cluster"
              onClick={() => {
                if (mapRef.current) {
                  mapRef.current.flyTo({
                    center: [item.lng, item.lat],
                    zoom: Math.min(zoom + 2, 16),
                    duration: 1000,
                  });
                }
              }}
              title={`${item.count} societies`}
            >
              <strong>{item.count} societies</strong>
              <span>{item.societies.reduce((sum, s) => sum + (s.total_observations ?? 0), 0)} reports</span>
            </button>
          </Marker>
        ) : (
          <Marker
            key={item.society.id}
            longitude={item.society.lng}
            latitude={item.society.lat}
            anchor="bottom"
          >
            <button
              type="button"
              className={`pune-rent-marker ${item.society.is_seed ? "pune-rent-marker-admin" : "pune-rent-marker-community"}`}
              onClick={() => {
                posthog?.capture("society_marker_clicked", { society_id: item.society.id, society_name: item.society.name });
                onSelect?.(item.society.id);
              }}
              title={`${item.society.name}, ${item.society.area_slug}`}
            >
              <span className="pune-rent-marker-badge">
                {item.society.is_seed ? "EST" : "LIVE"}
              </span>
              
              {/* Bachelor indicator dot */}
              <div 
                className={`w-1.5 h-1.5 rounded-full mr-1.5 inline-block ${
                  item.society.bachelor_label === "Friendly" ? "bg-green-500" :
                  item.society.bachelor_label === "Families" ? "bg-red-500" :
                  item.society.bachelor_label === "Conditional" ? "bg-yellow-500" :
                  "bg-neutral-500"
                }`}
                title={`Bachelor Reality: ${item.society.bachelor_label || "Unknown"}`}
              />

              <span>{item.society.name.split(" ")[0]}</span>
              <span className="pune-rent-marker-dot">·</span>
              <span>{formatRent(item.society.median_rent)}</span>
            </button>
          </Marker>
        )
      )}
      {pickedLocation && (
        <Marker longitude={pickedLocation.lng} latitude={pickedLocation.lat} anchor="bottom">
          <div className="picked-location-marker">Selected</div>
        </Marker>
      )}
      {isLoading && <div className="map-state-panel">Loading societies...</div>}
      {loadError && <div className="map-state-panel map-state-panel-error">{loadError}</div>}
      {!isLoading && !loadError && societies.length === 0 && (
        <EmptyState onClearFilters={onClearFilters} />
      )}
      {isPickingLocation && (
        <div className="map-pick-panel">Click the map to choose this rent&apos;s location</div>
      )}
      <div className="map-theme-toggle" role="group" aria-label="Map theme">
        <button
          type="button"
          className={theme === "white" ? "is-active" : ""}
          onClick={() => setTheme("white")}
        >
          White
        </button>
        <button
          type="button"
          className={theme === "blue" ? "is-active" : ""}
          onClick={() => setTheme("blue")}
        >
          Blue
        </button>
      </div>
      {searchedLocation && (
        <Marker longitude={searchedLocation.lng} latitude={searchedLocation.lat} anchor="bottom">
          <div className="flex flex-col items-center">
            {/* Red Pin Bubble */}
            <div className="rounded-full bg-red-600 px-2 py-1 text-[10px] font-bold text-white shadow-lg">
              {searchedLocation.name}
            </div>
            {/* Pin Point */}
            <div className="h-3 w-0.5 bg-red-600"></div>
          </div>
        </Marker>
      )}

    </ReactMap>
  );
}
