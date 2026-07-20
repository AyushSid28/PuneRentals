"use client";

export function Toolbar({
  onOpen,
}: {
  onOpen: (m: "stats" | "faq" | "tour" | "pin" | null) => void;
}) {
  return (
    <header className="absolute inset-x-0 top-0 z-40 flex h-12 items-center gap-2 border-b border-neutral-200 bg-white/95 px-3 backdrop-blur">
      <span className="mr-2 text-sm font-semibold tracking-tight">Pune.rent</span>
      <button
        type="button"
        onClick={() => onOpen("pin")}
        className="rounded-md px-3 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors"
      >
        + Pin my rent
      </button>
      <button
        type="button"
        onClick={() => onOpen("tour")}
        className="rounded-md px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-100"
      >
        How to use
      </button>
      <button
        type="button"
        onClick={() => onOpen("stats")}
        className="rounded-md px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-100"
      >
        Live Stats
      </button>
      <button
        type="button"
        onClick={() => onOpen("faq")}
        className="rounded-md px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-100"
      >
        FAQ
      </button>
    </header>
  );
}
