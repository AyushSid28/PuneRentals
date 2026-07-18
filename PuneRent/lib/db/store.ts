import { randomUUID } from "crypto";
import { societyKey } from "@/lib/services/geo";
import type { RentObservation } from "@/models/pin";
import type { BachelorAnswer } from "@/models/bachelor";
import seed from "@/seed/estimated-pins.json";

type SeedRow = {
  lat: number;
  lng: number;
  bhk: number;
  rent_inr: number;
  furnishing: "unfurnished" | "semi" | "fully";
  society_name: string;
  area_slug: string;
  is_gated?: boolean;
  deposit_months?: number;
  maintenance_inr?: number;
  source: "admin" | "community";
  confidence: "low" | "medium" | "high";
};

type VoteRow = {
  society_key: string;
  user_id: string;
  bachelors_allowed: BachelorAnswer;
  visitors_restricted?: BachelorAnswer | null;
};

type ReviewRow = {
  society_key: string;
  user_id: string;
  body: string;
  owner_strictness: number | null;
  created_at: string;
};

type ReportRow = {
  observation_id: string;
  user_id: string | null;
  reason: string;
};

function fromSeed(row: SeedRow): RentObservation {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    user_id: null,
    lat: row.lat,
    lng: row.lng,
    bhk: row.bhk,
    rent_inr: row.rent_inr,
    furnishing: row.furnishing,
    society_name: row.society_name,
    area_slug: row.area_slug,
    society_key: societyKey(row.society_name, row.area_slug),
    is_gated: row.is_gated ?? null,
    deposit_months: row.deposit_months ?? null,
    maintenance_inr: row.maintenance_inr ?? null,
    as_of_date: now.slice(0, 10),
    source: row.source,
    confidence: row.confidence,
    status: "active",
    outlier_reason: null,
    comment: null,
    created_at: now,
  };
}

/** In-memory store for local V1 when Supabase env is missing */
const g = globalThis as unknown as {
  __puneStore?: {
    observations: RentObservation[];
    votes: VoteRow[];
    reviews: ReviewRow[];
    reports: ReportRow[];
  };
};

function store() {
  if (!g.__puneStore) {
    g.__puneStore = {
      observations: (seed as SeedRow[]).map(fromSeed),
      votes: [],
      reviews: [],
      reports: [],
    };
  }
  return g.__puneStore;
}

export function listObservations() {
  return store().observations.filter((o) => o.status !== "hidden");
}

export function getObservation(id: string) {
  return store().observations.find((o) => o.id === id) ?? null;
}

export function getBySocietyKey(key: string) {
  return store().observations.filter(
    (o) => o.society_key === key && o.status !== "hidden"
  );
}

export function addObservation(
  input: Omit<RentObservation, "id" | "created_at" | "as_of_date"> & {
    as_of_date?: string;
  }
) {
  const now = new Date().toISOString();
  const row: RentObservation = {
    ...input,
    id: randomUUID(),
    as_of_date: input.as_of_date ?? now.slice(0, 10),
    created_at: now,
  };
  store().observations.push(row);
  return row;
}

export function listVotes(societyKeyValue: string) {
  return store().votes.filter((v) => v.society_key === societyKeyValue);
}

export function upsertVote(vote: VoteRow) {
  const s = store();
  const i = s.votes.findIndex(
    (v) => v.society_key === vote.society_key && v.user_id === vote.user_id
  );
  if (i >= 0) s.votes[i] = vote;
  else s.votes.push(vote);
}

export function listReviews(societyKeyValue: string) {
  return store()
    .reviews.filter((r) => r.society_key === societyKeyValue)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 10);
}

export function addReport(report: ReportRow) {
  store().reports.push(report);
  const count = store().reports.filter(
    (r) => r.observation_id === report.observation_id
  ).length;
  if (count >= 3) {
    const obs = store().observations.find((o) => o.id === report.observation_id);
    if (obs) obs.status = "hidden";
  }
  return count;
}
