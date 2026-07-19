export type Furnishing = "unfurnished" | "semi" | "fully";
export type Source = "community" | "admin";
export type Confidence = "low" | "medium" | "high";
export type ObsStatus = "active" | "flagged" | "hidden";

export type RentObservation = {
  id: string;
  user_id: string | null;
  lat: number;
  lng: number;
  bhk: number;
  rent_inr: number;
  furnishing: Furnishing;
  society_name: string;
  area_slug: string;
  society_key: string;
  is_gated: boolean | null;
  deposit_months: number | null;
  maintenance_inr: number | null;
  as_of_date: string;
  source: Source;
  confidence: Confidence;
  status: ObsStatus;
  outlier_reason: string | null;
  comment: string | null;
  created_at: string;
};

export type MapPin = {
  id: string;
  lat: number;
  lng: number;
  society_name: string;
  area_slug: string;
  society_key: string;
  bhk: number;
  rent_inr: number;
  source: Source;
  status: ObsStatus;
};

export type RentRange = {
  p25: number;
  median: number;
  p75: number;
  min: number;
  max: number;
  n: number;
};

export type BachelorRealityScore = {
  label: "friendly" | "conditional" | "families" | "unknown";
  emoji: string;
  confidence_pct: number;
  response_count: number;
  breakdown: { yes: number; no: number; depends: number };
  display: string;
};

export type SocietyBachelorIntel = {
  society_id: string;
  bachelor_score: number | null; // 0-100 score, null if unknown
  label: "Friendly" | "Conditional" | "Families" | "Unknown";
  confidence: number; // 0-1
  total_votes: number;
  allowed_count: number;
  not_allowed_count: number;
};

export type IntelligencePayload = {
  society_name: string;
  area_slug: string;
  society_key: string;
  sample_observation?: MapPin;
  rent_by_bhk: Record<string, RentRange>;
  rent_by_furnishing?: Record<string, RentRange>;
  observations?: {
    id: string;
    bhk: number;
    rent_inr: number;
    furnishing: string;
    deposit_months: number | null;
    maintenance_inr: number | null;
    is_gated: boolean | null;
    as_of_date: string;
  }[];
  deposit_months_median: number | null;
  maintenance_median: number | null;
  bachelor: BachelorRealityScore;
  reviews: { body: string; owner_strictness: number | null; created_at: string }[];
  meta: {
    community_n: number;
    admin_n: number;
    confidence: Confidence;
    estimated_label: boolean;
    last_updated: string | null;
  };
};
