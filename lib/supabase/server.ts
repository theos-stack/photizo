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
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
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
