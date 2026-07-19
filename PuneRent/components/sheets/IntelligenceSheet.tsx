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
                  <div className="font-semibold text-white">
                    ₹{(flat.rent_inr / 1000).toFixed(flat.rent_inr % 1000 === 0 ? 0 : 1)}K <span className="text-neutral-400 font-normal">· {flat.bhk}BHK</span>
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
                <h2 className="text-4xl font-bold mt-1">
                  ₹{selectedFlat.rent_inr.toLocaleString()}
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
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xs font-semibold tracking-wider text-neutral-400">COMMUNITY RATING</h3>
                <span className="text-xs text-neutral-500">{data.bachelor.display}</span>
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
                  "{data.reviews[0].body}"
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
