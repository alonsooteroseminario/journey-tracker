# Campaign Diary

Running log for the Prompt Wallet launch on `@buildcadence.co`.
Newest entry at the top. Numbers live in the Drive tracker, not here. This file
is for what happened and why, so a decision made in week 1 is still legible in
week 4.

Metrics sheet, filled in from the phone after each post:
https://docs.google.com/spreadsheets/d/1awGcyREjYw7Y4ylcgcUiCHOfDpaCc6Lii4q7yXpEPpI/edit

## Schedule

Rotation is reel, carousel, short. Three a week, Monday Wednesday Friday.
Week boundaries follow the post groups, not the calendar.

| Post | Date | Format | Status |
|---|---|---|---|
| 01 | Fri 04-09-2026 | Reel | **posted** |
| 02 | Mon 07-09-2026 | Carousel | **built, not posted** |
| 03 | Wed 09-09-2026 | Short | not built |
| 04 | Fri 11-09-2026 | Reel | not built |
| 05 | Mon 14-09-2026 | Carousel | not built |
| 06 | Wed 16-09-2026 | Short | not built |
| 07 | Fri 18-09-2026 | Reel | not built |
| 08 | Mon 21-09-2026 | Carousel | not built |
| 09 | Wed 23-09-2026 | Short | not built |

Week 1, the problem: 01 to 03. Week 2, the method: 04 to 06.
Week 3, the product: 07 to 09. Week 4, proof: from Fri 25-09.

---

## 2026-09-04, Friday. Day 1, evening

**Built:** post 02, "7 prompts you have rewritten more than five times." Carousel,
6 slides, **1080x1350**, in Drive and ready to post Monday. Not posted yet.

**A second reference teardown changed the rules.** Five references supplied,
scraped with Apify, 47 posts of grid data. Written up as round 2 in
`reference-teardown.md`. Two things we had written down are wrong:

- **It was never the pronoun ratio.** `swerikcodes` runs 1,841,810 plays on
  "Software engineering in 2026 explained in 60 seconds" and 7,295 on "5 things
  I wish someone told me before my first startup." Same account, same face, same
  production, **252x apart**, and both captions are thick with I/me. What
  separates them is whether the asset maps the viewer's field or recounts the
  creator's past. The pronoun count was a proxy, and a good one, but it is the
  shadow and not the thing. Credentials as a one-line warrant are fine and they
  work. The creator as subject is what dies.
- **A CTA in the video is fine.** Round 1 concluded otherwise from two
  references that both happened to omit one. Both swerik winners close on a
  burned-in "Save this roadmap."

**Decisions worth remembering**

- **Staying faceless, but not Remotion-only.** The 1.8M format is one unbroken
  locked-off shot of a person at a laptop with subtitles and screenshots layered
  over it. Adopting it whole means putting a face on the account. The call was
  to take the structure and keep the face out: hands and screen only, one
  continuous shot, overlays carrying the motion. Post 04 is the first one built
  that way.
- **Carousel moved to 4:5.** Both reference accounts shoot 1080x1350. It takes
  25% more feed height on a phone and Instagram has not downranked it. Post 01's
  square brand assets stay square; this is a separate slug set.
- **Three prompt cards per slide, not two.** Two leave a third of the frame
  empty and the slide reads as unfinished. Found by rendering it and looking,
  not by planning it. Restructured from 2+2+2+1 to 3+3+1, which freed a slide
  for the arithmetic beat: 7 prompts, 5 rewrites each, 35 first drafts. That
  number is post 04's thesis, seeded a week early without stating it.
- **Own module, not the shared brand kit.** `promptWalletCarousel.tsx` rather
  than `assetTemplates.tsx`. The shared file is 1080x1080, Arial, and feeds a
  public HTTPS route for the Instagram Graph API. Sharing it would regenerate
  twelve unrelated brand assets on every post build. The skill said reuse; the
  skill was written before the ratio and the fonts diverged, and has been
  corrected.
- **Barlow is committed to the repo.** Only Ubuntu Condensed Regular is
  installed on this machine, and next/og silently falls back to Arial without an
  explicit face. The whole post is typography, so the font is load-bearing.

**Known gaps**

- Post 03 is due Wednesday 09-09 and is not built.
- Post 02's per-slide exit data will be the first real read on whether the cover
  earns the swipe. There is no carousel baseline yet, so post 01 is the only
  comparison and it is a different format.

**Next checkpoint:** Sunday 06-09, the 48-hour read on post 01. Average watch
time is the number. Then post 02 goes up Monday 07-09.

## 2026-09-04, Friday. Day 1

**Posted:** post 01, "Your best prompt is already gone." Explainer reel,
1080x1920, 2:08, voiceover plus ambient bed plus interface SFX.

Account state at launch: 0 posts before this one.

**Also done today**

- Profile rewritten off the goal tracker positioning. Name field set to
  `Prompt Wallet | Prompt Library`, which is the field Instagram search
  indexes. Bio replaced with the three prompt organization lines.
- First comment posted and pinned: "The test in this one is real. Post your time."

**Decisions worth remembering**

- The reel runs 2:08, not the 85s originally storyboarded. The generated
  voiceover came back at about 92 wpm because the direction asks for full
  pauses. The picture was retimed to the audio rather than the read being
  rushed to fit. The 65k reference reel ran 148s, so length is not the risk.
- Product is not named once. Neither will posts 02 to 06. This follows the one
  finding that drove the whole campaign: two reference reels of equal
  production quality, 15x apart in reach, separated by pronoun ratio. The
  winner ran 18 you-to-1 me. The loser ran 0 to 9.
- No music added in Instagram. The bed is already in the file.
- Posted on a Friday rather than the Monday the plan assumed. Rotation is
  preserved by format order, not weekday, so 02 lands Monday as a carousel.

**Known gaps**

- Posts 02 and 03 are not built. The plan says bank three before going live so
  the account does not read as dead. Launched at one. 02 is due Monday.
- Exact posting time not recorded. Worth logging from post 02 onward, it
  affects how the first hour reads.

**Next checkpoint:** Sunday 06-09, 48 hours after posting. Log plays, average
watch time, follows from this post, and profile visits. Average watch time is
the number that matters. If most viewers leave inside the first 7 seconds the
opening is the problem, not the length.

**Do not** change strategy on one post. The plan reassesses after 9.
