import { seedObservations } from "@/lib/data/pins";
import { hasSupabase, supabaseAdmin } from "@/lib/db/client";

async function main() {
  const rows = seedObservations();

  if (!hasSupabase()) {
    console.log(
      `Loaded ${rows.length} local seed rows. Supabase env is not configured.`
    );
    return;
  }

  const { error } = await supabaseAdmin().from("rent_observations").upsert(rows, {
    onConflict: "id",
  });

  if (error) throw new Error(error.message);
  console.log(`Seeded ${rows.length} rent observations.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
