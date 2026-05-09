"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getSupabasePublishableKey, getSupabaseUrl, hasSupabaseEnv } from "./shared";

export function getBrowserSupabaseClient() {
  if (!hasSupabaseEnv()) {
    return null;
  }

  return createBrowserClient(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
  );
}
