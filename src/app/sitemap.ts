import type { MetadataRoute } from "next";

const SITE = "https://buildcadence.co";

/**
 * Only public, canonical, indexable URLs. `/wallet` is deliberately absent:
 * it is public but canonicals to `/`, so listing it would ask Google to index
 * a duplicate.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const updated = new Date("2026-09-04");
  return [
    { url: SITE, lastModified: updated, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/how-to-organize-ai-prompts`, lastModified: updated, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE}/prompt-library-vs-chat-history`, lastModified: updated, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE}/prompt-manager-alternatives`, lastModified: updated, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE}/prompt-pack`, lastModified: updated, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE}/marketplace`, lastModified: updated, changeFrequency: "weekly", priority: 0.5 },
  ];
}
