import type { BachelorRealityScore } from "@/models/pin";

type Vote = { bachelors_allowed: "yes" | "no" | "depends" };

export function computeBachelorRealityScore(votes: Vote[]): BachelorRealityScore {
  const breakdown = { yes: 0, no: 0, depends: 0 };
  for (const v of votes) breakdown[v.bachelors_allowed]++;

  const n = votes.length;
  if (n === 0) {
    return {
      label: "unknown",
      emoji: "⚪",
      confidence_pct: 0,
      response_count: 0,
      breakdown,
      display: "No bachelor data yet — be the first to vote",
    };
  }

  const yesPct = breakdown.yes / n;
  const noPct = breakdown.no / n;

  let label: BachelorRealityScore["label"] = "conditional";
  let emoji = "🟡";
  if (yesPct >= 0.7) {
    label = "friendly";
    emoji = "🟢";
  } else if (noPct >= 0.5) {
    label = "families";
    emoji = "🔴";
  }

  const top = Math.max(breakdown.yes, breakdown.no, breakdown.depends) / n;
  const sizeFactor = Math.min(1, n / 40);
  const confidence_pct = Math.round((0.45 * top + 0.55 * sizeFactor) * 100);

  const title =
    label === "friendly"
      ? "Bachelor Friendly"
      : label === "families"
        ? "Families-oriented"
        : "Conditional / Depends";

  return {
    label,
    emoji,
    confidence_pct,
    response_count: n,
    breakdown,
    display: `${emoji} ${title} — ${confidence_pct}% confidence based on ${n} tenant response${n === 1 ? "" : "s"}`,
  };
}

export function computeSocietyBachelorIntel(society_id: string, votes: Vote[]): import("@/models/pin").SocietyBachelorIntel {
  const breakdown = { yes: 0, no: 0, depends: 0 };
  for (const v of votes) breakdown[v.bachelors_allowed]++;
  
  const n = votes.length;
  if (n === 0) {
    return {
      society_id,
      bachelor_score: null,
      label: "Unknown",
      confidence: 0,
      total_votes: 0,
      allowed_count: 0,
      not_allowed_count: 0
    };
  }
  
  const yesPct = breakdown.yes / n;
  const noPct = breakdown.no / n;
  
  let label: "Friendly" | "Conditional" | "Families" = "Conditional";
  if (yesPct >= 0.7) label = "Friendly";
  else if (noPct >= 0.5) label = "Families";
  
  const top = Math.max(breakdown.yes, breakdown.no, breakdown.depends) / n;
  const sizeFactor = Math.min(1, n / 40);
  const confidence = (0.45 * top + 0.55 * sizeFactor);
  
  // Score is yes % + half of depends %, scaled by confidence
  const scoreRaw = (breakdown.yes + (breakdown.depends * 0.5)) / n;
  const bachelor_score = Math.round(scoreRaw * 100);

  return {
    society_id,
    bachelor_score,
    label,
    confidence: Number(confidence.toFixed(2)),
    total_votes: n,
    allowed_count: breakdown.yes,
    not_allowed_count: breakdown.no
  };
}
