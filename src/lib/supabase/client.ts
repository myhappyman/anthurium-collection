"use client";

import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types/database.types";

import { requireSupabaseConfig } from "./config";

export function createClient() {
  const config = requireSupabaseConfig();

  return createBrowserClient<Database>(config.url, config.publishableKey);
}
