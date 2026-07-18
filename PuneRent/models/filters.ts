export type MapFilters = {
  bhk?: number | null;
  rentMin?: number | null;
  rentMax?: number | null;
  furnishing?: "unfurnished" | "semi" | "fully" | null;
  bachelorOnly?: boolean;
  gatedOnly?: boolean;
  areaSlug?: string | null;
};

export const DEFAULT_FILTERS: MapFilters = {
  bhk: null,
  rentMin: null,
  rentMax: null,
  furnishing: null,
  bachelorOnly: false,
  gatedOnly: false,
  areaSlug: null,
};
