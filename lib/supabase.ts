import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

let client: ReturnType<typeof createSupabaseClient<Database>> | null = null;

export function hasSupabaseConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

const supabaseFetch: typeof fetch = async (input, init) => {
  try {
    return await fetch(input, init);
  } catch (error) {
    if (error instanceof TypeError) {
      return new Response(
        JSON.stringify({ message: "Supabase request failed" }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    throw error;
  }
};

export function createClient() {
  if (client) return client;

  if (!hasSupabaseConfig()) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  client = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: supabaseFetch,
      },
    }
  );

  return client;
}
