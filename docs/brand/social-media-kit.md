# Cadence — Social Media Brand Kit

Reference for launching and running Cadence's Instagram presence. Instagram launches **before** the open-source release — don't mention "open source" in captions or bio yet.

## House style (settled)

Instagram is the target, so **instagram-skills rules win** wherever they conflict with the generic social-media ruleset:

- **No em dashes.** They're the loudest AI tell in a caption. Use `..`, a comma, or a line break.
- **American English.** Not British.
- **Specific numbers beat adjectives.** "week 3", "60 seconds", "9 half-started goals" — not "fast", "easy", "powerful".
- **One CTA per caption**, and it names the action ("save this for…", "send this to…"). Never "link in bio" alone.

## Palette

| Token | Hex | Usage |
|---|---|---|
| `brand-primary` | `#5B50E8` | Primary accent, CTAs |
| `brand-secondary` | `#7B6FFF` | Gradients |
| `brand-light` | `#EAE8FF` | Light text on dark backgrounds |
| `brand-dark` | `#2D1B8E` | Dark backgrounds |
| `brand-accent` | `#F08080` | Sparing highlight only |

Source of truth: `tailwind.config.ts` / `src/app/globals.css`.

## Logo

`public/brand-icon.png` — the rocket-orbit mark, lavender background, 1024×1024. Instagram's circle crop cuts roughly the outer 20% of a square, and the exhaust flame + pink arrow tip sit inside that margin — **don't upload the file as-is**. Re-export a profile-photo variant with the mark scaled down ~15% on the same lavender canvas so nothing sits past the safe circle. Don't stretch, recolor, or add a drop shadow.

## Voice

Cadence's audience is motivated 20–45 year-old professionals, students, and creators who set ambitious goals and start strong, then lose momentum after 2–4 weeks. Speak to *momentum and structure*, not willpower or hustle. Practical and encouraging, never corporate, never preachy. Lead with what the app does for a stalled goal, not a feature list.

## Profile

Instagram search indexes the **Name** field, not the handle. A bare brand name wastes the account's only keyword slot.

- **Name** (30 char limit) — `Cadence | Daily Goal Tracker` (28)
  - Alternate: `Cadence | Goal Streak Tracker` (29)
- **Handle:** `@buildcadence.co` — claimed, live at https://www.instagram.com/buildcadence.co/
- **Category label:** `App Page` (fallback: `Software Company`). Requires a Business or Creator account, which API publishing needs anyway.
- **Bio** (123 chars of 150):
  ```
  Turn big goals into daily momentum 🎯
  Break any goal into daily tasks, keep the streak
  Free · no card · start in 60 seconds ↓
  ```
- **Link:** buildcadence.co

## Launch captions

Shape for every caption: **hook ≤125 chars** (the part visible before "more") → 2–3 short body lines → one specific CTA → a sized hashtag set. Numbered to match the grid order in "First 9 posts" below, not the order they were drafted in.

### #1 — App overview (single) · IG8 Framework · goal: saves

> Set the goal. Get the daily tasks. Keep the streak.
>
> Cadence is the space between "I want to" and "I did."
> One goal in, a daily plan out, a streak that makes
> skipping visible.
>
> Save this and start one goal tonight.
>
> `#dailyhabits #goalsettingapp #habittrackerapp #productivityapp`

### #2 — Why goals die in week 3 (carousel) · IG2 Contrarian Truth · goal: shares + saves

> Most goals don't die in week 1. They die in week 3.
>
> Week 1 runs on motivation. Nothing is required yet.
> By week 3 the plan is still fine. The reminder to run it isn't there anymore.
> That's the whole gap: no daily instruction, no visible cost to skipping.
>
> Save this and reread it in week 3.
>
> `#goalfailure #consistencytips #habittrackerapp #motivation`
>
> *Media: the 9-slide `carousel-week3-*` set — see the Carousel section below.*

### #3 — Streak card (single) · IG1 Number-First · goal: saves

> Motivation fades. A streak doesn't let you forget. 🔥
>
> Most goals die in week 3, not week 1. The plan was fine..
> the reminder to run it wasn't there.
> Cadence turns the goal into a visible daily streak.
>
> Save this for the goal you restarted twice already.
>
> `#streaktracker #dailyhabits #goalsettingapp #productivityapp`
>
> *Media: `post-streak-celebration` — already built in `assetTemplates.tsx`.*

### #4 — AI coach demo (Reel, 15s) · IG9 Pattern-Interrupt · goal: shares

> No blank page. No 40-minute planning session that becomes procrastination.
>
> Tell Cadence's AI your goal. It hands you the daily tasks in one prompt.
>
> Send this to the friend who's been "starting Monday" for three months.
>
> `#aigoalcoach #dailytaskplanner #aiproductivity #productivitytools`
>
> *Video hook (on-screen, first 1–2s, not the caption): "You don't need more motivation. You need a plan." Media: 15s screen-capture demo — not yet filmed.*

### #5 — 5 goals people restart (carousel) · IG5 Listicle · goal: saves + sends

> 5 goals almost everyone restarts, and the plan that actually finishes them.
>
> Learn Spanish. Run a 5K. Save the first $1,000. Write the book.
> Switch careers by December.
> Swipe for the plan that gets each one past week 3.
>
> Save this before you start goal number six.
>
> `#goalreset #consistencychallenge #goalplanning #selfimprovement`
>
> *Media: slide copy not drafted yet — run `ig-carousel-planner` for the 9 slides, then build them the same way as `carousel-week3-*`.*

### #6 — AI coach (single) · IG3 Relatable · goal: comments

> Tell it your goal. It hands you the plan.
>
> No blank page. No 40-minute planning session that becomes
> the procrastination.
> Cadence's AI breaks any goal into daily tasks in one prompt.
>
> Send this to the friend with 9 half-started goals.
>
> `#aigoalplanning #goalplanning #habittrackerapp #aiproductivity`
>
> *Media: `post-feature-announcement` (or a new single) — pillar: Promotion.*

### #7 — Templates (single) · IG1 Number-First · goal: saves

> Don't start from zero. Fork a plan that already worked.
>
> Someone already ran the 12-week version of your goal and
> wrote down what actually mattered.
> Copy their plan, then change the parts that aren't you.
>
> Save this before you build another plan from scratch.
>
> `#goaltemplates #goalplanning #goalsettingapp #productivity`

### #8 — Day 1 vs day 30 (Reel) · IG4 Mini-Story Confession · goal: comments + follows

> Day 1 of this streak, I almost didn't record it.
>
> I didn't feel motivated. I felt annoyed that I'd told anyone about
> this goal at all.
> Day 30 looks identical. Same lack of motivation. The only difference
> is I showed up anyway, 30 times in a row.
> Motivation was never the plan. The streak was.
>
> Comment your day 1, however far back it was.
>
> `#30daychallenge #streakgoals #habittrackerapp #consistency`
>
> *Media: real first-person footage, day 1 clip + day 30 clip — can't be generated, needs to be filmed. On-screen text: "Day 1." / "Day 30."*

### #9 — Community feed (single) · IG3 Relatable · goal: comments

> Progress feels different when someone is watching.
>
> A private goal is a goal you can quietly drop.
> Cheer a friend's streak, let them see yours,
> and week 3 stops being the wall.
>
> Tag the person you keep saying "we should both do this" to.
>
> `#accountabilitypartner #accountabilitybuddy #goalsettingapp #accountability`

## Hashtag strategy

A new account ranks in a niche tag (<50k posts) for hours and in a broad tag (500k+) for minutes. Every set above is **2 niche + 1 mid + 1 broad**, in that order.

Do **not** use `#Cadence` — the tag is dominated by unrelated music and cycling posts, and a popular-but-off-topic tag mistrains the recommendation engine.

Post counts drift; verify each tag in the app's search before the first post and swap out anything that has crossed 50k.

## Story highlights

Ordered by the visitor's next question (Start Here → Proof → Offer → FAQ), not by feature. Cover labels truncate past ~10 characters, so keep them short.

| Order | Label | Icon | Cover slug |
|---|---|---|---|
| 1 | Start | 🎯 | `highlight-goals` |
| 2 | Streaks | 🔥 | `highlight-streaks` |
| 3 | AI | 🤖 | `highlight-ai-assistant` |
| 4 | Community | 🤝 | `highlight-community` |

("AI Assistant" was 12 characters and clipped on the cover.)

## First 9 posts

The grid is the landing page. Publish in this order; the newest three land on the top row.

| # | Format | Working title | Job |
|---|---|---|---|
| 1 | Single | App overview | Says what this is in one screen |
| 2 | Carousel | Why goals die in week 3 | Saves — the anchor post |
| 3 | Single | Streak card | Proof the product has a visible payoff |
| 4 | Reel | 15s: goal in, daily plan out | Reach |
| 5 | Carousel | 5 goals people restart, and the plan for each | Saves + sends |
| 6 | Single | AI coach | The differentiator |
| 7 | Single | Templates | The "you don't start from zero" offer |
| 8 | Reel | Day 1 vs day 30 of the same streak | Reach |
| 9 | Single | Community feed | Social proof |

Captions for all 9 are in "Launch captions" above, numbered to match this table.

**Pinned (3 slots):** #1 overview, #2 the carousel, #3 Templates (post #7) as the interim pick — it's the clearest offer of the three remaining single posts. Swap #3 for the best-performing reel once 2–3 weeks of data exist; don't leave the third slot empty in the meantime.

**Reel covers:** reels don't have a defined cover yet, so they'll break the grid's look next to the `Frame`-templated singles/carousel. Use the same `Frame` gradient as a static first-frame title card (headline text, no play-button confusion) — one new template in `assetTemplates.tsx`, reused for reels #4 and #8.

## Launch calendar — Week 1 (Mon Aug 31 – Sun Sep 6, 2026)

Reordered from the grid sequence above to front-load both reels into week 1 — a 0-follower account needs reach more than it needs the grid's cosmetic order, and reels are the only format that reaches non-followers.

| Day | Post | Format | Pillar | Formula | Angle | Goal | Time |
|---|---|---|---|---|---|---|---|
| Mon 8/31 | #1 | Single | Educational | IG8 Framework | "The whole app in one screen: set the goal, get the daily tasks, keep the streak" | Saves | 11:30 AM |
| Tue 9/1 | — | Story only | — | — | Countdown + poll: "what goal have you restarted the most?" | — | throughout day |
| Wed 9/2 | #2 | Carousel | Engagement | IG2 Contrarian Truth | "Your goal didn't fail in week 1. It failed in week 3." (anchor post) | Shares (+ saves, per its own CTA) | 11:00 AM |
| Thu 9/3 | — | Story only | — | — | Reshare Wed's carousel + "which slide hit hardest?" sticker | — | throughout day |
| Fri 9/4 | #4 | Reel | Engagement | IG9 Pattern-Interrupt | "You don't need more motivation. Tell it your goal, it hands you the plan." (15s AI demo) | Shares | 12:00 PM |
| Sat 9/5 | #5 | Carousel | Educational | IG5 Listicle | "5 goals people restart every year, and the plan for each" | Saves + sends | 10:00 AM |
| Sun 9/6 | #8 | Reel | Story | IG4 Mini-Story Confession | "Day 1 vs. day 30 of the same streak" — first-person, real footage | Comments + follows | 6:00 PM |

**Weekly saves + shares goal:** no baseline yet at 0 followers, so track direction not a number — expect the Wed carousel and Sat listicle to carry most of the saves; the two reels carry reach. Re-baseline after week 1's actuals.

**Daily stories:** 2–4 frames every day, including the two feed-post-free days above. On a feed-post day: one BTS frame + a reshare of that day's post (the in-app send-equivalent for people who missed it in-feed).

**Balance check**
- [x] Format mix: 2 reels, 2 carousels, 1 single, stories daily
- [x] Save-bait ≥3 (Mon, Wed-secondary, Sat), send-bait ≥2 (Wed, Fri)
- [x] 1 first-person story post (Sun reel)
- [x] No pillar over 50% (Educational 40%, Engagement 40%, Story 20%)
- [x] No formula repeated
- [x] Promotion: 0 posts this week — within the 1–2 max, saved for week 2's Templates offer

### Week 2 (draft — posts #3, #6, #7, #9)

The remaining four kit posts (streak card, AI coach, templates, community feed) are all singles — good for pillar variety (Promotion: Templates, 1 post, within the max) but **this week has 0 reels and 0 carousels as drafted**, which fails the format-mix check. Before scheduling week 2: draft one new carousel and one new reel with `ig-carousel-planner` / `ig-hook-extractor` — the kit's 9-item grid only stocks one week of format variety, not two.


## Carousel: "Why goals die in week 3"

Carousels are Instagram's highest-save format and the kit had none. Slide plan (1080×1080 each):

1. **Hook** — "Your goal didn't fail in week 1. It failed in week 3." Big type, `brand-dark → brand-primary` gradient.
2. Week 1: motivation carries you. Nothing is required yet.
3. Week 2: the plan survives, the reminders don't.
4. Week 3: one missed day becomes three. The goal goes quiet.
5. The real gap: no daily instruction, no visible cost to skipping.
6. Fix 1 — break the goal into today's task, not this quarter's outcome.
7. Fix 2 — make skipping visible. A streak you can see is a reminder you can't ignore.
8. Fix 3 — let one person watch. Private goals are droppable.
9. **CTA** — "Save this and reread it in week 3." Logo + handle.

Implemented as `carousel-week3-1` … `carousel-week3-9` in `src/lib/social/assetTemplates.tsx` (the `CarouselSlide` component + `WEEK3_CAROUSEL_SLIDES` data). Each slide renders its headline/body via `next/og` over a background illustration read from `public/carousel-bg/carousel-week3-<n>.png` — drop a file in and the matching slide picks it up automatically; missing files fall back to the plain brand gradient, so the set is postable today and gets the illustrated version whenever the art lands.

### Carousel background art — image-gen prompts

For a **specialized image-gen chat** (Gemini/Nano Banana, Midjourney, Ideogram, etc.) — not a code path. Paste one prompt per slide into a **fresh chat each time** for max consistency across the set; save the result as `public/carousel-bg/carousel-week3-<n>.png`, exactly 1080×1080.

Every prompt is self-contained and ends the same way on purpose — **no text in the image**, because the headline/body render separately via `next/og` on top of it (see `docs/brand/brand-context.md` §4: text-in-image is where every image model still fails, so this system only ever asks it for the background/illustration layer).

**Shared style block** (repeated in every prompt below): deep indigo `#2D1B8E` base, violet `#5B50E8` / light violet `#7B6FFF` glow accents, pale lavender `#EAE8FF` highlight, coral `#F08080` used sparingly if at all. Modern flat-gradient illustration, soft glow, minimal geometric shapes, generous negative space, subtle grain. No photorealism, no 3D render, no people's faces, no logos, no watermark, no text/words/letters/numbers anywhere in the image. Mood: momentum and quiet structure — calm and premium, not hustle or grind, not cartoonish. Leave the vertical center third visually calm for overlaid text. This is 1 of 9 slides in one carousel set — keep the palette and style identical across all 9.

1. **Hook** — "Your goal didn't fail in week 1. It failed in week 3."
   ```
   Abstract editorial illustration, square 1080x1080, no text/words/letters/numbers anywhere in the image. Deep indigo #2D1B8E base, violet #5B50E8 and light violet #7B6FFF glow accents, pale lavender #EAE8FF highlight, coral #F08080 sparingly if at all. Modern flat-gradient illustration, soft glow, minimal geometric shapes, generous negative space, subtle grain. No photorealism, no 3D render, no people's faces, no logos, no watermark. Mood: momentum and quiet structure, calm and premium, not hustle or grind. Leave the vertical center third visually calm for overlaid text. This is slide 1 of 9 in one carousel set; keep palette and style identical across all 9.

   Composition: a single glowing dot travels left to right along a thin curved path across the frame, brilliant violet glow on the left fading to a dim, barely-visible ember by the right edge. The path represents a timeline losing energy over distance. Asymmetric composition, dot and bright path segment in the lower-left third.
   ```

2. **Week 1** — motivation carries you, nothing required yet
   ```
   Abstract editorial illustration, square 1080x1080, no text/words/letters/numbers anywhere in the image. Deep indigo #2D1B8E base, violet #5B50E8 and light violet #7B6FFF glow accents, pale lavender #EAE8FF highlight, coral #F08080 sparingly if at all. Modern flat-gradient illustration, soft glow, minimal geometric shapes, generous negative space, subtle grain. No photorealism, no 3D render, no people's faces, no logos, no watermark. Mood: momentum and quiet structure, calm and premium, not hustle or grind. Leave the vertical center third visually calm for overlaid text. This is slide 2 of 9 in one carousel set; keep palette and style identical across all 9.

   Composition: a bright, fully-saturated upward burst of soft light in the upper third, radiating violet and lavender glow outward like a sunrise. Full energy, wide open negative space below.
   ```

3. **Week 2** — the plan survives, the reminders don't
   ```
   Abstract editorial illustration, square 1080x1080, no text/words/letters/numbers anywhere in the image. Deep indigo #2D1B8E base, violet #5B50E8 and light violet #7B6FFF glow accents, pale lavender #EAE8FF highlight, coral #F08080 sparingly if at all. Modern flat-gradient illustration, soft glow, minimal geometric shapes, generous negative space, subtle grain. No photorealism, no 3D render, no people's faces, no logos, no watermark. Mood: momentum and quiet structure, calm and premium, not hustle or grind. Leave the vertical center third visually calm for overlaid text. This is slide 3 of 9 in one carousel set; keep palette and style identical across all 9.

   Composition: a solid geometric shape (the plan) sits intact and steady in the lower third, fully lit. Above it, a small glowing node (the reminder) is visibly dimming, half its former brightness, drifting slightly out of alignment.
   ```

4. **Week 3** — one missed day becomes three, the goal goes quiet
   ```
   Abstract editorial illustration, square 1080x1080, no text/words/letters/numbers anywhere in the image. Deep indigo #2D1B8E base, violet #5B50E8 and light violet #7B6FFF glow accents, pale lavender #EAE8FF highlight, coral #F08080 sparingly if at all. Modern flat-gradient illustration, soft glow, minimal geometric shapes, generous negative space, subtle grain. No photorealism, no 3D render, no people's faces, no logos, no watermark. Mood: momentum and quiet structure, calm and premium, not hustle or grind. Leave the vertical center third visually calm for overlaid text. This is slide 4 of 9 in one carousel set; keep palette and style identical across all 9.

   Composition: mostly dark, quiet negative space filling the frame. A single small, nearly-extinguished ember of violet light sits off-center, alone, no path or connection leading to or from it.
   ```

5. **The real gap** — no daily instruction, no visible cost to skipping
   ```
   Abstract editorial illustration, square 1080x1080, no text/words/letters/numbers anywhere in the image. Deep indigo #2D1B8E base, violet #5B50E8 and light violet #7B6FFF glow accents, pale lavender #EAE8FF highlight, coral #F08080 sparingly if at all. Modern flat-gradient illustration, soft glow, minimal geometric shapes, generous negative space, subtle grain. No photorealism, no 3D render, no people's faces, no logos, no watermark. Mood: momentum and quiet structure, calm and premium, not hustle or grind. Leave the vertical center third visually calm for overlaid text. This is slide 5 of 9 in one carousel set; keep palette and style identical across all 9.

   Composition: a thin dotted line of small glowing nodes crosses the frame horizontally, with one clear gap in the middle where a node is missing, just empty dark space. The break is the focal point, centered but low in the frame.
   ```

6. **Fix 1** — break the goal into today's task, not this quarter's outcome
   ```
   Abstract editorial illustration, square 1080x1080, no text/words/letters/numbers anywhere in the image. Deep indigo #2D1B8E base, violet #5B50E8 and light violet #7B6FFF glow accents, pale lavender #EAE8FF highlight, coral #F08080 sparingly if at all. Modern flat-gradient illustration, soft glow, minimal geometric shapes, generous negative space, subtle grain. No photorealism, no 3D render, no people's faces, no logos, no watermark. Mood: momentum and quiet structure, calm and premium, not hustle or grind. Leave the vertical center third visually calm for overlaid text. This is slide 6 of 9 in one carousel set; keep palette and style identical across all 9.

   Composition: one small, brightly-lit geometric tile sits clearly separated and in sharp focus in the lower third, while a much larger, softly-blurred and desaturated geometric shape looms faintly in the background above it, out of focus.
   ```

7. **Fix 2** — make skipping visible, a streak you can't ignore
   ```
   Abstract editorial illustration, square 1080x1080, no text/words/letters/numbers anywhere in the image. Deep indigo #2D1B8E base, violet #5B50E8 and light violet #7B6FFF glow accents, pale lavender #EAE8FF highlight, coral #F08080 sparingly if at all. Modern flat-gradient illustration, soft glow, minimal geometric shapes, generous negative space, subtle grain. No photorealism, no 3D render, no people's faces, no logos, no watermark. Mood: momentum and quiet structure, calm and premium, not hustle or grind. Leave the vertical center third visually calm for overlaid text. This is slide 7 of 9 in one carousel set; keep palette and style identical across all 9.

   Composition: an unbroken chain of small glowing nodes arcs across the lower half of the frame, each one warm and evenly lit, no gaps, forming a continuous connected line with a soft shared glow.
   ```

8. **Fix 3** — let one person watch, private goals are droppable
   ```
   Abstract editorial illustration, square 1080x1080, no text/words/letters/numbers anywhere in the image. Deep indigo #2D1B8E base, violet #5B50E8 and light violet #7B6FFF glow accents, pale lavender #EAE8FF highlight, coral #F08080 sparingly if at all. Modern flat-gradient illustration, soft glow, minimal geometric shapes, generous negative space, subtle grain. No photorealism, no 3D render, no people's faces, no logos, no watermark. Mood: momentum and quiet structure, calm and premium, not hustle or grind. Leave the vertical center third visually calm for overlaid text. This is slide 8 of 9 in one carousel set; keep palette and style identical across all 9.

   Composition: two soft glowing circles overlap slightly at their edges in the lower third, one violet and one lavender, their overlap creating a brighter shared region. Calm, connected, no other elements.
   ```

9. **CTA** — save this, reread it in week 3
   ```
   Abstract editorial illustration, square 1080x1080, no text/words/letters/numbers anywhere in the image. Deep indigo #2D1B8E base, violet #5B50E8 and light violet #7B6FFF glow accents, pale lavender #EAE8FF highlight, coral #F08080 sparingly if at all. Modern flat-gradient illustration, soft glow, minimal geometric shapes, generous negative space, subtle grain. No photorealism, no 3D render, no people's faces, no logos, no watermark. Mood: momentum and quiet structure, calm and premium, not hustle or grind. Leave the vertical center third visually calm for overlaid text. This is slide 9 of 9 in one carousel set, the closing/CTA slide; keep palette and style identical across all 9, but make this one the brightest and most resolved of the set.

   Composition: the same curved path motif from slide 1, but now fully lit end to end in a warm, even violet-to-lavender glow, no dimming or gaps anywhere along it. A sense of arrival and completion.
   ```

The 2nd carousel ("5 goals people restart") has no slide copy yet — run `ig-carousel-planner` to draft its 9 slides, add the results to `WEEK3_CAROUSEL_SLIDES`-style data in `assetTemplates.tsx` under a new `WEEK5_CAROUSEL_SLIDES` array, then repeat this same prompt pattern with slide count 9 of 9 → whatever the actual count is.

## Asset kit

Templates live in **`src/lib/social/assetTemplates.tsx`**, keyed by slug. Two consumers, one source:

- **PNGs:** `npx tsx scripts/generate-social-assets.tsx` → gitignored `/social-assets/` (manual upload).
- **Public URLs:** `GET /api/social-assets/<slug>` renders the same template as a PNG over HTTPS. This is what the Instagram Graph API needs — it fetches `image_url` unauthenticated, so the route is in the public matcher in `src/middleware.ts`.

Current slugs: `post-feature-announcement`, `post-quote-card`, `post-streak-celebration`, `highlight-streaks`, `highlight-goals`, `highlight-ai-assistant`, `highlight-community`, `carousel-week3-1` … `carousel-week3-9`.

Text is rendered by `next/og`, not generated by an image model — text-in-image is where every image model still fails. If LLM image generation is added later it belongs on the *background/illustration* layer, composited under the `next/og` text.

For video, reuse the existing Remotion marketing pipeline (`src/remotion/marketing/`, `npm run video:studio`) — 5 compositions already render in landscape/square/vertical, all on-brand as of this doc.

## Publishing

The pipeline already exists in this repo. No third-party scheduler needed.

1. Connect the account at `/admin/social` (OAuth: `/api/admin/social/connect/instagram`). **Business or Creator account required** — personal accounts fail at OAuth.
2. Create a `SocialPost` row with `status: "scheduled"`, `scheduledFor`, `content` (the caption), and `mediaUrls: ["https://<host>/api/social-assets/<slug>"]`.
3. `/api/cron/publish-scheduled-posts` runs every 15 minutes (registered in `vercel.json`), batches 50, and calls the Graph API container → `media_publish` flow in `src/lib/admin/socialPublishing.ts`.
