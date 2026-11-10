import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "@/types/database.types";

import { requireSupabaseConfig } from "./config";

export async function createClient() {
  const config = requireSupabaseConfig();
  const cookieStore = await cookies();

  return createServerClient<Database>(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Component에서는 쿠키 쓰기가 허용되지 않는다.
          // proxy.ts가 세션 갱신 쿠키를 처리한다.
        }
      },
    },
  });
}
