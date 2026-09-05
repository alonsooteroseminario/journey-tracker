/**
 * Prompt Wallet launch carousels, rendered with next/og.
 *
 * Deliberately separate from `assetTemplates.tsx`. That file is the Cadence
 * brand kit: 1080x1080, Arial, and wired to a public HTTPS route because the
 * Instagram Graph API needs to fetch `image_url` unauthenticated. These are
 * campaign slides: 1080x1350, their own type, posted by hand from a phone, and
 * replaced every week. Sharing a module would mean regenerating twelve
 * unrelated brand assets on every post build.
 *
 * Design system is `docs/brand/reference-teardown.md` round 2, with our violet
 * substituted for the reference's red. Copy is `docs/brand/posts/post-02.md`.
 *
 * Run: npx tsx scripts/generate-pw-carousel.tsx
 */
import * as React from "react";
import * as fs from "fs";
import * as path from "path";

export const W = 1080;
export const H = 1350;

const CREAM = "#F0EDE6";
const VIOLET = "#5B50E8";
const INK = "#1A1726";
const CARD = "#171331";
const CARD_TEXT = "#EAE8FF";
const CARD_MUTED = "#8B85C1";

const FONT_DIR = path.join(process.cwd(), "public/fonts");
const face = (f: string) => fs.readFileSync(path.join(FONT_DIR, f));

/** Barlow, one family in three weights. The weight jump does the work. */
export function fonts() {
  return [
    { name: "Barlow", data: face("Barlow-Regular.ttf"), weight: 400 as const, style: "normal" as const },
    { name: "Barlow", data: face("Barlow-Bold.ttf"), weight: 700 as const, style: "normal" as const },
    { name: "Barlow", data: face("Barlow-Black.ttf"), weight: 900 as const, style: "normal" as const },
  ];
}

/**
 * The running tagline. Centred on the cover, left-aligned on inner slides, and
 * its text shifts between slides — a rhythm device, not a logo.
 */
function Tagline({ text, center = false }: { text: string; center?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: center ? "center" : "flex-start",
        width: "100%",
        fontSize: "27px",
        fontWeight: 700,
        letterSpacing: "-0.3px",
        color: VIOLET,
      }}
    >
      {text}
    </div>
  );
}

/** Flat ground with a faint warm lift. Never pure white. */
function Slide({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: `${W}px`,
        height: `${H}px`,
        padding: "64px 64px 0 64px",
        backgroundColor: CREAM,
        backgroundImage: `linear-gradient(160deg, #F5F2EC 0%, ${CREAM} 45%, #EDE8DF 100%)`,
        fontFamily: "Barlow",
        color: INK,
      }}
    >
      {children}
    </div>
  );
}

/**
 * A prompt as an artifact rather than a bullet. The reference bleeds its
 * screenshots off the bottom edge: a contained card reads as finished, a
 * cropped one reads as a door.
 */
function PromptCard({ n, text }: { n: string; text: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        flexGrow: 1,
        flexBasis: 0,
        width: "100%",
        padding: "0 48px",
        borderRadius: "30px",
        backgroundColor: CARD,
        boxShadow: "0 18px 44px rgba(26,23,38,0.18)",
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: "26px",
          fontWeight: 700,
          letterSpacing: "1.5px",
          color: CARD_MUTED,
          marginBottom: "16px",
        }}
      >
        {n}
      </div>
      <div style={{ display: "flex", fontSize: "50px", fontWeight: 700, lineHeight: 1.24, color: CARD_TEXT }}>
        {text}
      </div>
    </div>
  );
}

/**
 * The card stack. Its height deliberately exceeds the space left below the
 * tagline, so the bottom card is cropped by the frame: a contained card reads
 * as finished, a cropped one reads as a door.
 */
function Stack({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "1254px", marginTop: "70px" }}>
      {children}
    </div>
  );
}

function Gap() {
  return <div style={{ display: "flex", height: "36px", flexShrink: 0 }} />;
}

const PROMPTS = [
  "Rewrite this so it sounds like me, not like AI.",
  "Explain what actually causes this error, not how to silence it.",
  "Turn this thread into decisions and owners.",
  "Review this like a senior engineer who has to maintain it.",
  "Give me five options, ranked, with the tradeoff for each.",
  "Turn these notes into a draft I can edit, not a finished piece.",
  "Ask me questions until you have enough to write this properly.",
];

/** Slide 1. Only the numeral and "rewritten" have to survive a 120px thumbnail. */
function cover() {
  return (
    <Slide>
      <Tagline text="the prompt is the asset" center />
      <div style={{ display: "flex", flexDirection: "column", marginTop: "96px" }}>
        <div style={{ display: "flex", fontSize: "205px", fontWeight: 900, letterSpacing: "-6px", lineHeight: 0.9, color: VIOLET }}>
          7 prompts
        </div>
        <div style={{ display: "flex", fontSize: "70px", fontWeight: 700, letterSpacing: "-1.6px", lineHeight: 1.08, color: VIOLET, marginTop: "22px" }}>
          you have rewritten more than five times
        </div>
      </div>
      {/* Contained, unlike the inner slides. The reference crops its artifact
          only after the cover has already earned the swipe. */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          flexGrow: 1,
          marginTop: "72px",
          marginBottom: "64px",
          padding: "44px 48px",
          borderRadius: "30px",
          backgroundColor: CARD,
          boxShadow: "0 18px 44px rgba(26,23,38,0.18)",
        }}
      >
        <div style={{ display: "flex", fontSize: "26px", fontWeight: 700, letterSpacing: "1.5px", color: CARD_MUTED }}>
          YOU
        </div>
        <div style={{ display: "flex", fontSize: "54px", fontWeight: 700, lineHeight: 1.26, color: CARD_TEXT, marginTop: "20px" }}>
          Rewrite this so it sounds like me, not
        </div>
        <div style={{ display: "flex", width: "18px", height: "54px", backgroundColor: VIOLET, marginTop: "6px" }} />
        <div style={{ display: "flex", flexGrow: 1 }} />
        <div style={{ display: "flex", width: "100%", height: "2px", backgroundColor: "rgba(234,232,255,0.14)" }} />
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", marginTop: "26px" }}>
          <div style={{ display: "flex", fontSize: "28px", fontWeight: 400, color: CARD_MUTED }}>draft 6</div>
          <div style={{ display: "flex", fontSize: "28px", fontWeight: 400, color: CARD_MUTED }}>send</div>
        </div>
      </div>
    </Slide>
  );
}

/** Slides 2 and 3. Three prompts each, the lowest cropped. No commentary:
 *  the prompts carry themselves and commentary would tell the reader what to
 *  feel about their own week. */
function triple(a: number, b: number, c: number) {
  const label = (i: number) => String(i + 1).padStart(2, "0");
  return (
    <Slide>
      <Tagline text="the prompt is the asset" />
      <Stack>
        <PromptCard n={label(a)} text={PROMPTS[a]} />
        <Gap />
        <PromptCard n={label(b)} text={PROMPTS[b]} />
        <Gap />
        <PromptCard n={label(c)} text={PROMPTS[c]} />
      </Stack>
    </Slide>
  );
}

/** Slide 4. The last prompt, then the turn. */
function seventh() {
  return (
    <Slide>
      <Tagline text="the prompt is the asset" />
      <Stack>
        <PromptCard n="07" text={PROMPTS[6]} />
        <Gap />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flexGrow: 1.4, flexBasis: 0 }}>
          <div style={{ display: "flex", fontSize: "54px", fontWeight: 700, lineHeight: 1.26, letterSpacing: "-1px", color: INK }}>
            You did not write these seven times because you forgot how.
          </div>
          <div style={{ display: "flex", fontSize: "54px", fontWeight: 700, lineHeight: 1.26, letterSpacing: "-1px", color: VIOLET, marginTop: "26px" }}>
            You wrote them seven times because version six was in a chat log.
          </div>
        </div>
      </Stack>
    </Slide>
  );
}

/** Slide 5. The arithmetic. The reference carries one slide of pure statement
 *  with a solid block bleeding off an edge; this is ours. */
function arithmetic() {
  const Row = ({ big, small, last = false }: { big: string; small: string; last?: boolean }) => (
    <div style={{ display: "flex", flexDirection: "column", marginBottom: last ? "0px" : "52px" }}>
      <div style={{ display: "flex", fontSize: "128px", fontWeight: 900, letterSpacing: "-4px", lineHeight: 0.94, color: last ? VIOLET : INK }}>
        {big}
      </div>
      <div style={{ display: "flex", fontSize: "40px", fontWeight: 400, lineHeight: 1.2, color: INK, opacity: 0.72, marginTop: "10px" }}>
        {small}
      </div>
    </div>
  );
  return (
    <Slide>
      <Tagline text="the prompt is the asset" />
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flexGrow: 1, paddingBottom: "90px", position: "relative" }}>
        <div
          style={{
            display: "flex",
            position: "absolute",
            right: "-64px",
            top: "1000px",
            width: "150px",
            height: "340px",
            backgroundColor: VIOLET,
          }}
        />
        <Row big="7 prompts" small="that you keep needing" />
        <Row big="5 rewrites each" small="because the last version is unreachable" />
        <Row big="35 first drafts" small="of prompts you had already finished once" last />
      </div>
    </Slide>
  );
}

/** Slide 6. The reference closes on a bare "Save for later"; voice.md bans a
 *  bare CTA, so this one names the moment instead. Same job, our voice. */
function closingSlide() {
  return (
    <Slide>
      <Tagline text="the prompt is the asset" />
      <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "center", paddingBottom: "90px" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: "104px", fontWeight: 900, letterSpacing: "-3.4px", lineHeight: 1.06, color: INK }}>
            The writing was
          </div>
          <div style={{ display: "flex", fontSize: "104px", fontWeight: 900, letterSpacing: "-3.4px", lineHeight: 1.06, color: INK }}>
            never the hard part.
          </div>
        </div>
        <div style={{ display: "flex", fontSize: "104px", fontWeight: 900, letterSpacing: "-3.4px", lineHeight: 1.02, color: VIOLET, marginTop: "26px" }}>
          Finding it again was.
        </div>
        <div style={{ display: "flex", fontSize: "40px", fontWeight: 400, lineHeight: 1.35, color: INK, marginTop: "64px", opacity: 0.72 }}>
          Save this. Count them the next time you open a chat.
        </div>
      </div>
    </Slide>
  );
}

/** Slug -> renderer, in swipe order. */
export const PW_POST_02: Record<string, () => React.ReactElement> = {
  "pw-post-02-slide-1": cover,
  "pw-post-02-slide-2": () => triple(0, 1, 2),
  "pw-post-02-slide-3": () => triple(3, 4, 5),
  "pw-post-02-slide-4": seventh,
  "pw-post-02-slide-5": arithmetic,
  "pw-post-02-slide-6": closingSlide,
};
