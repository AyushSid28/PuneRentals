export const PUNE_CENTER = { lat: 18.5204, lng: 73.8567 };

export const PUNE_BBOX = {
  minLat: 18.40,
  maxLat: 18.72,
  minLng: 73.70,
  maxLng: 74.05,
};

export const PHASE1_AREAS = [
  { slug: "hinjewadi", name: "Hinjewadi", center: { lat: 18.5912, lng: 73.7389 } },
  { slug: "wakad", name: "Wakad", center: { lat: 18.5995, lng: 73.7629 } },
  { slug: "sus", name: "Sus", center: { lat: 18.5488, lng: 73.7516 } },
  { slug: "baner", name: "Baner", center: { lat: 18.5590, lng: 73.7868 } },
  { slug: "kharadi", name: "Kharadi", center: { lat: 18.5515, lng: 73.9400 } },
  { slug: "viman-nagar", name: "Viman Nagar", center: { lat: 18.5679, lng: 73.9143 } },
  { slug: "magarpatta", name: "Magarpatta", center: { lat: 18.5160, lng: 73.9260 } },
] as const;

/** Rough plausible rent bounds for Pune (INR / month) */
export const BHK_RENT_BOUNDS: Record<number, [number, number]> = {
  1: [8000, 40000],
  2: [12000, 65000],
  3: [18000, 100000],
  4: [25000, 150000],
  5: [30000, 200000],
};

export const AREA_MEDIAN_HINT: Record<string, Record<number, number>> = {
  hinjewadi: { 1: 16000, 2: 26000, 3: 38000 },
  wakad: { 1: 15000, 2: 24000, 3: 35000 },
  sus: { 1: 14000, 2: 24000, 3: 34000 },
  baner: { 1: 18000, 2: 30000, 3: 45000 },
  kharadi: { 1: 14000, 2: 22000, 3: 32000 },
  "viman-nagar": { 1: 17000, 2: 28000, 3: 40000 },
  magarpatta: { 1: 16000, 2: 27000, 3: 39000 },
};
