# Post 01: "Your best prompt is already gone"

Week 1 of the Prompt Wallet launch. Explainer reel, 1080x1920, 128s, with audio.
Reads with `prompt-wallet-launch.md`, `voice.md`, `reference-teardown.md`.

- **Job:** reach, which is the follower goal.
- **Product named:** no. Not once. This is week 1.
- **Composition:** `pw-post-01-best-prompt-gone` in `src/remotion/Root.tsx`
- **Scene:** `src/remotion/marketing/prompt-wallet/Post01BestPromptGone.tsx`
- **Output:** `videos/pw-post-01-best-prompt-gone-1080x1920.mp4`, per the
  convention in `docs/plans/2026-02-21-marketing-videos-design.md`. `/videos/`
  is gitignored. Note `public/videos/` is a different path, written only by
  the admin renderer in `src/lib/admin/videoRenderer.ts`.
- **Render:**
  ```
  npx remotion render src/remotion/index.ts pw-post-01-best-prompt-gone \
    videos/pw-post-01-best-prompt-gone-1080x1920.mp4 --codec=h264
  ```

## Why this one goes first

The teardown found a 15x reach gap between two reels of equal production
quality. The separating variable was the pronoun ratio: 18 you/your to 1 I/me
in the winner, 0 to 9 in the loser.

This script runs **17 you/your and zero I/me** across 197 words. Nothing on screen belongs to
Build Cadence except a handle in the final three seconds.

## Voiceover script with chapter timings

Total 197 words. The generated read came back at about 92 wpm, slower than the
139 wpm first estimated, because the direction asks for full pauses. The picture
was retimed to the audio rather than the read being rushed to fit, which is why
the reel is 128s and not 85s. The 65k reference reel ran 148s.

### Cold open, 0:00 to 0:10.5

> You wrote a prompt that worked.
> Not okay. Worked.
> It is gone.

*On screen:* a prompt types itself into a floating card, then drains of color
and drops away. Text lands over it.

### 01 THE LOSS, 0:10.5 to 0:35.3

> It happened on a Tuesday. You were three messages deep, fixing the output,
> and the fourth try landed.
> You copied the result. You did not copy the prompt.
> It is still in there. Somewhere behind four hundred conversations.

*On screen:* three flat beats, then "You did not copy the prompt" at full
size. Cut to a scrolling column of identical grey rows with a counter running
to 412. The one that mattered flashes violet for six frames and is gone.

### 02 WHY IT IS GONE, 0:35.3 to 1:01.2

> Chat history is not a filing system. It is a transcript.
> Transcripts are ordered by time, not by usefulness.
> Your best prompt and a question about a typo carry exactly the same weight.
> And search only helps when you already remember the words.

*On screen:* four timestamped rows rendered identically. A violet ring appears
around the second one late, after the viewer has already failed to spot it.
Then a search field types "the one about the" and returns NO RESULTS.

### 03 THE TAX, 1:01.2 to 1:25.1

> So you rewrite it. And here is what that costs.
> You do not start from your last version. You start from zero.
> Four rounds of fixing, paid again. Fourth time this month.
> Every rewrite is a first draft.

*On screen:* v1 through v4 light up at +2 min each, the counter climbs to 8,
then the whole row snaps back to v1 and the counter drops to 2 in coral. The
snap is the beat. Do not soften it.

### 04 THE TEST, 1:25.1 to 1:44.6

> Try this now. Think of the one prompt you would hate to lose.
> Open your tool. Find it. Time yourself.
> Most people land near a minute. That is not a memory problem.

*On screen:* a stopwatch running 0:00 to 1:14 across 1:32 to 1:40 of the
reel. It is violet under
0:10, plain over that, coral past 1:00. Two threshold rows light as it passes
them: "a system" and "a transcript".

This is the retention device. A viewer who actually runs the test is a viewer
who watched to the end, and a viewer with an unresolved result is a viewer who
comments.

### 05 THE REFRAME, 1:44.6 to 2:08.4

> You do not have a prompt writing problem. You write good prompts. You proved
> that on Tuesday.
> You have a retrieval problem.
> Your prompt is the asset. The chat log is just the receipt.

*On screen:* a coral line strikes through "a prompt writing problem", then "a
retrieval problem" lands in violet. Final card holds the closing two lines for
four seconds. `@BUILDCADENCE.CO` fades in at 2:04, small, centered.

**No CTA in the video.** Both reference reels close on a concept. The CTA lives
in the caption, which is a different surface.

## Voice direction

One voice, calm, mid to low register. Read it like a postmortem, not an ad. No
upward inflection at line ends, no smile in the voice, no emphasis added to
words the writing has not already emphasized. About 0.8s of silence at each
chapter break.

Neither reference reel used on-camera talking. Both were studio-clean VO. That
is the bar.

## Sound design

All of it is generated. `scripts/audio/generate-voiceover.py` produces the read,
`scripts/audio/generate-bed-and-sfx.py` produces the bed and the interface cues,
and both land in `public/audio/post-01/` where Remotion mixes them.

- **Voice:** Gemini TTS, `gemini-3.1-flash-tts-preview`, voice Charon, one clip
  per chapter. Delivered at -16 LUFS with true peak -1.5 dB, all six matched to
  each other so the chapters do not jump at the cuts.
- **Bed:** an A minor drone, six detuned voices on independent slow LFOs, no
  drums and no melody. Sits at -35 LUFS, 18 dB under the voice, and ducks
  further from 1:58 so the closing lines sit almost dry.
- **Final mix:** -17.2 LUFS integrated, true peak -4.05 dB. Instagram normalizes
  to about -14, so this leaves it room to lift without clipping.

Lyria was the intended source for the bed. It is listed on the key but the free
tier limit is 0, so it needs billing enabled before it can be used.

| Time | Cue |
|---|---|
| 0:00.5 to 0:04.5 | keyboard clacks under the typing, irregular |
| 0:05.2 | one dull thud as the card drains and falls |
| 0:10.5, 0:35.3, 1:01.2, 1:25.1, 1:44.6 | woosh plus click on each chapter cut |
| 0:27 to 0:35 | low rumble under the scroll |
| 1:07.4, 1:09.6, 1:11.2, 1:12.7 | v1 through v4 landing |
| 1:14.6 | the snap back to v1 |
| 1:30.9 to 1:38.5 | quiet tick under the stopwatch |
| 1:48.1 | one dry stroke for the strike-through |
| 1:58 onward | bed ducks, then fades out |

## On-screen text

Key lines are burned in as graphics, not full subtitles. The graphics carry the
beat and full subtitles would fight them. Turn on Instagram's auto-captions at
upload as the accessibility layer, then check the transcript for "Prompt
Wallet" mishearings before publishing.

## Cover frame

Frame 180 of the composition, the "It is gone." card. It reads at thumbnail
size and it is the only frame with all three hook lines visible at once.

```
npx remotion still src/remotion/index.ts pw-post-01-best-prompt-gone \
  videos/pw-post-01-best-prompt-gone-cover.png --frame=240
```

## Caption

The first 122 characters are what shows before "more", so it truncates on
"You did not copy the" and the cut is the hook.

```
Your best prompt is already gone.

You wrote it on a Tuesday, four tries deep. You copied the output. You did not copy the prompt.
Now it is somewhere behind 400 conversations, sorted by date, sitting next to a question about a typo.
You do not have a prompt writing problem. You have a retrieval problem.

Before you close this, think of the one prompt you would hate to lose, then time how long it takes you to find it.

#promptengineering #aiprompts #promptlibrary #aiworkflow
```

Checks against `voice.md`: hook 6 words, 3 body lines, one CTA naming a
specific moment, exactly 4 hashtags on their own line, 0 em dashes, 0
exclamation marks, 0 rhetorical questions, product not named, 9 you/your to 0
I/me.

## Pinned first comment

```
The test in this one is real. Post your time.
```

Two purposes. It seeds the comment section with a low-effort reply format, and
a number is easier to leave than an opinion.

## What to watch

Watch time is the number that matters, and the honest read is the drop between
0:00 and 0:07. If more than half leave inside the cold open, the problem is the
first three seconds, not the length. Reassess after 9 posts, not before.
