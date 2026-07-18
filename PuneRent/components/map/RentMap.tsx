"use client";

import { GoogleMap, OverlayView, useJsApiLoader } from "@react-google-maps/api";
import { PUNE_BBOX, PUNE_CENTER } from "@/lib/constants";
import type { MapPin } from "@/models/pin";

const PUNE_MAP_BOUNDS = {
  north: PUNE_BBOX.maxLat + 0.08,
  south: PUNE_BBOX.minLat - 0.08,
  east: PUNE_BBOX.maxLng + 0.08,
  west: PUNE_BBOX.minLng - 0.08,
};

function formatRent(rent: number) {
  const rentInThousands = rent / 1000;

  return `${Number.isInteger(rentInThousands) ? rentInThousands : rentInThousands.toFixed(1)}K`;
}

export function RentMap({
  pins,
  onSelect,
}: {
  pins: MapPin[];
  onSelect: (id: string) => void;
}) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: key || "missing",
  });

  if (!key) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 bg-neutral-200 p-6 text-center">
        <p className="font-medium">Map needs a Google Maps API key</p>
        <p className="max-w-sm text-sm text-neutral-600">
          Set <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in{" "}
          <code>.env.local</code>. Pins API still works without the map.
        </p>
        <ul className="mt-4 max-h-48 w-full max-w-md overflow-auto rounded-lg bg-white p-3 text-left text-sm">
          {pins.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className="w-full py-1 text-left hover:underline"
                onClick={() => onSelect(p.id)}
              >
                {p.society_name} · {p.area_slug} · ₹{p.rent_inr}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex h-full items-center justify-center">Loading map…</div>
    );
  }

  return (
    <GoogleMap
      mapContainerClassName="h-full w-full"
      center={PUNE_CENTER}
      zoom={12}
      options={{
        streetViewControl: false,
        mapTypeControl: false,
        minZoom: 11,
        restriction: {
          latLngBounds: PUNE_MAP_BOUNDS,
          strictBounds: false,
        },
      }}
    >
      {pins.map((p) => (
        <OverlayView
          key={p.id}
          position={{ lat: p.lat, lng: p.lng }}
          mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
        >
          <button
            type="button"
            className={`rent-map-label ${
              p.source === "admin" ? "rent-map-label-admin" : ""
            } ${p.status === "flagged" ? "rent-map-label-flagged" : ""}`}
            onClick={() => onSelect(p.id)}
            title={`${p.society_name}, ${p.area_slug}`}
          >
            <span>{p.bhk}BHK</span>
            <span className="rent-map-label-dot">·</span>
            <span>{formatRent(p.rent_inr)}</span>
          </button>
        </OverlayView>
      ))}
    </GoogleMap>
  );
}
