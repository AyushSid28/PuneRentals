"use client";

import type { IntelligencePayload } from "@/models/pin";

export function IntelligenceSheet({
  data,
  onClose,
  onPinRent,
  onVote,
}: {
  data: IntelligencePayload;
  onClose: () => void;
  onPinRent: () => void;
  onVote: (v: "yes" | "no" | "depends") => void;
}) {
  const r2 = data.rent_by_bhk["2"];

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 max-h-[75vh] overflow-y-auto rounded-t-2xl bg-white p-4 shadow-2xl">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold">{data.society_name}</h2>
          <p className="text-sm text-neutral-500 capitalize">{data.area_slug.replace("-", " ")}</p>
        </div>
        <button onClick={onClose} className="text-neutral-400">✕</button>
      </div>

      {data.meta.estimated_label && (
        <div className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Estimated from public/research data · Low confidence — be the first tenant to confirm
        </div>
      )}

      <p className="mb-3 text-sm font-medium">{data.bachelor.display}</p>
      <p className="mb-1 text-xs text-neutral-500">
        Yes {data.bachelor.breakdown.yes} · No {data.bachelor.breakdown.no} · Depends{" "}
        {data.bachelor.breakdown.depends}
      </p>

      <h3 className="mt-4 text-sm font-semibold">Rent intelligence</h3>
      {r2 ? (
        <p className="text-sm">
          2 BHK: ₹{(r2.min / 1000).toFixed(0)}k–₹{(r2.max / 1000).toFixed(0)}k · median ₹
          {(r2.median / 1000).toFixed(0)}k · n={r2.n}
        </p>
      ) : (
        <p className="text-sm text-neutral-500">Not enough 2BHK data yet</p>
      )}

      {data.deposit_months_median != null && (
        <p className="mt-2 text-sm">Deposit ~{data.deposit_months_median} months</p>
      )}
      {data.maintenance_median != null && (
        <p className="text-sm">Maintenance ~₹{data.maintenance_median}/mo</p>
      )}

      <p className="mt-2 text-xs text-neutral-500">
        Confidence: {data.meta.confidence} · Community {data.meta.community_n} · Admin{" "}
        {data.meta.admin_n}
      </p>

      {data.reviews[0] && (
        <blockquote className="mt-3 border-l-2 border-neutral-200 pl-3 text-sm text-neutral-700">
          {data.reviews[0].body}
        </blockquote>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={onPinRent} className="rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white">
          + Pin my rent
        </button>
        <button onClick={() => onVote("yes")} className="rounded-lg border px-3 py-2 text-sm">
          Vote 🟢
        </button>
        <button onClick={() => onVote("depends")} className="rounded-lg border px-3 py-2 text-sm">
          Vote 🟡
        </button>
        <button onClick={() => onVote("no")} className="rounded-lg border px-3 py-2 text-sm">
          Vote 🔴
        </button>
      </div>
    </div>
  );
}