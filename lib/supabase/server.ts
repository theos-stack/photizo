import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import {
  getSupabasePublishableKey,
  getSupabaseServiceKey,
  getSupabaseUrl,
  hasSupabaseEnv,
  hasSupabaseServiceRole,
} from "./shared";

export async function getServerSupabaseClient() {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Components cannot write cookies. The root proxy refreshes
            // auth cookies on requests; Route Handlers may still write them.
          }
        },
      },
    },
  );
}

export function getServiceSupabaseClient() {
  if (!hasSupabaseServiceRole()) {
    return null;
  }

  return createServerClient(
    getSupabaseUrl(),
    getSupabaseServiceKey(),
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {},
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
