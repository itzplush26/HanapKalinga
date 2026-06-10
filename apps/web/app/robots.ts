import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://hanapkalinga.com";

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl.replace(/\/$/, "");

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/", "/admin/", "/api/", "/login", "/register"]
    },
    sitemap: `${base}/sitemap.xml`
  };
}
