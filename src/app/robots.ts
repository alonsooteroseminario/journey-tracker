import type { MetadataRoute } from "next";

const SITE = "https://buildcadence.co";

/**
 * The app surface is auth-gated and has nothing to rank, so it is disallowed
 * outright rather than left for Googlebot to crawl and bounce off a sign-in
 * redirect. `/wallet` is public but canonicals to `/`, so it stays crawlable.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/admin",
        "/admin/",
        "/board",
        "/goals",
        "/feed",
        "/friends",
        "/profile",
        "/templates",
        "/cost-tracker",
        "/settings/",
        "/sign-in",
        "/sign-up",
      ],
    },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
