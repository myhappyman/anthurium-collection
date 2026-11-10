import { z } from "zod";

const supabaseConfigSchema = z.object({
  url: z.url(),
  publishableKey: z.string().min(1),
});

export type SupabaseConfig = z.infer<typeof supabaseConfigSchema>;

export function getSupabaseConfig(): SupabaseConfig | null {
  const result = supabaseConfigSchema.safeParse({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });

  return result.success ? result.data : null;
}

export function requireSupabaseConfig(): SupabaseConfig {
  const config = getSupabaseConfig();

  if (!config) {
    throw new Error(
      "Supabase 환경 변수가 없습니다. .env.example을 참고해 프로젝트 URL과 공개 키를 설정하세요.",
    );
  }

  return config;
}
