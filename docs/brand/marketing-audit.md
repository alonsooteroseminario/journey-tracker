# Marketing and SEO audit

Run 2026-09-04 against `prompt-wallet-launch.md`, the live site, and the repo.
Framework from the `marketing-skills` pack (`seo-audit`, `product-marketing`).
Every finding below is evidenced from the codebase, not inferred.

The plan is good. The gaps are not in the plan's content, they are in what the
plan does not cover: everything downstream of the click.

---

## P0. `/` and `/wallet` are duplicate content — FIXED 2026-09-04

**Evidence:** `src/app/page.tsx:29` and `src/app/wallet/page.tsx:20` both return
`<LandingPage />` for a signed-out visitor. `/` canonicals to `/`
(`page.tsx:22`). `/wallet` declares no canonical and no robots directive.

**Impact:** Google indexes two URLs with identical HTML and chooses the winner
itself. It may pick `/wallet`, which is the wrong page to rank and the wrong one
to earn links.

**Cause:** introduced 2026-09-04 when `/wallet` was made public so signed-out
visitors see the landing page instead of a sign-in wall. That behaviour is
correct and should stay; only the canonical is missing.

**Fixed:** `src/app/wallet/page.tsx` now declares `alternates: { canonical: "/" }`
and carries a real title instead of the 13-character placeholder.

---

## P1. Every share of the link renders with no preview image — FIXED 2026-09-04

**Evidence:** no `src/app/opengraph-image.tsx`, no `twitter-image.tsx`, no
`openGraph` key in either metadata block.

**Impact:** this is the highest-value miss on the site. The campaign's only
acquisition path is Instagram bio to `buildcadence.co`. Every DM of that link,
every Slack paste, every X post renders as a bare grey box. The one place the
product gets shared person to person is the one place it looks unfinished.

**Fixed:** `src/app/opengraph-image.tsx` renders a 1200x630 card from
`src/lib/social/ogImage.tsx`, in the carousel palette and Barlow, with the app
mark. `layout.tsx` declares `twitter: { card: "summary_large_image" }`, without
which X falls back to a small square thumbnail.

One trap worth recording: the documented Next pattern
`fetch(new URL('./font.ttf', import.meta.url))` fails the production build with
`TypeError: fetch failed / not implemented... yet` because Node's undici cannot
fetch a `file:` URL. Read the asset with `fs` off `fileURLToPath(new URL(...))`
instead — the tracer still follows the literal URL into the bundle.

---

## P2. Nine posts of reach with nowhere to capture — FIXED 2026-09-04

**Evidence:** `src/app/api/email-subscribe` does not exist. No lead magnet in
`docs/brand` or `src/components`. No `utm_` handling anywhere in `src/`. No
analytics or pixel in `layout.tsx` or `AppShell.tsx`.

**Impact:** the whole funnel is Instagram, profile, bio link, sign-up. A visitor
who is interested but not ready to create an account leaves no trace and cannot
be reached again. The account rents its audience from Instagram and banks
nothing. If reach disappoints after 9 posts, there is nothing to fall back on.

This is the largest strategic gap in the plan and the cheapest to close.

**Fixed:**

- **The lead magnet** is post 02's seven prompts, in `src/lib/social/promptPack.ts`
  so the page, the email and the article never drift apart. Giving them away
  costs nothing that was not already being given away on 2026-09-07.
- **`POST /api/email-subscribe`** writes an `EmailSubscriber` row and then, best
  effort, syncs to a Resend audience and sends the pack. Prisma is the source of
  truth so a missing `RESEND_AUDIENCE_ID` loses a broadcast contact, never a
  subscriber; rows are replayable on `syncedToESP: false`.
- **`EmailCapture`** sits on the landing page above the closing CTA and at the
  foot of every article. It only claims "check your inbox" when the send
  actually succeeded, and always links to `/prompt-pack` so nobody gives an
  address and gets nothing.
- **UTM capture** in `src/lib/utm.ts`, first-touch, held in `sessionStorage`
  because visitors land on `/` and subscribe several clicks later.

**Still needs you:** set `RESEND_AUDIENCE_ID` in Vercel (create an audience in
Resend first). Until then addresses are captured and the pack still sends; they
just are not on a broadcast list.

**Bio link to use from post 03 onward:**

```
https://buildcadence.co/?utm_source=instagram&utm_medium=bio
https://buildcadence.co/?utm_source=instagram&utm_medium=story&utm_content=post-03
```

---

## P3. The plan has no search surface at all — FIXED 2026-09-04

**Evidence:** no `/blog`, `/learn` or `/guides` route. No comparison or
alternative pages. No `robots.ts`, no `sitemap.ts`.

**Impact:** the campaign is 100% social, 0% search, for a problem people actively
search. "how to organize chatgpt prompts", "prompt manager", "notion prompt
library" and "chatgpt prompt template" are all typed by exactly the audience in
`about-me.md`. Social reach stops the moment posting stops. Search compounds.

The `seo-audit` framework flags this as the standard SaaS failure: no comparison
pages, no glossary, no educational content connected to the product.

**Fixed:** four public pages, all sharing `components/marketing/ArticlePage.tsx`
and all ending in the same capture form, so search traffic feeds the same list
the bio link does.

| Page | Intent |
|---|---|
| `/how-to-organize-ai-prompts` | informational, top of funnel, the four-part method |
| `/prompt-library-vs-chat-history` | comparison, the mechanism behind the problem |
| `/prompt-manager-alternatives` | commercial, five honest options including doing nothing |
| `/prompt-pack` | the lead magnet, readable without an account |

Plus `robots.ts` (app surface disallowed, sitemap referenced) and `sitemap.ts`
(`/wallet` deliberately absent, since it canonicals to `/`).

Two things this needed that were not obvious. The routes must be added to
`isPublicRoute` in `middleware.ts` or Clerk redirects the crawler to sign-in.
And they must be added to `NO_HEADER_PREFIXES` in `HeaderHost.tsx`, or the app
header stacks on top of the marketing nav each page already carries.

**Known limitation:** the pages render dynamically (`ƒ`) rather than statically,
because the root layout calls `getCurrentUser()` on every request. It costs
TTFB, not indexability. Making them static means restructuring the layout.

---

## P4. On-page issues, ranked

| Issue | Evidence | Impact | Fix |
|---|---|---|---|
| Root title 32 chars | `layout.tsx:11` "Cadence — Set your daily cadence" | Med | 50-60 chars, lead with the category term |
| `/` description 119 chars | `page.tsx:20` | Low | Extend to 150-160 |
| `/wallet` title 13 chars | `wallet/page.tsx:7` | Low | Now a public page, deserves a real title |
| No JSON-LD anywhere | `grep application/ld+json` returns nothing | Med | `SoftwareApplication` schema on `/` |
| No `manifest.json` | middleware matcher excludes `webmanifest` but no file exists | Low | Add, or drop the matcher exclusion |
| Raw `<img>`, no `next/image` | `LandingPage.tsx:49,216` | Med | LCP and WebP on the only page that matters |
| Em dashes in both titles | `layout.tsx`, `page.tsx` | Low | `voice.md` bans them in 9 of 9 samples. The site does not follow the brand's own rule |

Alt text is present on both landing page images. Heading structure is correct:
one H1, four H2, three H3, no skipped levels.

---

## P5. Plan-level gaps

These are about `prompt-wallet-launch.md` itself rather than the site.

**No activation definition.** The plan optimizes for followers and signups and
stops there. It never says what a successful first session looks like. A new
account lands in an empty wallet, and an empty wallet reads as a prototype, which
is the same failure mode already flagged for the screen recording in
`shoot-brief.md`. Seed a new account with one worked example wallet.
`seedTemplates.ts` already exists and already has three.

**Competitors are never named.** `about-me.md` permits comparison and then the
plan never does it. The real alternatives are Notion databases, Apple Notes, a
scratch file, and ChatGPT's own saved prompts. Until those are named, the
differentiation is unstated and the comparison pages in P3 cannot be written.

**Week 4 is one line.** "Proof and feedback, open the beta loop" with no posts
defined, while weeks 1 to 3 are specified per post. Week 4 is where the first
9 posts' data lands, so it should be the most planned, not the least.

**Two weeks of problem before any product.** Posts 01 to 06 never name the
product, which the teardown supports. The cost is that a viewer convinced by
post 02 has nowhere to go for a fortnight. The lead magnet in P2 resolves this
without breaking the rule: it captures intent without naming the product.

---

## What is right and should not be touched

- **Positioning.** One narrow idea, owned completely. Correct for a zero-follower
  account and the hardest thing to get right.
- **The rule from the teardown.** A measured finding rather than taste, and now
  corrected by a second round of evidence rather than defended.
- **"Reassess after 9 posts, not before."** The single most valuable line in the
  plan. Most launches die by re-strategising on post 3.
- **The explicit out-of-scope list.** Paid, other platforms, goal features, open
  source. Naming what you are not doing is what makes the rest achievable.

---

## Order of work

1. ~~`/wallet` canonical.~~ Done 2026-09-04.
2. ~~OG image.~~ Done 2026-09-04.
3. ~~Email capture plus the prompt pack.~~ Done 2026-09-04.
4. ~~UTM on the bio link.~~ Done 2026-09-04. Start using the tagged link at post 03.
5. ~~`robots.ts` and `sitemap.ts`.~~ Done 2026-09-04.
6. ~~The three search pages.~~ Done 2026-09-04.

Remaining: P4's seven on-page issues and P5's four plan-level gaps. The sharpest
of those is the activation gap, since `seedTemplates.ts` already exists and is
not wired to signup, so every new account still lands in an empty wallet.
