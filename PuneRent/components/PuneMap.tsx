"use client";

import { useEffect, useState } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl/maplibre";
import type { MapRef } from "react-map-gl/maplibre";
import type { MapPin } from "@/models/pin";

const PUNE_BOUNDS: [[number, number], [number, number]] = [
  [73.62, 18.3],
  [74.13, 18.82],
];

const MAP_THEMES = {
  white: "https://tiles.openfreemap.org/styles/positron",
  blue: "https://tiles.openfreemap.org/styles/dark",
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

function formatRent(rent: number) {
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

export default function PuneMap() {
  const [pins, setPins] = useState<MapPin[]>([]);
  const [theme, setTheme] = useState<MapTheme>("blue");

  function handleStyleReady(map: MapRef["getMap"] extends () => infer T ? T : never) {
    if (theme === "blue") {
      applyBluePalette(map);
    }
  }

  useEffect(() => {
    fetch("/api/pins")
      .then((response) => response.json())
      .then((data) => setPins(data.pins ?? []))
      .catch(console.error);
  }, []);

  return (
    <Map
      initialViewState={{
        longitude: 73.8567,
        latitude: 18.5204,
        zoom: 12,
      }}
      style={{
        width: "100%",
        height: "100vh",
      }}
      minZoom={10.5}
      maxBounds={PUNE_BOUNDS}
      mapStyle={MAP_THEMES[theme]}
      onLoad={(event) => handleStyleReady(event.target)}
      onStyleData={(event) => handleStyleReady(event.target)}
    >
      <NavigationControl position="top-right" showCompass={false} />
      {pins.map((pin) => (
        <Marker
          key={pin.id}
          longitude={pin.lng}
          latitude={pin.lat}
          anchor="bottom"
        >
          <button
            type="button"
            className={`pune-rent-marker ${
              pin.source === "admin" ? "pune-rent-marker-admin" : ""
            } ${pin.status === "flagged" ? "pune-rent-marker-flagged" : ""}`}
            title={`${pin.society_name}, ${pin.area_slug}`}
          >
            <span>{pin.bhk}BHK</span>
            <span className="pune-rent-marker-dot">·</span>
            <span>{formatRent(pin.rent_inr)}</span>
          </button>
        </Marker>
      ))}
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
    </Map>
  );
}
