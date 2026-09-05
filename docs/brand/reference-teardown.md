# Reference Teardown

Four references supplied 2026-09-03, scraped with Apify and analyzed with
Gemini 3.8 Flash. Raw analyses and downloaded media live in the session
scratchpad, not the repo. This file is the durable finding.

## The numbers

| Ref | Format | Length | Plays | Likes | Like rate |
|---|---|---|---|---|---|
| `rick.theengineer` DcIBx4lo-1S | Reel | 148s | **65,872** | 2,161 | 3.3% |
| `jakebeau_` DczDM9bpjLe | Reel | 38s | 4,315 | 74 | 1.7% |
| `theedgarr` DcwcnV9lOeI | Carousel, 6 slides | n/a | 596 | n/a |
| `theedgarr` Dcd4JhklTPc | Carousel, 6 slides | n/a | 253 | n/a |

Both carousels are paid placements for `coddy.tech`.

## The finding that matters: 15x, and it is not production quality

Both reels are the same niche, both faceless-capable, both with clean
voiceover and motion graphics. One did 15x the other.

| | rick (65.8k) | jake (4.3k) |
|---|---|---|
| **you/your : I/me** | **18 : 1** | **0 : 9** |
| Premise | "What is RAG?" | "Here is my Jarvis" |
| Subject | the viewer's understanding | the creator's build |
| Duration | 148s | 38s |
| Avg shot length | 5.2s | 3.4s |
| Structure | 9 numbered chapters | additive feature list |
| Face on camera | none (avatar, 15%) | seated, 65% |
| CTA in video | none | none |

The pronoun ratio is the whole story. The winning video teaches the viewer
something about their own world. The losing one shows off what the creator
built. Everything else was comparable.

This is the trap for a founder with a product they are proud of. "Look at my
app" is the format that loses.

## What both reels agree on

- **No CTA in the video.** Both end on a concept or a quip. The caption is
  where the CTA goes. Video CTA and caption CTA are different surfaces.
- **Voiceover, never on-camera talking.** Both are studio-clean VO.
- **Ambient music, low energy.** Neither uses a trending audio hook.
- **Subtle interface SFX** on transitions: clicks, pops, wooshes.
- **Stylized mock UI beats raw screen capture.** Both frame interfaces inside
  rounded cards with shadows, Mac window chrome, floating and slightly offset.
  Neither shows a raw fullscreen OS recording.

## What the outlier does that the other does not

- **Long is fine.** 148s outperformed 38s. Watch time is the currency.
- **Numbered chapter tags** on screen (`03 INGEST`, top-left). Signals a
  complete explainer with an end, which holds the viewer.
- **A mental model to land on.** Closes with "the brain, the library, the
  librarian". The takeaway is portable, so it gets shared.
- **Slow cuts.** 5.2s average. Confidence, not frenzy.
- **Payoff is a side-by-side before/after** at 01:07, showing the raw query
  next to the same query with context injected.

## Carousel design system (theedgarr)

Reproducible in `next/og` almost exactly as-is.

- **Slide 1:** real photo (desk, monitor, laptop) with a huge condensed
  grotesque headline overlaid in white. Two-tier headline: enormous top line,
  half-size second line.
- **Slides 2+:** flat cream background (approx `#F0EDE6`), headline in a single
  saturated accent color, product UI shown as **floating dark rounded cards
  with soft drop shadows, overlapping and slightly offset**. Never full-bleed.
- **Every slide** carries the account wordmark, small, top center. Brand recall
  while swiping.
- **Type:** very heavy condensed sans. Headline roughly 4x the subhead. The
  size jump is doing all the work.
- No visible swipe cue on slide 1. The headline alone carries the swipe.

## What transfers to @buildcadence.co

1. Write every asset in **you/your**. Ban "I built" and "we shipped" from hooks.
2. The product is the **demonstration**, never the subject.
3. Explainer reels, 60 to 150s, numbered chapters, ~5s shots, VO plus ambient
   music, no CTA in the video.
4. Carousels: giant headline, flat background, floating UI cards, persistent
   wordmark.
5. Close on a portable mental model, not a feature summary.

---

# Round 2, 2026-09-04

Five more references supplied by the user, scraped with Apify. Two accounts,
47 posts of grid data plus the media itself. This round **corrects two rules**
from round 1 and adds a format that outperforms everything above by 28x.

## The numbers

`swerikcodes`, top of grid (23 posts scraped):

| Hook | Len | Plays | Likes | Comments |
|---|---|---|---|---|
| Software engineering in 2026 explained in 60 seconds… | 69s | **1,841,810** | 48,744 | 9,090 |
| I just turned down the Amazon return offer | 17s | 588,796 | 28,589 | 106 |
| Five months ago I never would've believed I'd be CTO | 40s | 322,408 | 11,707 | 144 |
| AI engineering in 2026 explained in 60 seconds… | 56s | 307,578 | 7,977 | 1,831 |
| How to build an app that ACTUALLY works | 50s | 305,970 | 9,030 | 54 |
| How to build a startup in 60 seconds… | 72s | 228,357 | 6,843 | 44 |
| **5 things I wish someone told me before my first startup** | 42s | **7,295** | 143 | 2 |

Same account, same face, same production. The top and the bottom are **252x
apart**.

`theedgarr` (24 posts): reels land 5,067–11,051 plays. Carousels draw far more
engagement than their reels do — best carousel 6,659 likes against 163–324
likes on a reel. That account is a carousel account and its reels are the
afterthought.

## Correction 1: it was never the pronouns

Round 1 read a 15x gap as a pronoun ratio. This round breaks that reading.
swerik's 1.8M and 307k captions are dense with I/me: "I spent the past year",
"I've used those skills", "if I had to restart from scratch". The 7,295-play
dud is *also* first person.

What actually separates them is **whose world the asset is about**:

- 1.8M / 307k: a **map of the viewer's field**. "Here is the whole territory,
  in order, in 60 seconds." The creator's story is credentials, not subject.
- 7,295: the creator's own past, offered as lessons. Subject is the creator.

Pronoun ratio was a proxy for that, and a good one, but it is the shadow and
not the thing. Personal credibility is allowed and it works — "$9M in
contracted ARR" is doing real load-bearing work in the 307k caption. What is
never allowed is the creator's experience as the *topic*.

**Revised rule:** the asset maps the viewer's world. Credentials may appear as
a one-line warrant for why this map is trustworthy. Never as the subject.

## Correction 2: a CTA in the video is fine

Round 1 concluded "no CTA in the video" from two references that both happened
to omit one. The 307k reel ends on a burned-in **"Save this roadmap"** and its
1.8M sibling does the same. That rule was an artifact of a two-post sample.

**Revised rule:** an in-video CTA is fine when it names the artifact the viewer
just received ("save this roadmap"), not the product.

## The format that did 1.8M

Anatomy of the 307k reel, read frame by frame:

1. **One continuous locked-off shot.** Person at a laptop, outdoors, natural
   light, shallow depth. It never cuts for the full 56s. All the motion comes
   from overlays.
2. **Title card over the b-roll**, first ~6s: "how to become an / **AI
   Engineer** / *From Scratch* / in 2026". Yellow and white, stacked, huge.
3. **Word-by-word burned subtitles**, lower third, white serif with a heavy
   shadow. Two or three words at a time, cut to the speech.
4. **Floating receipt cards** drop in over the b-roll and leave: a Rolling
   Stone article about the founder, the Python logo, a Coursera page,
   3Blue1Brown and Karpathy on YouTube, a UMAP scatter, an agent architecture
   diagram. Real screenshots, rounded, drop-shadowed.
5. **Bare text stacks** for lists, centered over the b-roll, no card:
   `APIs / Databases / Git / Docker / Cloud basics / System design`.
6. **Closes on "Save this roadmap."**

The whole thing is one shot plus overlays. There is no editing in the
traditional sense, which is why the account can ship this weekly.

**Cost to copy:** it needs 45–70s of continuous footage of a real person. Our
account is faceless by decision (`about-me.md`). Adopting this format is a
decision to stop being faceless, and that is the user's call, not a detail.

## theedgarr's carousel system, corrected and complete

Round 1 described this from two posts and got the cards wrong. Read off six
slides at full size:

- **Ground:** warm cream, about `#F0EDE6`, with visible film grain and a faint
  warm gradient. Never pure white.
- **Accent:** exactly one saturated red, about `#D51A20`. Nothing else is
  colored. No second accent anywhere in six slides.
- **Type:** heavy condensed grotesque, tight tracking, two tiers. Bold line one,
  regular line two, same size or half. The weight change does the work.
- **Running tagline**, small red, **top center on slide 1, top left on inner
  slides**. Its text *changes* between slides ("Taste is eating software" →
  "software engineer"). It is a rhythm device, not a logo.
- **Slide 1:** two-tier headline, then an image in a rounded card filling the
  lower ~55%. In this post it is an **anime still**, not a desk photo. Round 1
  called for a real photo. Both work; the rule is a *borrowed cultural image*,
  inset as a card, never full-bleed.
- **Slides 2–5:** headline, then a **real screenshot of a real artifact** — a
  blog post, an essay, a docs page — as a **light** card that **bleeds off the
  bottom edge**. Round 1 said "floating dark cards"; they are light, and the
  bleed is deliberate. The crop is the "there is more" cue.
- **A variant slide** carries a red headline plus a body paragraph, with a solid
  red block bleeding off the right edge.
- **Final slide:** two words, giant, centered, nothing else. "Save for later."

## What transfers, net of both rounds

1. Map the viewer's world. Credentials as warrant, never as subject.
2. Long is fine and one unbroken shot is fine. Overlays carry the motion.
3. Show **real artifacts**. Both accounts' payoff frames are screenshots of
   things that exist, not illustrations of things that could.
4. One accent color, one type family, a running tagline that shifts.
5. Bleed the artifact off an edge. A contained screenshot reads as finished; a
   cropped one reads as a door.
6. Close on the artifact the viewer received. "Save this roadmap" beats a
   product pitch and beats silence.
