"use client";

import { useEffect, useState } from "react";
import PuneMap from "@/components/PuneMap";
import { IntelligenceSheet } from "@/components/sheets/IntelligenceSheet";
import { Toolbar } from "@/components/toolbar/Toolbar";
import { PHASE1_AREAS } from "@/lib/constants";
import { DEFAULT_FILTERS, type MapFilters } from "@/models/filters";
import type { IntelligencePayload } from "@/models/pin";

type Modal = "stats" | "faq" | "tour" | "pin" | "report" | null;

export default function Home() {
  const [intel, setIntel] = useState<IntelligencePayload | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [filters, setFilters] = useState<MapFilters>(DEFAULT_FILTERS);
  const [refreshKey, setRefreshKey] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [pickedLocation, setPickedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isPickingLocation, setIsPickingLocation] = useState(false);
  const [searchedLocation, setSearchedLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);


  async function selectPin(id: string) {
    const response = await fetch(`/api/pins/${id}`);
    const data = await response.json();
    if (!response.ok) {
      console.error(data);
      return;
    }
    setIntel(data);
  }

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-neutral-950">
      <Toolbar onOpen={setModal} />
      <FilterBar filters={filters} onChange={setFilters} onSearchSelect={setSearchedLocation} />
      <div className="absolute inset-0 top-12">
        <PuneMap
          filters={filters}
          searchedLocation={searchedLocation}
          isPickingLocation={isPickingLocation}
          refreshKey={refreshKey}
          onPickLocation={(location) => {
            setPickedLocation(location);
            setIsPickingLocation(false);
            setModal("pin");
            setToast("Location selected");
          }}
          onSelect={selectPin}
        />
      </div>

      {intel && (
        <IntelligenceSheet
          data={intel}
          onClose={() => setIntel(null)}
          onPinRent={() => setModal("pin")}
          onReport={() => setModal("report")}
          onVote={async (vote) => {
            const response = await fetch("/api/votes", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                society_key: intel.society_key,
                bachelors_allowed: vote,
              }),
            });
            if (!response.ok) {
              setToast("Vote needs real auth before it can save to Supabase");
              return;
            }
            setToast("Bachelor vote recorded");
            if (intel.sample_observation?.id) {
              await selectPin(intel.sample_observation.id);
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
          pickedLocation={pickedLocation}
          onClose={() => setModal(null)}
          onStartPickLocation={() => {
            setModal(null);
            setIsPickingLocation(true);
            setToast("Click the map where this society is located");
          }}
          onCreated={() => {
            setModal(null);
            setRefreshKey((key) => key + 1);
            setToast("Rent pinned. Map refreshed.");
          }}
        />
      )}
      {modal === "report" && intel?.sample_observation?.id && (
        <ReportModal
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
    </main>
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
    }, 400); // Wait 400ms after user stops typing
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="absolute left-3 right-3 top-14 z-30 flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-neutral-950/80 p-2 text-xs text-white shadow-2xl backdrop-blur sm:left-auto">
      <div className="relative min-w-52 flex-1 sm:flex-none">
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            if (event.target.value === "") {
              onSearchSelect(null);
            }
          }}
          placeholder="Search society or landmark..."
          className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 placeholder:text-white/55"
        />

        {/* Dropdown Menu */}
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

      <select
        value={filters.areaSlug ?? ""}
        onChange={(event) =>
          onChange({ ...filters, areaSlug: event.target.value || null })
        }
        className="rounded-lg border border-white/10 bg-white/10 px-2 py-2"
      >
        <option value="">All areas</option>
        {PHASE1_AREAS.map((area) => (
          <option key={area.slug} value={area.slug}>
            {area.name}
          </option>
        ))}
      </select>
      {[1, 2, 3].map((bhk) => (
        <button
          key={bhk}
          type="button"
          className={`rounded-lg px-3 py-2 font-semibold ${filters.bhk === bhk ? "bg-white text-neutral-950" : "bg-white/10"
            }`}
          onClick={() =>
            onChange({ ...filters, bhk: filters.bhk === bhk ? null : bhk })
          }
        >
          {bhk}BHK
        </button>
      ))}
      <select
        value={filters.source ?? ""}
        onChange={(event) =>
          onChange({
            ...filters,
            source: (event.target.value || null) as MapFilters["source"],
          })
        }
        className="rounded-lg border border-white/10 bg-white/10 px-2 py-2"
      >
        <option value="">All sources</option>
        <option value="admin">Estimated</option>
        <option value="community">Community</option>
      </select>
      <input
        value={filters.rentMin ?? ""}
        onChange={(event) =>
          onChange({
            ...filters,
            rentMin: event.target.value ? Number(event.target.value) : null,
          })
        }
        type="number"
        placeholder="Min rent"
        className="w-24 rounded-lg border border-white/10 bg-white/10 px-2 py-2 placeholder:text-white/55"
      />
      <input
        value={filters.rentMax ?? ""}
        onChange={(event) =>
          onChange({
            ...filters,
            rentMax: event.target.value ? Number(event.target.value) : null,
          })
        }
        type="number"
        placeholder="Max rent"
        className="w-24 rounded-lg border border-white/10 bg-white/10 px-2 py-2 placeholder:text-white/55"
      />
      <button
        type="button"
        className="rounded-lg bg-white/10 px-3 py-2 font-semibold"
        onClick={() => onChange(DEFAULT_FILTERS)}
      >
        Reset
      </button>
    </div>
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center">
      <section className="w-full max-w-md rounded-xl bg-white p-4 text-sm text-neutral-700 shadow-2xl">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-neutral-950">{title}</h2>
          <button type="button" onClick={onClose} className="text-neutral-500">
            Close
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
            className="flex justify-between gap-3 border-b border-neutral-100 py-1"
          >
            <span className="capitalize">{area.slug.replace("-", " ")}</span>
            <span className="text-neutral-600">
              2BHK median Rs {area.by_bhk["2"]?.median ?? "-"} (n=
              {area.by_bhk["2"]?.n ?? 0})
            </span>
          </li>
        ))}
        {!areas.length && <li className="text-neutral-500">Loading...</li>}
      </ul>
    </SimpleModal>
  );
}

function PinRentModal({
  pickedLocation,
  onClose,
  onCreated,
  onStartPickLocation,
}: {
  pickedLocation: { lat: number; lng: number } | null;
  onClose: () => void;
  onCreated: () => void;
  onStartPickLocation: () => void;
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
    };

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
        <input name="society_name" required placeholder="Society name" className="w-full rounded-lg border px-3 py-2" />
        <select name="area_slug" required className="w-full rounded-lg border px-3 py-2">
          <option value="">Area</option>
          {PHASE1_AREAS.map((area) => (
            <option key={area.slug} value={area.slug}>{area.name}</option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <input name="lat" required type="number" step="0.000001" defaultValue={pickedLocation?.lat ?? ""} placeholder="Latitude" className="rounded-lg border px-3 py-2" />
          <input name="lng" required type="number" step="0.000001" defaultValue={pickedLocation?.lng ?? ""} placeholder="Longitude" className="rounded-lg border px-3 py-2" />
          <select name="bhk" required className="rounded-lg border px-3 py-2">
            {[1, 2, 3, 4, 5].map((bhk) => <option key={bhk} value={bhk}>{bhk} BHK</option>)}
          </select>
          <input name="rent_inr" required type="number" min="1" placeholder="Rent / month" className="rounded-lg border px-3 py-2" />
        </div>
        <button type="button" onClick={onStartPickLocation} className="w-full rounded-lg border border-neutral-300 px-3 py-2 font-semibold text-neutral-700">
          Pick location on map
        </button>
        <select name="furnishing" required className="w-full rounded-lg border px-3 py-2">
          <option value="semi">Semi furnished</option>
          <option value="fully">Fully furnished</option>
          <option value="unfurnished">Unfurnished</option>
        </select>
        <div className="grid grid-cols-2 gap-2">
          <input name="deposit_months" type="number" step="0.5" placeholder="Deposit months" className="rounded-lg border px-3 py-2" />
          <input name="maintenance_inr" type="number" placeholder="Maintenance" className="rounded-lg border px-3 py-2" />
        </div>
        <label className="flex items-center gap-2">
          <input name="is_gated" type="checkbox" />
          <span>Gated society</span>
        </label>
        <textarea name="comment" maxLength={500} placeholder="Optional tenant note" className="min-h-20 w-full rounded-lg border px-3 py-2" />
        {error && <p className="rounded-lg bg-amber-50 p-2 text-amber-900">{error}</p>}
        <button disabled={submitting} className="w-full rounded-lg bg-neutral-950 px-3 py-2 font-semibold text-white disabled:opacity-60">
          {submitting ? "Submitting..." : confirmOutlier ? "Confirm and pin rent" : "Pin rent"}
        </button>
      </form>
    </SimpleModal>
  );
}

function ReportModal({
  observationId,
  onClose,
  onReported,
}: {
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
          className="min-h-28 w-full rounded-lg border px-3 py-2"
          placeholder="What looks wrong? Example: rent is outdated, wrong society, duplicate pin..."
        />
        {error && <p className="rounded-lg bg-red-50 p-2 text-red-700">{error}</p>}
        <button disabled={submitting} className="w-full rounded-lg bg-neutral-950 px-3 py-2 font-semibold text-white disabled:opacity-60">
          {submitting ? "Reporting..." : "Submit report"}
        </button>
      </form>
    </SimpleModal>
  );
}
