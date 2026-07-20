export function EmptyState({ 
  onClearFilters 
}: { 
  onClearFilters?: () => void 
}) {
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 w-80 rounded-2xl border border-white/10 bg-neutral-950/90 p-6 text-center text-white shadow-2xl backdrop-blur">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-2xl">
        🏜️
      </div>
      <h3 className="mb-2 text-xl font-bold">No societies found</h3>
      <p className="mb-4 text-sm text-white/70">
        We couldn&apos;t find any flats matching your exact filters.
      </p>
      
      <div className="mb-6 text-sm text-left bg-white/5 rounded-xl p-4">
        <div className="font-semibold text-white/90 mb-3">Suggestions:</div>
        <ul className="list-disc pl-4 space-y-1 text-white/70">
          <li>Increase your rent budget</li>
          <li>Remove Bachelor Friendly filter</li>
          <li>Try another area</li>
        </ul>
      </div>

      {onClearFilters && (
        <button
          onClick={onClearFilters}
          className="w-full rounded-xl bg-white text-neutral-950 py-3 font-bold hover:bg-neutral-200 transition-colors"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}
