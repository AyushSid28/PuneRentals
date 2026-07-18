import seedPins from "@/seed/estimated-pins.json";
import { hasSupabase, supabaseAdmin } from "@/lib/db/client";
import { inPune, roundCoord, societyKey } from "@/lib/services/geo";
import { checkOutlier } from "@/lib/services/outlier";
import { createObservationSchema } from "@/lib/validators/pin";
import type { BachelorAnswer } from "@/models/bachelor";
import type { IntelligencePayload, MapPin, RentObservation } from "@/models/pin";
import { buildIntelligence } from "@/lib/services/intelligence";

type SeedPin = {
  lat: number;
  lng: number;
  bhk: number;
  rent_inr: number;
  furnishing: RentObservation["furnishing"];
  society_name: string;
  area_slug: string;
  is_gated?: boolean;
  deposit_months?: number;
  maintenance_inr?: number;
  source?: RentObservation["source"];
  confidence?: RentObservation["confidence"];
};

const localVotes: Record<string, { bachelors_allowed: BachelorAnswer }[]> = {};

export function seedObservations(): RentObservation[] {
  return (seedPins as SeedPin[]).map((pin, index) => {
    const key = societyKey(pin.society_name, pin.area_slug);
    return {
      id: `seed-${index + 1}`,
      user_id: null,
      lat: pin.lat,
      lng: pin.lng,
      bhk: pin.bhk,
      rent_inr: pin.rent_inr,
      furnishing: pin.furnishing,
      society_name: pin.society_name,
      area_slug: pin.area_slug,
      society_key: key,
      is_gated: pin.is_gated ?? null,
      deposit_months: pin.deposit_months ?? null,
      maintenance_inr: pin.maintenance_inr ?? null,
      as_of_date: new Date().toISOString().slice(0, 10),
      source: pin.source ?? "admin",
      confidence: pin.confidence ?? "low",
      status: "active",
      outlier_reason: null,
      comment: null,
      created_at: new Date().toISOString(),
    };
  });
}

export function toMapPin(observation: RentObservation): MapPin {
  return {
    id: observation.id,
    lat: roundCoord(observation.lat),
    lng: roundCoord(observation.lng),
    society_name: observation.society_name,
    area_slug: observation.area_slug,
    society_key: observation.society_key,
    bhk: observation.bhk,
    rent_inr: observation.rent_inr,
    source: observation.source,
    status: observation.status,
  };
}

export async function listMapPins(): Promise<MapPin[]> {
  const observations = await listObservations();
  return observations.map(toMapPin);
}

export async function getIntelligenceByPinId(
  id: string
): Promise<IntelligencePayload | null> {
  const observations = await listObservations();
  const selected = observations.find((pin) => pin.id === id);
  if (!selected) return null;

  const sameSociety = observations.filter(
    (pin) => pin.society_key === selected.society_key
  );
  const votes = await listVotes(selected.society_key);
  const reviews = await listReviews(selected.society_key);
  return buildIntelligence(selected.society_key, sameSociety, votes, reviews);
}

export async function createObservation(input: unknown) {
  const parsed = createObservationSchema.parse(input);
  if (!inPune(parsed.lat, parsed.lng)) {
    throw new Error("Pins must be within Pune.");
  }

  const outlier = checkOutlier(parsed.area_slug, parsed.bhk, parsed.rent_inr);
  if (outlier.flagged && !parsed.confirm_outlier) {
    return { ok: false as const, outlier_reason: outlier.reason };
  }

  const key = societyKey(parsed.society_name, parsed.area_slug);
  const row = {
    lat: parsed.lat,
    lng: parsed.lng,
    bhk: parsed.bhk,
    rent_inr: parsed.rent_inr,
    furnishing: parsed.furnishing,
    society_name: parsed.society_name,
    area_slug: parsed.area_slug,
    society_key: key,
    is_gated: parsed.is_gated ?? null,
    deposit_months: parsed.deposit_months ?? null,
    maintenance_inr: parsed.maintenance_inr ?? null,
    source: "community" as const,
    confidence: "medium" as const,
    status: outlier.flagged ? ("flagged" as const) : ("active" as const),
    outlier_reason: outlier.reason,
    comment: parsed.comment ?? null,
  };

  if (hasSupabase()) {
    const { data, error } = await supabaseAdmin()
      .from("rent_observations")
      .insert(row)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { ok: true as const, pin: toMapPin(data as RentObservation) };
  }

  return {
    ok: true as const,
    pin: toMapPin({
      ...row,
      id: `local-${Date.now()}`,
      user_id: null,
      as_of_date: new Date().toISOString().slice(0, 10),
      created_at: new Date().toISOString(),
    }),
  };
}

export async function addBachelorVote(input: {
  society_key: string;
  bachelors_allowed: BachelorAnswer;
  visitors_restricted?: BachelorAnswer;
}) {
  if (hasSupabase()) {
    const { error } = await supabaseAdmin().from("bachelor_votes").upsert(
      {
        society_key: input.society_key,
        bachelors_allowed: input.bachelors_allowed,
        visitors_restricted: input.visitors_restricted,
        user_id: "00000000-0000-0000-0000-000000000000",
      },
      { onConflict: "society_key,user_id" }
    );
    if (error) throw new Error(error.message);
  } else {
    (localVotes[input.society_key] ??= []).push({
      bachelors_allowed: input.bachelors_allowed,
    });
  }
  return { ok: true };
}

async function listObservations(): Promise<RentObservation[]> {
  if (!hasSupabase()) return seedObservations();

  const { data, error } = await supabaseAdmin()
    .from("rent_observations")
    .select("*")
    .in("status", ["active", "flagged"]);

  if (error) throw new Error(error.message);
  return (data ?? []) as RentObservation[];
}

async function listVotes(society_key: string) {
  if (!hasSupabase()) return localVotes[society_key] ?? [];

  const { data, error } = await supabaseAdmin()
    .from("bachelor_votes")
    .select("bachelors_allowed")
    .eq("society_key", society_key);

  if (error) throw new Error(error.message);
  return (data ?? []) as { bachelors_allowed: BachelorAnswer }[];
}

async function listReviews(
  society_key: string
): Promise<IntelligencePayload["reviews"]> {
  if (!hasSupabase()) return [];

  const { data, error } = await supabaseAdmin()
    .from("reviews")
    .select("body,owner_strictness,created_at")
    .eq("society_key", society_key)
    .order("created_at", { ascending: false })
    .limit(3);

  if (error) throw new Error(error.message);
  return (data ?? []) as IntelligencePayload["reviews"];
}
