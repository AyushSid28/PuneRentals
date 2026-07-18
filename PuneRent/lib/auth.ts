import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Returns authenticated user id if session exists, else null */
export async function getUserId(): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const cookieStore = await cookies();
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        // no-op in route handlers when not mutating cookies
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}
