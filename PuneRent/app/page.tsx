"use client";

import { useEffect, useState } from "react";
import PuneMap from "@/components/PuneMap";
import { IntelligenceSheet } from "@/components/sheets/IntelligenceSheet";
import { Toolbar } from "@/components/toolbar/Toolbar";
import { PHASE1_AREAS } from "@/lib/constants";
import { DEFAULT_FILTERS, type MapFilters } from "@/models/filters";
import type { IntelligencePayload } from "@/models/pin";
import { usePostHog } from "posthog-js/react";

type Modal = "stats" | "faq" | "tour" | "pin" | "report" | null;

export default function Home() {
  const [intel, setIntel] = useState<IntelligencePayload | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [filters, setFilters] = useState<MapFilters>(DEFAULT_FILTERS);
  const [refreshKey, setRefreshKey] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [pickedLocation, setPickedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchedLocation, setSearchedLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [anonymousUserId, setAnonymousUserId] = useState<string>("");
  const [pinPrefill, setPinPrefill] = useState<{ society_name: string; area_slug: string; lat: number; lng: number } | null>(null);
  const [selectedSocietyId, setSelectedSocietyId] = useState<string | null>(null);
  const posthog = usePostHog();

  useEffect(() => {
    let id = localStorage.getItem("pune_rent_anonymous_user_id");
    if (!id) {
      if (typeof window !== "undefined" && window.crypto?.randomUUID) {
        id = window.crypto.randomUUID();
      } else {
        id = "f0000000-0000-0000-0000-000000000000".replace(/[f0]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          return (c === "f" ? r : (r & 0x3) | 0x8).toString(16);
        });
      }
      localStorage.setItem("pune_rent_anonymous_user_id", id);
    }
    setAnonymousUserId(id);
  }, []);


  /** id is always a society UUID coming from PuneMap's onSelect */
  async function selectSociety(id: string) {
    const response = await fetch(`/api/societies/${id}`);
    const data = await response.json();
    if (!response.ok) {
      console.error(data);
      return;
    }
    setIntel(data);
    setSelectedSocietyId(id);
    posthog?.capture("society_sheet_opened", { society_id: id, society_name: data.society_name });
  }

  function handleFilterChange(newFilters: MapFilters) {
    setFilters(newFilters);
    posthog?.capture("filter_applied", { filters: newFilters });
  }

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-neutral-950">
      <Toolbar onOpen={setModal} />
      <FilterBar filters={filters} onChange={handleFilterChange} onSearchSelect={(loc) => {
        setSearchedLocation(loc);
        if (loc) posthog?.capture("search_used", { location: loc.name });
      }} />
      <div className="absolute inset-0 top-12">
        <PuneMap
          filters={filters}
          searchedLocation={searchedLocation}
          refreshKey={refreshKey}
          onPickLocation={(location) => {
            setPickedLocation(location);
            setModal("pin");
          }}
          onSelect={selectSociety}
          onClearFilters={() => setFilters(DEFAULT_FILTERS)}
        />
      </div>

      {intel && modal !== "pin" && (
        <IntelligenceSheet
          data={intel}
          onClose={() => setIntel(null)}
          onReport={() => setModal("report")}
          onVote={async (vote) => {
            const response = await fetch("/api/votes", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                society_key: intel.society_key,
                bachelors_allowed: vote,
                user_id: anonymousUserId,
              }),
            });
            if (!response.ok) {
              const errData = await response.json().catch(() => ({}));
              setToast(errData.error ?? "Failed to record vote");
              return;
            }
            setToast("Bachelor vote recorded");
            if (selectedSocietyId) {
              await selectSociety(selectedSocietyId);
            }
          }}
        />
      )}

      {modal === "stats" && <StatsOverlay onClose={() => setModal(null)} />}
      {modal === "faq" && (
        <SimpleModal title="FAQ" onClose={() => setModal(null)}>
          <p>
            Pune.rent shows estimated and community rent ranges. Use it to spot
            fair rent, deposit expectations, and bachelor-friendliness before a
            visit.
          </p>
          <p className="mt-3">
            Estimated pins stay visible until enough tenant observations improve
            confidence.
          </p>
        </SimpleModal>
      )}
      {modal === "tour" && (
        <SimpleModal title="How to use" onClose={() => setModal(null)}>
          <ol className="list-decimal space-y-2 pl-4">
            <li>Browse Pune society rent pins on the map.</li>
            <li>Tap a pin to open rent range and bachelor score.</li>
            <li>Vote or pin your rent to improve confidence.</li>
          </ol>
        </SimpleModal>
      )}
      {modal === "pin" && (
        <PinRentModal
          prefill={pinPrefill}
          anonymousUserId={anonymousUserId}
          pickedLocation={pickedLocation}
          onClose={() => {
            setModal(null);
            setPinPrefill(null);
          }}
          onCreated={() => {
            setModal(null);
            setPinPrefill(null);
            setRefreshKey((key) => key + 1);
            if (selectedSocietyId) {
              selectSociety(selectedSocietyId);
            }
            setToast("Rent pinned. Map refreshed.");
          }}
        />
      )}
      {modal === "report" && intel?.sample_observation?.id && (
        <ReportModal
          anonymousUserId={anonymousUserId}
          observationId={intel.sample_observation.id}
          onClose={() => setModal(null)}
          onReported={() => {
            setModal(null);
            setToast("Report recorded");
          }}
        />
      )}
      {toast && (
        <div className="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-neutral-950 px-4 py-2 text-sm font-medium text-white shadow-2xl">
          {toast}
          <button
            type="button"
            className="ml-3 text-white/70"
            onClick={() => setToast(null)}
          >
            Dismiss
          </button>
        </div>
      )}
      {filters.areaSlug && <AreaIntelligencePanel areaSlug={filters.areaSlug} />}
    </main>
  );
}

function AreaIntelligencePanel({ areaSlug }: { areaSlug: string }) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/areas/${areaSlug}`)
      .then(res => res.json())
      .then(d => setData(d))
      .catch(console.error);
  }, [areaSlug]);

  if (!data) return null;

  return (
    <div className="absolute bottom-20 left-4 z-40 w-72 rounded-2xl border border-white/10 bg-neutral-950/90 p-4 text-white shadow-2xl backdrop-blur">
      <h3 className="mb-2 text-lg font-bold capitalize">{data.area.replace("-", " ")} Area</h3>
      
      <div className="mb-4 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg bg-white/5 p-2">
          <div className="text-white/50">Median Rent</div>
          <div className="text-lg font-semibold">₹{data.median_rent?.toLocaleString() ?? "—"}</div>
        </div>
        <div className="rounded-lg bg-white/5 p-2">
          <div className="text-white/50">Societies</div>
          <div className="text-lg font-semibold">{data.total_societies}</div>
        </div>
      </div>

      {Object.keys(data.rent_by_bhk || {}).length > 0 && (
        <div className="mb-4 space-y-1 text-sm">
          <div className="text-white/50">Rent by BHK</div>
          {Object.entries(data.rent_by_bhk).map(([bhk, range]: [string, any]) => (
            <div key={bhk} className="flex justify-between border-t border-white/5 pt-1">
              <span>{bhk} BHK</span>
              <span className="font-medium">₹{range.min.toLocaleString()} - ₹{range.max.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}

      {data.bachelor_score !== null && (
        <div className="rounded-lg bg-white/5 p-2 text-sm">
          <div className="flex justify-between">
            <span className="text-white/50">Bachelor Friendly</span>
            <span className="font-semibold">{data.bachelor_score}%</span>
          </div>
          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/10">
            <div 
              className={`h-full ${data.bachelor_score >= 70 ? "bg-green-500" : data.bachelor_score >= 40 ? "bg-yellow-500" : "bg-red-500"}`} 
              style={{ width: `${data.bachelor_score}%` }} 
            />
          </div>
        </div>
      )}
    </div>
  );
}

function FilterBar({
  filters,
  onChange,
  onSearchSelect,
}: {
  filters: MapFilters;
  onChange: (filters: MapFilters) => void;
  onSearchSelect: (location: { lat: number; lng: number; name: string } | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Draft state — holds uncommitted filter selections inside the modal
  const [draft, setDraft] = useState<MapFilters>({ ...filters });

  const hasActiveFilters =
    filters.bhk != null ||
    filters.areaSlug != null ||
    filters.rentMin != null ||
    filters.rentMax != null ||
    filters.furnishing != null ||
    filters.source != null ||
    filters.bachelorOnly === true ||
    filters.gatedOnly === true;

  function openFilters() {
    setDraft({ ...filters }); // Initialize draft from current active filters
    setShowFilters(true);
  }

  function applyAndClose() {
    onChange({ ...draft, bachelorOnly: filters.bachelorOnly }); // Commit draft, keep live bachelorOnly
    setShowFilters(false);
  }

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/v1/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <>
      {/* ── Compact search bar + filter button ─────────────────────────── */}
      <div className="absolute left-1/2 top-14 z-30 flex w-[calc(100%-24px)] max-w-lg -translate-x-1/2 items-center gap-2 rounded-xl border border-white/10 bg-neutral-950/80 p-2 text-xs text-white shadow-2xl backdrop-blur">
        <div className="relative flex-1">
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              if (event.target.value === "") {
                onSearchSelect(null);
              }
            }}
            placeholder="Search neighbourhood or area..."
            className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 placeholder:text-white/55"
          />

          {results.length > 0 && (
            <ul className="absolute left-0 right-0 top-full mt-1 max-h-60 overflow-y-auto rounded-lg border border-white/10 bg-neutral-950 shadow-2xl">
              {results.map((r) => (
                <li key={`${r.type}-${r.id}`}>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left hover:bg-white/10"
                    onClick={() => {
                      onSearchSelect({ lat: r.lat, lng: r.lng, name: r.name });
                      setQuery(r.name);
                      setResults([]);
                      onChange({ ...filters, query: "" });
                    }}
                  >
                    <div className="font-semibold">{r.name}</div>
                    <div className="text-[10px] text-white/50">{r.subtitle}</div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="button"
          onClick={openFilters}
          className="relative flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/10 px-3 py-2 font-semibold hover:bg-white/20 transition-colors"
        >
          <span>☰</span> Filter
          {hasActiveFilters && (
            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-blue-500 ring-2 ring-neutral-950" />
          )}
        </button>
      </div>

      {/* ── Filter modal ───────────────────────────────────────────────── */}
      {showFilters && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:items-center sm:pt-0" onClick={() => setShowFilters(false)}>
          <div
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-neutral-950 p-5 text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Filters</h2>
                <p className="text-xs text-white/50">Customize the way you see pune.rent</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300"
                  onClick={() => {
                    setDraft({ ...DEFAULT_FILTERS, bachelorOnly: filters.bachelorOnly });
                    onChange({ ...DEFAULT_FILTERS, bachelorOnly: filters.bachelorOnly });
                  }}
                >
                  Clear all
                </button>
                <button
                  type="button"
                  onClick={() => setShowFilters(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/60 hover:bg-white/20 text-sm"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* BHK — updates draft */}
            <div className="mb-5">
              <h3 className="mb-2 text-xs font-semibold tracking-wider text-white/50">BEDROOMS (BHK)</h3>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((bhk) => (
                  <button
                    key={bhk}
                    type="button"
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                      draft.bhk === bhk
                        ? "bg-white text-neutral-950"
                        : "bg-white/10 hover:bg-white/20"
                    }`}
                    onClick={() =>
                      setDraft({ ...draft, bhk: draft.bhk === bhk ? null : bhk })
                    }
                  >
                    {bhk}{bhk === 5 ? "+" : ""}
                  </button>
                ))}
              </div>
            </div>

            {/* Rent range — updates draft */}
            <div className="mb-5">
              <h3 className="mb-2 text-xs font-semibold tracking-wider text-white/50">RENT RANGE (₹/MONTH)</h3>
              <div className="flex items-center gap-2">
                <input
                  value={draft.rentMin ?? ""}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      rentMin: event.target.value ? Number(event.target.value) : null,
                    })
                  }
                  type="number"
                  placeholder="Min"
                  className="w-full min-w-0 flex-1 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm placeholder:text-white/40"
                />
                <span className="text-white/30">to</span>
                <input
                  value={draft.rentMax ?? ""}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      rentMax: event.target.value ? Number(event.target.value) : null,
                    })
                  }
                  type="number"
                  placeholder="Max"
                  className="w-full min-w-0 flex-1 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm placeholder:text-white/40"
                />
              </div>
            </div>

            {/* Neighbourhood — updates draft */}
            <div className="mb-5">
              <h3 className="mb-2 text-xs font-semibold tracking-wider text-white/50">NEIGHBOURHOOD</h3>
              <select
                value={draft.areaSlug ?? ""}
                onChange={(event) =>
                  setDraft({ ...draft, areaSlug: event.target.value || null })
                }
                className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2.5 text-sm"
              >
                <option value="">All Pune</option>
                {PHASE1_AREAS.map((area) => (
                  <option key={area.slug} value={area.slug}>
                    {area.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Furnishing — updates draft */}
            <div className="mb-5">
              <h3 className="mb-2 text-xs font-semibold tracking-wider text-white/50">FURNISHING</h3>
              <div className="flex gap-2">
                {([
                  { value: "unfurnished", label: "Unfurnished" },
                  { value: "semi", label: "Semi" },
                  { value: "fully", label: "Furnished" },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                      draft.furnishing === opt.value
                        ? "bg-white text-neutral-950"
                        : "bg-white/10 hover:bg-white/20"
                    }`}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        furnishing: draft.furnishing === opt.value ? null : opt.value,
                      })
                    }
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Source — updates draft */}
            <div className="mb-5">
              <h3 className="mb-2 text-xs font-semibold tracking-wider text-white/50">SOURCE</h3>
              <div className="flex gap-2">
                {([
                  { value: "admin", label: "Estimated" },
                  { value: "community", label: "Community" },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                      draft.source === opt.value
                        ? "bg-white text-neutral-950"
                        : "bg-white/10 hover:bg-white/20"
                    }`}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        source: draft.source === opt.value ? null : (opt.value as MapFilters["source"]),
                      })
                    }
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Bachelor Friendly — applies LIVE */}
            <div className="mb-4">
              <button
                type="button"
                className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                  filters.bachelorOnly
                    ? "bg-white text-neutral-950"
                    : "bg-white/10 hover:bg-white/20"
                }`}
                onClick={() =>
                  onChange({ ...filters, bachelorOnly: !filters.bachelorOnly })
                }
              >
                🎓 Bachelor Friendly Only
              </button>
            </div>

            {/* Done Button — commits draft to real filters */}
            <div>
              <button
                type="button"
                onClick={applyAndClose}
                className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-blue-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SimpleModal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" onClick={onClose}>
      <section className="w-full max-w-sm rounded-2xl border border-white/10 bg-neutral-950 p-5 text-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button type="button" onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/60 hover:bg-white/20 text-sm">
            ✕
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function StatsOverlay({ onClose }: { onClose: () => void }) {
  const [areas, setAreas] = useState<
    { slug: string; by_bhk: Record<string, { median: number; n: number } | null> }[]
  >([]);

  useEffect(() => {
    fetch("/api/stats")
      .then((response) => response.json())
      .then((data) => setAreas(data.areas ?? []))
      .catch(console.error);
  }, []);

  return (
    <SimpleModal title="Live Stats" onClose={onClose}>
      <ul className="space-y-2">
        {areas.map((area) => (
          <li
            key={area.slug}
            className="flex justify-between gap-3 border-b border-white/10 py-1"
          >
            <span className="capitalize">{area.slug.replace("-", " ")}</span>
            <span className="text-white/60">
              2BHK median Rs {area.by_bhk["2"]?.median ?? "-"} (n=
              {area.by_bhk["2"]?.n ?? 0})
            </span>
          </li>
        ))}
        {!areas.length && <li className="text-white/50">Loading...</li>}
      </ul>
    </SimpleModal>
  );
}

function PinRentModal({
  prefill,
  anonymousUserId,
  pickedLocation,
  onClose,
  onCreated,
}: {
  prefill?: { society_name: string; area_slug: string; lat: number; lng: number } | null;
  anonymousUserId: string;
  pickedLocation: { lat: number; lng: number } | null;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [confirmOutlier, setConfirmOutlier] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const payload = {
      society_name: String(form.get("society_name") ?? ""),
      area_slug: String(form.get("area_slug") ?? ""),
      lat: Number(form.get("lat")),
      lng: Number(form.get("lng")),
    };

    if (!payload.lat || !payload.lng) {
      setError("Please right-click on the map to set a location pin first.");
      setSubmitting(false);
      return;
    }

    Object.assign(payload, {
      lat: Number(form.get("lat")),
      lng: Number(form.get("lng")),
      bhk: Number(form.get("bhk")),
      rent_inr: Number(form.get("rent_inr")),
      furnishing: form.get("furnishing"),
      deposit_months: form.get("deposit_months")
        ? Number(form.get("deposit_months"))
        : undefined,
      maintenance_inr: form.get("maintenance_inr")
        ? Number(form.get("maintenance_inr"))
        : undefined,
      is_gated: form.get("is_gated") === "on",
      comment: String(form.get("comment") ?? "") || undefined,
      confirm_outlier: confirmOutlier,
      user_id: anonymousUserId,
    });

    const response = await fetch("/api/pins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    setSubmitting(false);

    if (response.status === 409 && data.needs_confirm) {
      setConfirmOutlier(true);
      setError(data.message ?? "This rent looks unusual. Submit again to confirm.");
      return;
    }
    if (!response.ok) {
      const err = data.error;
      if (typeof err === "string") {
        setError(err);
      } else if (err?.formErrors?.[0]) {
        setError(err.formErrors[0]);
      } else if (err?.fieldErrors) {
        const firstField = Object.keys(err.fieldErrors)[0];
        setError(`${firstField}: ${err.fieldErrors[firstField][0]}`);
      } else {
        setError("Validation failed. Please check your inputs.");
      }
      return;
    }

    onCreated();
  }

  return (
    <SimpleModal title="Pin my rent" onClose={onClose}>
      <form className="space-y-3" onSubmit={submit}>
        {prefill ? (
          <>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white/70">
              Pinning rent at <strong>{prefill.society_name}</strong>
            </div>
            <input type="hidden" name="society_name" value={prefill.society_name} />
            <input type="hidden" name="area_slug" value={prefill.area_slug} />
            <input type="hidden" name="lat" value={prefill.lat} />
            <input type="hidden" name="lng" value={prefill.lng} />
          </>
        ) : (
          <>
            <input name="society_name" required placeholder="Society name" className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm placeholder:text-white/40" />
            <select name="area_slug" required className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white [&>option]:text-black">
              <option value="">Area</option>
              {PHASE1_AREAS.map((area) => (
                <option key={area.slug} value={area.slug}>{area.name}</option>
              ))}
            </select>
            <input type="hidden" name="lat" value={pickedLocation?.lat ?? ""} />
            <input type="hidden" name="lng" value={pickedLocation?.lng ?? ""} />
          </>
        )}
        <div className="grid grid-cols-2 gap-2">
          <select name="bhk" required className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white [&>option]:text-black">
            {[1, 2, 3, 4, 5].map((bhk) => <option key={bhk} value={bhk}>{bhk} BHK</option>)}
          </select>
          <input name="rent_inr" required type="number" min="1" placeholder="Rent / month" className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm placeholder:text-white/40" />
        </div>
        <select name="furnishing" required className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white [&>option]:text-black">
          <option value="semi">Semi furnished</option>
          <option value="fully">Fully furnished</option>
          <option value="unfurnished">Unfurnished</option>
        </select>
        <div className="grid grid-cols-2 gap-2">
          <input name="deposit_months" type="number" step="0.5" placeholder="Deposit months" className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm placeholder:text-white/40" />
          <input name="maintenance_inr" type="number" placeholder="Maintenance" className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm placeholder:text-white/40" />
        </div>
        <label className="flex items-center gap-2 text-sm text-white/80">
          <input name="is_gated" type="checkbox" className="rounded border-white/10 bg-white/10" />
          <span>Gated society</span>
        </label>
        <textarea name="comment" maxLength={500} placeholder="Optional tenant note" className="min-h-20 w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm placeholder:text-white/40" />
        {error && <p className="rounded-lg border border-amber-900/50 bg-amber-900/30 p-2 text-sm text-amber-200">{error}</p>}
        <button disabled={submitting} className="w-full rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-blue-700 disabled:opacity-60">
          {submitting ? "Submitting..." : confirmOutlier ? "Confirm and pin rent" : "Pin rent"}
        </button>
      </form>
    </SimpleModal>
  );
}

function ReportModal({
  anonymousUserId,
  observationId,
  onClose,
  onReported,
}: {
  anonymousUserId: string;
  observationId: string;
  onClose: () => void;
  onReported: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        observation_id: observationId,
        reason: String(form.get("reason") ?? ""),
        user_id: anonymousUserId,
      }),
    });
    const data = await response.json();
    setSubmitting(false);
    if (!response.ok) {
      setError(data.error ?? "Could not record report");
      return;
    }
    onReported();
  }

  return (
    <SimpleModal title="Report pin" onClose={onClose}>
      <form className="space-y-3" onSubmit={submit}>
        <textarea
          name="reason"
          required
          minLength={3}
          maxLength={300}
          className="min-h-28 w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm placeholder:text-white/40"
          placeholder="What looks wrong? Example: rent is outdated, wrong society, duplicate pin..."
        />
        {error && <p className="rounded-lg border border-red-900/50 bg-red-900/30 p-2 text-sm text-red-200">{error}</p>}
        <button disabled={submitting} className="w-full rounded-lg bg-red-600 px-3 py-2.5 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-red-700 disabled:opacity-60">
          {submitting ? "Reporting..." : "Submit report"}
        </button>
      </form>
    </SimpleModal>
  );
}
