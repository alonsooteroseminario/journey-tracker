/**
 * UTM capture.
 *
 * The bio link is the campaign's only acquisition path, so without this the
 * metrics sheet can never answer which post earned an address. Params are read
 * once on arrival and kept for the session, because the visitor usually lands
 * on `/` and subscribes several clicks later, by which point the query string
 * is long gone.
 *
 * Bio link format:
 *   https://buildcadence.co/?utm_source=instagram&utm_medium=bio
 * Story or per-post link, so a single post can be attributed:
 *   https://buildcadence.co/?utm_source=instagram&utm_medium=story&utm_content=post-03
 */

const KEY = "bc_attribution";

export type Attribution = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  referrer?: string;
};

/**
 * Reads UTM params off the current URL and stores them if present. First touch
 * wins: a visitor who arrives from a post and later navigates internally keeps
 * the post that brought them.
 */
export function captureAttribution(): void {
  if (typeof window === "undefined") return;
  try {
    if (sessionStorage.getItem(KEY)) return;

    const q = new URLSearchParams(window.location.search);
    const found: Attribution = {
      utmSource: q.get("utm_source") ?? undefined,
      utmMedium: q.get("utm_medium") ?? undefined,
      utmCampaign: q.get("utm_campaign") ?? undefined,
      utmContent: q.get("utm_content") ?? undefined,
      referrer: document.referrer || undefined,
    };

    // Nothing to attribute and no referrer means a direct visit; storing an
    // empty object would only block a later tagged arrival in the same session.
    if (!Object.values(found).some(Boolean)) return;

    sessionStorage.setItem(KEY, JSON.stringify(found));
  } catch {
    // Private mode and blocked storage are not worth failing a page render over.
  }
}

export function readAttribution(): Attribution {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? "{}") as Attribution;
  } catch {
    return {};
  }
}
