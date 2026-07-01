import type { MetadataRoute } from "next";
import { createServiceClient } from "@/lib/supabase/service";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://hanapkalinga.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl.replace(/\/$/, "");

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/nurses`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/login`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/register`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/terms`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/privacy`, changeFrequency: "monthly", priority: 0.3 }
  ];

  let nursePages: MetadataRoute.Sitemap = [];

  try {
    const service = createServiceClient();
    const { data: nurses } = await service
      .from("nurses")
      .select("id, profile_slug, updated_at, verified_at")
      .in("verification_status", ["verified", "renewal_under_review"]);

    nursePages =
      nurses?.map((nurse) => {
        const slug = nurse.profile_slug?.trim() || nurse.id;
        const lastModified = nurse.updated_at ?? nurse.verified_at ?? undefined;
        return {
          url: `${base}/nurses/${slug}`,
          lastModified: lastModified ? new Date(lastModified) : undefined,
          changeFrequency: "weekly" as const,
          priority: 0.8
        };
      }) ?? [];
  } catch (error) {
    console.error("[sitemap] failed to load nurse profiles", error);
  }

  return [...staticPages, ...nursePages];
}
