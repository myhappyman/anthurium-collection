import { z } from "zod";

const siteUrlSchema = z.url();

export function getSiteOrigin() {
  const explicitUrl = siteUrlSchema.safeParse(
    process.env.NEXT_PUBLIC_SITE_URL,
  );

  if (explicitUrl.success) {
    return explicitUrl.data.replace(/\/$/, "");
  }

  const vercelHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;

  if (!vercelHost) {
    return null;
  }

  const vercelUrl = siteUrlSchema.safeParse(`https://${vercelHost}`);
  return vercelUrl.success ? vercelUrl.data.replace(/\/$/, "") : null;
}
