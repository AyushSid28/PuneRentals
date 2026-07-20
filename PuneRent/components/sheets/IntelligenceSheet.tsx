"use client";

import { useState } from "react";
import type { IntelligencePayload } from "@/models/pin";

export function IntelligenceSheet({
  data,
  onClose,
  onPinRent,
  onReport,
  onVote,
}: {
  data: IntelligencePayload;
  onClose: () => void;
  onPinRent?: () => void;
  onReport: () => void;
  onVote: (v: "yes" | "no" | "depends") => void;
}) {
  const [selectedFlatId, setSelectedFlatId] = useState<string | null>(null);

  const selectedFlat = selectedFlatId ? data.observations?.find(f => f.id === selectedFlatId) : null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center p-4">
      <div className="pointer-events-auto max-h-[90vh] w-full max-w-[420px] overflow-y-auto rounded-2xl bg-neutral-900 text-neutral-100 p-4 shadow-2xl">
        {!selectedFlat ? (
          <>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold">
                  📍 {data.observations?.length || 0} flats at {data.society_name}
                </h2>
                <p className="mt-1 text-sm text-neutral-400 capitalize">
                  Too close to show as separate pins — tap one to see details.
                </p>
              </div>
              <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-800 text-neutral-400 hover:bg-neutral-700">✕</button>
            </div>

            <div className="space-y-3">
              {data.observations?.sort((a, b) => a.rent_inr - b.rent_inr).map((flat) => (
                <button
                  key={flat.id}
                  onClick={() => setSelectedFlatId(flat.id)}
                  className="flex w-full items-center justify-between rounded-xl border border-neutral-700 bg-neutral-800 p-4 text-left hover:bg-neutral-700/80 transition-colors"
                >
                  <div className="font-semibold text-white flex items-center gap-2">
                    <span>₹{(flat.rent_inr / 1000).toFixed(flat.rent_inr % 1000 === 0 ? 0 : 1)}K</span>
                    <span className="text-neutral-400 font-normal">· {flat.bhk}BHK</span>
                    {flat.is_outlier && (
                      <span className="text-xs font-medium text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                        ⚠️ {flat.outlier_label || "Unusual price"}
                      </span>
                    )}
                  </div>
                  <span className="text-neutral-500">›</span>
                </button>
              ))}
              {(!data.observations || data.observations.length === 0) && (
                <p className="text-sm text-neutral-500">No flats found for this society.</p>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="mb-6 flex items-start justify-between">
              <div>
                <button onClick={() => setSelectedFlatId(null)} className="mb-2 flex items-center text-sm font-semibold text-blue-400 hover:text-blue-300">
                  <span className="mr-1">‹</span> Back to flats
                </button>
                <p className="text-xs text-neutral-400 font-semibold tracking-wider">MONTHLY RENT</p>
                <h2 className="text-4xl font-bold mt-1 flex items-center gap-3">
                  <span>₹{selectedFlat.rent_inr.toLocaleString()}</span>
                  {selectedFlat.is_outlier && (
                    <span className="text-sm font-medium text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 mt-1">
                      ⚠️ {selectedFlat.outlier_label || "Unusual price"}
                    </span>
                  )}
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-indigo-900/50 border border-indigo-700 px-3 py-1 text-xs font-semibold text-indigo-300">
                    • {selectedFlat.bhk} BHK
                  </span>
                  <span className="rounded-full bg-amber-900/50 border border-amber-700 px-3 py-1 text-xs font-semibold text-amber-300 capitalize">
                    • {selectedFlat.furnishing}
                  </span>
                  {selectedFlat.maintenance_inr ? (
                    <span className="rounded-full bg-emerald-900/50 border border-emerald-700 px-3 py-1 text-xs font-semibold text-emerald-300">
                      • Maint: ₹{selectedFlat.maintenance_inr}
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-900/50 border border-emerald-700 px-3 py-1 text-xs font-semibold text-emerald-300">
                      • Maintenance Included
                    </span>
                  )}
                  {selectedFlat.is_gated ? (
                    <span className="rounded-full bg-neutral-800 border border-neutral-600 px-3 py-1 text-xs font-semibold text-neutral-300">
                      • Gated
                    </span>
                  ) : (
                    <span className="rounded-full bg-neutral-800 border border-neutral-600 px-3 py-1 text-xs font-semibold text-neutral-300">
                      • Not Gated
                    </span>
                  )}
                  {selectedFlat.deposit_months && (
                    <span className="rounded-full bg-neutral-800 border border-neutral-600 px-3 py-1 text-xs font-semibold text-neutral-300">
                      • Dep: {selectedFlat.deposit_months}m
                    </span>
                  )}
                </div>
                <div className="mt-4 text-xs font-semibold text-amber-500">
                  ◷ Pinned {new Date(selectedFlat.as_of_date).toLocaleDateString()}
                </div>
              </div>
              <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-800 text-neutral-400 hover:bg-neutral-700">✕</button>
            </div>

            <div className="mt-6 border-t border-neutral-800 pt-6">
              <div className="mb-4">
                <h3 className="text-lg font-bold mb-3">Bachelor Reality</h3>
                <div className="rounded-xl bg-white/5 p-4 space-y-2 text-sm">
                  <div className="flex items-center text-lg font-semibold">
                    <span className="mr-2">{data.bachelor.emoji}</span>
                    <span className="capitalize">{data.bachelor.label}</span>
                  </div>
                  <div className="text-white/70">{data.bachelor.confidence_pct}% confidence</div>
                  <div className="text-white/70">{data.bachelor.response_count} tenant responses</div>
                  <div className="pt-2 flex justify-between border-t border-white/10 mt-2">
                    <span className="text-green-400 font-medium">Allowed: {data.bachelor.breakdown.yes}</span>
                    <span className="text-red-400 font-medium">Not allowed: {data.bachelor.breakdown.no}</span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex gap-2">
                  <button onClick={() => onVote("yes")} className="flex-1 rounded-lg bg-neutral-800 border border-neutral-700 py-2 text-sm font-semibold hover:bg-neutral-700">
                    Vote 🟢
                  </button>
                  <button onClick={() => onVote("depends")} className="flex-1 rounded-lg bg-neutral-800 border border-neutral-700 py-2 text-sm font-semibold hover:bg-neutral-700">
                    Vote 🟡
                  </button>
                  <button onClick={() => onVote("no")} className="flex-1 rounded-lg bg-neutral-800 border border-neutral-700 py-2 text-sm font-semibold hover:bg-neutral-700">
                    Vote 🔴
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-xs font-semibold tracking-wider text-neutral-400">COMMENTS</h3>
              </div>

              {data.reviews[0] ? (
                <blockquote className="mb-4 rounded-xl bg-neutral-800 p-4 text-sm text-neutral-300 italic">
                &ldquo;{data.reviews[0].body}&rdquo;
              </blockquote>
              ) : (
                <p className="mb-4 text-sm text-neutral-500">No comments yet — be the first!</p>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  className="flex-1 rounded-lg bg-neutral-800 border-none px-4 py-2 text-sm text-white placeholder-neutral-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  disabled
                />
                <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold hover:bg-indigo-500" disabled>
                  Post
                </button>
              </div>

              <div className="mt-6 flex justify-end">
                <button onClick={onReport} className="text-xs font-semibold text-red-500 hover:text-red-400 underline underline-offset-2">
                  Report this listing
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
