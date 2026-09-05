# Post 02: "7 prompts you have rewritten more than five times"

Week 1 of the Prompt Wallet launch. Carousel, 6 slides, 1080x1350.
Reads with `prompt-wallet-launch.md`, `voice.md`, `reference-teardown.md`
(**round 2**, which corrects the round 1 design notes).

- **Job:** saves. That is what carousels are here for.
- **Product named:** no. Week 1 is still the problem.
- **Templates:** `src/lib/social/promptWalletCarousel.tsx`, slugs `pw-post-02-slide-1..6`
- **Output:** `social-assets/pw-post-02-slide-{1..6}.png`
- **Build:** `npx tsx scripts/generate-pw-carousel.tsx`
- **Type:** Barlow 400/700/900, `public/fonts/`. Committed so the build is
  reproducible. Only Ubuntu Condensed Regular is installed on this machine and
  next/og falls back to Arial without an explicit face.

## Why this one is second

Post 01 named the loss. This one proves it happened to *them*, seven times, with
receipts they recognize. A viewer who reads their own week in a list saves the
list. Recognition is the save mechanism, not advice.

It also sets up post 04, "stop writing prompts, start assembling them." Seven
prompts rewritten five times each is 35 rewrites, and that number is the
argument for assembly without ever making it out loud.

## Format ratio

**1080x1350, not 1080x1080.** Both reference accounts shoot 4:5. It takes 25%
more feed height on a phone, which is free attention, and Instagram has not
downranked it. Post 01's square social assets stay square; this is a new slug set.

## Slide by slide

### Slide 1, the cover

> **7 prompts**
> you have rewritten more than five times

Tagline top center: `the prompt is the asset`. Below the headline, a dark card
showing a chat composer: a half-typed prompt, a violet cursor, and `draft 6` and
`send` along the bottom.

The number is the hook. It goes as large as the grid allows.

**The cover card is contained, not cropped.** Only inner slides bleed. The
reference crops its artifact once the cover has already earned the swipe, and
cropping the cover would read as a rendering fault rather than a device.

### Slides 2 and 3, six of the seven

Three per slide. Each prompt is an artifact, not a bullet: a dark rounded card
with a small violet ordinal above it. The lowest card on each slide **bleeds off
the bottom edge**.

| # | Prompt |
|---|---|
| 1 | Rewrite this so it sounds like me, not like AI. |
| 2 | Explain what actually causes this error, not how to silence it. |
| 3 | Turn this thread into decisions and owners. |
| 4 | Review this like a senior engineer who has to maintain it. |
| 5 | Give me five options, ranked, with the tradeoff for each. |
| 6 | Turn these notes into a draft I can edit, not a finished piece. |
| 7 | Ask me questions until you have enough to write this properly. |

No commentary anywhere on these two slides. The prompts carry themselves, and
commentary would tell the reader what to feel about their own week.

**Three per slide, not two.** Two cards leave a third of the frame empty and the
slide reads as unfinished. Three fill it and crop the last one. This was found by
rendering it, not by planning it.

### Slide 4, the seventh and the turn

Prompt 07 alone in a card, then:

> You did not write these seven times because you forgot how.
> **You wrote them seven times because version six was in a chat log.**

### Slide 5, the arithmetic

Three rows, each a display number over a small line of body:

> **7 prompts** / that you keep needing
> **5 rewrites each** / because the last version is unreachable
> **35 first drafts** / of prompts you had already finished once

35 is the whole argument for assembling rather than writing, made without ever
saying it. That is post 04's thesis, seeded here.

A violet block bleeds off the bottom right corner. Every other slide carries the
bleed on a card; this one has no card, so the block does that work.

### Slide 6, the close

> **The writing was never the hard part.**
> **Finding it again was.**

Small line under it: `Save this. Count them the next time you open a chat.`

theedgarr closes on a bare "Save for later". `voice.md` bans a bare CTA, so this
one names the moment instead. Same job, our voice.

## Design system

From `reference-teardown.md` round 2, with our accent swapped in. Structure is
theirs and it is proven; the color is ours and it is the brand recall.

| Token | Value |
|---|---|
| Ground | `#F0EDE6` warm cream, film grain, faint warm gradient. Never pure white |
| Accent | `#5B50E8` brand violet. **Exactly one accent.** Nothing else is colored |
| Ink | `#1A1726` for body copy |
| Card | `#171331` dark, 30px radius, soft shadow. Barlow 700, not mono |
| Type | Barlow, one family. 900 for display, 700 for prompts, 400 for body |

- Running tagline small violet, **top center on slide 1, top left on 2 to 6**.
  Text shifts between slides. It is a rhythm device, not a logo.
- The lowest card on every inner slide **bleeds off the bottom edge**. A
  contained card reads as finished. A cropped one reads as a door. Slide 5 has
  no card, so a violet block bleeds off the bottom right corner instead.
- No emoji, no icons, no drop caps, no second color.

## No sound design

Carousel. The sound sheet in `post-01.md` does not apply.

## Cover frame

Slide 1 is the cover. It has to survive the grid thumbnail, so the only things
that must read at 120px are the numeral **7** and the word **rewritten**.

## Caption

First 122 characters are what shows before "more", so it truncates inside the
second line and the hook has already landed.

```
Seven prompts you have rewritten more than five times.

You did not rewrite them because you forgot how.
You rewrote them because version six was buried in a chat log.
The writing was never the hard part. Finding it again was.

Open your AI tool and count how many of the seven you retyped this week.

#promptengineering #aiprompts #promptmanagement #chatgpttips
```

Checks against `voice.md`: hook 9 words, 3 body lines, one CTA naming a specific
moment, exactly 4 hashtags on their own line, 0 em dashes, 0 exclamation marks,
0 rhetorical questions, product not named, 6 you/your to 0 I/me. Hashtags differ
from post 01's set so the account is not fingerprinting one block.

## Pinned first comment

```
Reply with the number that is yours. If it is more than one, say which two.
```

Asks for a number, not an opinion. Post 01's comment did the same and it is the
cheapest possible reply.

## What to watch

**Saves, not likes.** That is the whole reason this format is in the rotation.
The comparison that matters is saves-per-reach against post 01, not against
another carousel, because there is no other carousel yet. Also watch whether
slide 6 or slide 1 shows higher exits in the per-slide insights. Slide 1 exits
mean the cover failed. Slide 6 exits are just the end.
