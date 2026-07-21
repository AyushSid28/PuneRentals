import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing Supabase env vars");
  process.exit(1);
}
const supabase = createClient(url, key);

async function main() {
  const { data, error } = await supabase.from("societies").select("id, name, lat, lng, area_slug");
  if (error) {
    console.error("Error fetching societies:", error);
    process.exit(1);
  }
  console.log(JSON.stringify(data, null, 2));
}

main();
