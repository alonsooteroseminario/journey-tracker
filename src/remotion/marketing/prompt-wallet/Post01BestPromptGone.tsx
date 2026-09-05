import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

/*
 * Post 01: "Your best prompt is already gone"
 * Week 1 of the Prompt Wallet launch. Vertical reel, 1080x1920, 30fps.
 * 2550 frames = 85s.
 *
 * Rules this scene follows (docs/brand/reference-teardown.md):
 *  - Second person only. The product is never named or shown.
 *  - Numbered chapter tags, ~5s shots, no CTA in the video.
 *  - UI lives in floating rounded cards, never raw fullscreen capture.
 *  - Closes on a portable mental model.
 *
 * Chapter map:
 *   Cold open       0    –  210   (0:00 – 0:07)
 *   01 THE LOSS     210  –  720   (0:07 – 0:24)
 *   02 WHY IT IS    720  – 1230   (0:24 – 0:41)
 *   03 THE TAX      1230 – 1740   (0:41 – 0:58)
 *   04 THE TEST     1740 – 2160   (0:58 – 1:12)
 *   05 THE REFRAME  2160 – 2550   (1:12 – 1:25)
 */

/* ── Chapter time scale ──
 * Each chapter keeps its original internal frame numbers and divides the real
 * frame by its scale, so one constant retimes a whole chapter. Values are the
 * measured voiceover length plus tail room, over the original duration.
 */
const S_COLD = 315 / 210;
const S_CH1 = 744 / 510;
const S_CH2 = 777 / 510;
const S_CH3 = 717 / 510;
const S_CH4 = 585 / 420;
const S_CH5 = 714 / 390;

/* ── Palette: brand tokens on a near-black violet ground ── */
const INK = "#0A0913";
const CARD = "#171331";
const CARD_DEAD = "#15141C";
const VIOLET = "#7B6FFF";
const VIOLET_DEEP = "#5B50E8";
const LIGHT = "#EAE8FF";
const MUTED = "#8B85C1";
const CORAL = "#F08080";

const SANS = "Arial, Helvetica, sans-serif";
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

/* Reels chrome covers roughly the top 220px and bottom 420px. */
const SAFE_TOP = 300;
const SAFE_BOTTOM = 440;

/* ── Small shared pieces ── */

/* Every chapter runs on its own time scale. The shared pieces read it from
 * context so a Line at frame N means the same instant as a fade at frame N. */
const ScaleCtx = React.createContext(1);
const useScaledFrame = () => useCurrentFrame() / React.useContext(ScaleCtx);

const fadeIn = (frame: number, at: number, over = 12) =>
  interpolate(frame, [at, at + over], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

const fadeOut = (frame: number, at: number, over = 12) =>
  interpolate(frame, [at, at + over], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

const typed = (text: string, frame: number, from: number, to: number) =>
  text.slice(
    0,
    Math.max(
      0,
      Math.round(
        interpolate(frame, [from, to], [0, text.length], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      )
    )
  );

const ChapterTag: React.FC<{ n: string; label: string }> = ({ n, label }) => {
  const frame = useScaledFrame();
  const o = fadeIn(frame, -12, 10);
  const slide = interpolate(frame, [-12, -2], [-24, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        top: SAFE_TOP - 130,
        left: 72,
        zIndex: 20,
        display: "flex",
        alignItems: "center",
        gap: 18,
        opacity: o,
        transform: `translateX(${slide}px)`,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          backgroundColor: VIOLET_DEEP,
          color: "#fff",
          fontFamily: MONO,
          fontSize: 26,
          fontWeight: "bold",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {n}
      </div>
      <div
        style={{
          fontFamily: MONO,
          fontSize: 26,
          letterSpacing: 4,
          color: MUTED,
        }}
      >
        {label}
      </div>
    </div>
  );
};

/* One line of spoken emphasis. The graphics carry the beat, not full subtitles. */
const Line: React.FC<{
  children: React.ReactNode;
  at: number;
  out?: number;
  size?: number;
  color?: string;
  weight?: number;
  align?: "left" | "center";
}> = ({
  children,
  at,
  out,
  size = 58,
  color = LIGHT,
  weight = 400,
  align = "left",
}) => {
  const frame = useScaledFrame();
  const { fps } = useVideoConfig();
  const rise = spring({
    frame: frame - at,
    fps,
    config: { damping: 200, stiffness: 90 },
  });
  const o = fadeIn(frame, at, 10) * (out === undefined ? 1 : fadeOut(frame, out, 10));
  return (
    <div
      style={{
        fontFamily: SANS,
        fontSize: size,
        fontWeight: weight,
        color,
        lineHeight: 1.22,
        letterSpacing: -0.5,
        textAlign: align,
        opacity: o,
        transform: `translateY(${interpolate(rise, [0, 1], [16, 0])}px)`,
      }}
    >
      {children}
    </div>
  );
};

const Stage: React.FC<{ children: React.ReactNode; gap?: number }> = ({
  children,
  gap = 22,
}) => (
  <AbsoluteFill
    style={{
      backgroundColor: INK,
      paddingTop: SAFE_TOP,
      paddingBottom: SAFE_BOTTOM,
      paddingLeft: 72,
      paddingRight: 72,
      justifyContent: "center",
    }}
  >
    <div style={{ display: "flex", flexDirection: "column", gap }}>{children}</div>
  </AbsoluteFill>
);

/* A prompt sitting in a floating rounded card. Never a raw screen capture. */
const PromptCard: React.FC<{
  body: string;
  live?: boolean;
  style?: React.CSSProperties;
}> = ({ body, live = true, style }) => (
  <div
    style={{
      backgroundColor: live ? CARD : CARD_DEAD,
      border: `1px solid ${live ? "rgba(123,111,255,0.45)" : "rgba(139,133,193,0.13)"}`,
      borderRadius: 26,
      padding: "30px 34px",
      boxShadow: live
        ? "0 34px 70px rgba(0,0,0,0.6), 0 0 0 6px rgba(91,80,232,0.10)"
        : "0 18px 40px rgba(0,0,0,0.5)",
      ...style,
    }}
  >
    <div
      style={{
        fontFamily: MONO,
        fontSize: 21,
        letterSpacing: 3,
        color: live ? VIOLET : "rgba(139,133,193,0.5)",
        marginBottom: 16,
      }}
    >
      PROMPT
    </div>
    <div
      style={{
        fontFamily: MONO,
        fontSize: 30,
        lineHeight: 1.5,
        color: live ? LIGHT : "rgba(234,232,255,0.30)",
        whiteSpace: "pre-wrap",
      }}
    >
      {body}
    </div>
  </div>
);

const PROMPT_TEXT =
  "You are a senior editor.\nRewrite the draft below.\nKeep every claim, cut every\nadjective that is not load\nbearing. Return only the\nrewrite.";

/* ═══════════════ COLD OPEN, 0:00 to 0:07 ═══════════════ */

const ColdOpen: React.FC = () => {
  const frame = useScaledFrame();

  // The card is alive while it types, then drains of color and drops away.
  const drain = interpolate(frame, [96, 126], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const drop = interpolate(frame, [104, 150], [0, 300], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const shrink = interpolate(frame, [104, 150], [1, 0.82], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cardOpacity = interpolate(frame, [126, 168], [1, 0.18], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const caret = frame < 92 && Math.floor(frame / 8) % 2 === 0 ? "█" : " ";

  return (
    <AbsoluteFill
      style={{
        backgroundColor: INK,
        paddingTop: SAFE_TOP,
        paddingBottom: SAFE_BOTTOM,
        paddingLeft: 72,
        paddingRight: 72,
        justifyContent: "center",
      }}
    >
      <div
        style={{
          transform: `translateY(${drop}px) scale(${shrink})`,
          opacity: cardOpacity,
          filter: `grayscale(${drain})`,
        }}
      >
        <PromptCard body={typed(PROMPT_TEXT, frame, 10, 90) + caret} />
      </div>

      <div
        style={{
          position: "absolute",
          left: 72,
          right: 72,
          top: SAFE_TOP + 40,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <Line at={-14} size={62} weight={700}>
          You wrote a prompt that worked.
        </Line>
        <Line at={48} size={62} weight={700} color={MUTED}>
          Not okay. Worked.
        </Line>
        <Line at={126} size={72} weight={900} color={CORAL}>
          It is gone.
        </Line>
      </div>
    </AbsoluteFill>
  );
};

/* ═══════════════ 01 THE LOSS, 0:07 to 0:24 ═══════════════ */

/* 14 transcript rows of varying width. They are meant to look interchangeable. */
const SCROLL_ROWS = Array.from({ length: 24 }, (_, i) => ({
  w: 62 + ((i * 37) % 34),
  h: i % 3 === 0 ? 118 : 92,
}));

const Ch1Loss: React.FC = () => {
  const frame = useScaledFrame();

  const scroll = interpolate(frame, [340, 510], [0, -1500], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const count = Math.round(
    interpolate(frame, [352, 470], [0, 412], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const scrollOpacity = fadeIn(frame, 316, 14);

  // The one that mattered flashes violet for six frames, then is just another row.
  const flash = frame >= 396 && frame < 402 ? 1 : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: INK }}>
      <ChapterTag n="01" label="THE LOSS" />

      {/* Shot A + B: the three beats, then the line that lands */}
      <AbsoluteFill
        style={{
          paddingTop: SAFE_TOP,
          paddingBottom: SAFE_BOTTOM,
          paddingLeft: 72,
          paddingRight: 72,
          justifyContent: "center",
          opacity: fadeOut(frame, 316, 16),
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Line at={-14} size={56} color={MUTED}>
            Three messages deep.
          </Line>
          <Line at={62} size={56} color={MUTED}>
            The fourth try landed.
          </Line>
          <Line at={106} size={56} color={MUTED}>
            You copied the output.
          </Line>
          <div style={{ height: 40 }} />
          <Line at={172} size={82} weight={900} color={LIGHT}>
            You did not copy
          </Line>
          <Line at={186} size={82} weight={900} color={VIOLET}>
            the prompt.
          </Line>
        </div>
      </AbsoluteFill>

      {/* Shot C: it is in there, with four hundred other things */}
      <AbsoluteFill style={{ opacity: scrollOpacity }}>
        {/* Clipped band, so the rows never reach the chapter tag */}
        <div
          style={{
            position: "absolute",
            left: 72,
            right: 72,
            top: 430,
            height: 700,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              transform: `translateY(${scroll}px)`,
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            {SCROLL_ROWS.map((r, i) => (
              <div
                key={i}
                style={{
                  height: r.h,
                  width: `${r.w}%`,
                  borderRadius: 18,
                  backgroundColor: i === 6 && flash ? VIOLET_DEEP : CARD,
                  border: `1px solid rgba(139,133,193,${i === 6 && flash ? 0.9 : 0.22})`,
                }}
              />
            ))}
          </div>

          {/* Soft edges so the band reads as a list with no end */}
          <AbsoluteFill
            style={{
              background: `linear-gradient(to bottom, ${INK} 0%, rgba(10,9,19,0) 15%, rgba(10,9,19,0) 85%, ${INK} 100%)`,
            }}
          />
        </div>

        <div style={{ position: "absolute", left: 72, right: 72, top: 1190 }}>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 150,
              fontWeight: "bold",
              color: LIGHT,
              letterSpacing: -4,
              lineHeight: 1,
            }}
          >
            {count}
          </div>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 28,
              letterSpacing: 5,
              color: MUTED,
              marginTop: 14,
            }}
          >
            CONVERSATIONS DEEP
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ═══════════════ 02 WHY IT IS GONE, 0:24 to 0:41 ═══════════════ */

/* Sorted by time, which means sorted by nothing. */
const TIME_ROWS = [
  { t: "14:02", s: "fix the typo in this line" },
  { t: "14:06", s: "You are a senior editor. Rewrite the draft below" },
  { t: "14:11", s: "what is a webhook" },
  { t: "14:20", s: "dinner ideas for tonight" },
];

const Ch2Transcript: React.FC = () => {
  const frame = useScaledFrame();

  const listOpacity = fadeIn(frame, 142, 14) * fadeOut(frame, 336, 14);
  const ring = interpolate(frame, [274, 292], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const searchOpacity = fadeIn(frame, 336, 14);
  const query = typed("the one about the", frame, 348, 400);
  const noResults = fadeIn(frame, 412, 12);

  return (
    <AbsoluteFill style={{ backgroundColor: INK }}>
      <ChapterTag n="02" label="WHY IT IS GONE" />

      {/* Shot A */}
      <AbsoluteFill
        style={{
          paddingTop: SAFE_TOP,
          paddingBottom: SAFE_BOTTOM,
          paddingLeft: 72,
          paddingRight: 72,
          justifyContent: "center",
          opacity: fadeOut(frame, 142, 14),
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Line at={-14} size={72} weight={900}>
            Chat history is not
          </Line>
          <Line at={-4} size={72} weight={900}>
            a filing system.
          </Line>
          <div style={{ height: 26 }} />
          <Line at={82} size={62} color={VIOLET} weight={700}>
            It is a transcript.
          </Line>
          <Line at={104} size={46} color={MUTED}>
            Ordered by time, not by usefulness.
          </Line>
        </div>
      </AbsoluteFill>

      {/* Shot B: four rows, identical weight */}
      <AbsoluteFill
        style={{
          paddingTop: SAFE_TOP,
          paddingBottom: SAFE_BOTTOM,
          paddingLeft: 72,
          paddingRight: 72,
          justifyContent: "center",
          opacity: listOpacity,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {TIME_ROWS.map((r, i) => {
            const isBest = i === 1;
            return (
              <div
                key={r.t}
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  gap: 26,
                  backgroundColor: CARD_DEAD,
                  border: `1px solid rgba(139,133,193,${isBest ? 0.12 + ring * 0.75 : 0.12})`,
                  boxShadow: isBest
                    ? `0 0 0 ${ring * 4}px rgba(91,80,232,${ring * 0.22})`
                    : "none",
                  borderRadius: 20,
                  padding: "30px 32px",
                  opacity: fadeIn(frame, 150 + i * 16, 10),
                }}
              >
                <div style={{ fontFamily: MONO, fontSize: 28, color: MUTED }}>
                  {r.t}
                </div>
                <div
                  style={{
                    fontFamily: SANS,
                    fontSize: 32,
                    color: "rgba(234,232,255,0.72)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {r.s}
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 46,
            opacity: fadeIn(frame, 296, 12),
          }}
        >
          <div style={{ fontFamily: SANS, fontSize: 46, color: LIGHT, lineHeight: 1.3 }}>
            Your best prompt and a typo question
            <br />
            carry exactly the same weight.
          </div>
        </div>
      </AbsoluteFill>

      {/* Shot C: search only works if you remember the words */}
      <AbsoluteFill
        style={{
          paddingTop: SAFE_TOP,
          paddingBottom: SAFE_BOTTOM,
          paddingLeft: 72,
          paddingRight: 72,
          justifyContent: "center",
          opacity: searchOpacity,
        }}
      >
        <div
          style={{
            backgroundColor: CARD,
            border: "1px solid rgba(139,133,193,0.22)",
            borderRadius: 22,
            padding: "34px 36px",
            boxShadow: "0 30px 60px rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          <div style={{ fontFamily: MONO, fontSize: 34, color: MUTED }}>/</div>
          <div style={{ fontFamily: MONO, fontSize: 34, color: LIGHT }}>
            {query}
            {Math.floor(frame / 8) % 2 === 0 ? "|" : " "}
          </div>
        </div>

        <div
          style={{
            marginTop: 34,
            opacity: noResults,
            fontFamily: MONO,
            fontSize: 30,
            letterSpacing: 3,
            color: CORAL,
          }}
        >
          NO RESULTS
        </div>

        <div style={{ marginTop: 56 }}>
          <Line at={424} size={52} weight={700}>
            Search only helps when you
          </Line>
          <Line at={432} size={52} weight={700}>
            already remember the words.
          </Line>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ═══════════════ 03 THE TAX, 0:41 to 0:58 ═══════════════ */

const ATTEMPTS = ["v1", "v2", "v3", "v4"];

const Ch3Tax: React.FC = () => {
  const frame = useScaledFrame();
  const { fps } = useVideoConfig();

  const chipsOpacity = fadeIn(frame, 132, 14) * fadeOut(frame, 348, 14);

  // Chips build to v4, then the whole row snaps back to v1. That snap is the point.
  const reset = frame >= 286;
  const shown = reset
    ? 1
    : Math.max(
        1,
        Math.min(
          4,
          Math.floor(
            interpolate(frame, [132, 274], [1, 4.95], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          )
        )
      );

  const snap = spring({
    frame: frame - 286,
    fps,
    config: { damping: 9, stiffness: 220 },
  });
  const snapScale = reset ? interpolate(snap, [0, 1], [1.16, 1]) : 1;

  const minutes = shown * 2;

  return (
    <AbsoluteFill style={{ backgroundColor: INK }}>
      <ChapterTag n="03" label="THE TAX" />

      {/* Shot A */}
      <AbsoluteFill
        style={{
          paddingTop: SAFE_TOP,
          paddingBottom: SAFE_BOTTOM,
          paddingLeft: 72,
          paddingRight: 72,
          justifyContent: "center",
          opacity: fadeOut(frame, 132, 14),
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Line at={-14} size={58} color={MUTED}>
            So you rewrite it.
          </Line>
          <div style={{ height: 18 }} />
          <Line at={64} size={70} weight={900}>
            You do not start from
          </Line>
          <Line at={74} size={70} weight={900}>
            your last version.
          </Line>
          <div style={{ height: 18 }} />
          <Line at={110} size={64} weight={900} color={CORAL}>
            You start from zero.
          </Line>
        </div>
      </AbsoluteFill>

      {/* Shot B: four rounds of fixing, paid again */}
      <AbsoluteFill
        style={{
          paddingTop: SAFE_TOP,
          paddingBottom: SAFE_BOTTOM,
          paddingLeft: 72,
          paddingRight: 72,
          justifyContent: "center",
          opacity: chipsOpacity,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 18,
            transform: `scale(${snapScale})`,
            transformOrigin: "left center",
          }}
        >
          {ATTEMPTS.map((a, i) => {
            const on = i < shown;
            return (
              <div
                key={a}
                style={{
                  flex: 1,
                  height: 190,
                  borderRadius: 22,
                  backgroundColor: on ? CARD : "transparent",
                  border: `1px ${on ? "solid" : "dashed"} rgba(139,133,193,${on ? 0.4 : 0.16})`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 44,
                    fontWeight: "bold",
                    color: on ? LIGHT : "rgba(139,133,193,0.3)",
                  }}
                >
                  {a}
                </div>
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 24,
                    color: on ? VIOLET : "transparent",
                  }}
                >
                  +2 min
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 54, display: "flex", alignItems: "baseline", gap: 20 }}>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 120,
              fontWeight: "bold",
              color: reset ? CORAL : LIGHT,
              letterSpacing: -2,
              flexShrink: 0,
            }}
          >
            {minutes}
          </div>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 30,
              letterSpacing: 4,
              color: MUTED,
              flexShrink: 0,
            }}
          >
            MINUTES, AGAIN
          </div>
        </div>

        <div style={{ marginTop: 30, opacity: fadeIn(frame, 300, 12) }}>
          <div style={{ fontFamily: SANS, fontSize: 46, color: LIGHT }}>
            Fourth time this month.
          </div>
        </div>
      </AbsoluteFill>

      {/* Shot C */}
      <AbsoluteFill
        style={{
          paddingTop: SAFE_TOP,
          paddingBottom: SAFE_BOTTOM,
          paddingLeft: 72,
          paddingRight: 72,
          justifyContent: "center",
          opacity: fadeIn(frame, 348, 14),
        }}
      >
        <Line at={356} size={84} weight={900}>
          Every rewrite is
        </Line>
        <Line at={366} size={84} weight={900} color={VIOLET}>
          a first draft.
        </Line>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ═══════════════ 04 THE TEST, 0:58 to 1:12 ═══════════════ */

const mmss = (totalSeconds: number) => {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const Ch4Test: React.FC = () => {
  const frame = useScaledFrame();

  const watchOpacity = fadeIn(frame, 96, 14) * fadeOut(frame, 292, 14);
  const elapsed = interpolate(frame, [126, 288], [0, 74], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const watchColor = elapsed < 10 ? VIOLET : elapsed < 60 ? LIGHT : CORAL;

  return (
    <AbsoluteFill style={{ backgroundColor: INK }}>
      <ChapterTag n="04" label="THE TEST" />

      {/* Shot A */}
      <AbsoluteFill
        style={{
          paddingTop: SAFE_TOP,
          paddingBottom: SAFE_BOTTOM,
          paddingLeft: 72,
          paddingRight: 72,
          justifyContent: "center",
          opacity: fadeOut(frame, 96, 14),
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Line at={-14} size={58} color={VIOLET} weight={700}>
            Try this now.
          </Line>
          <div style={{ height: 14 }} />
          <Line at={48} size={62} weight={900}>
            Think of the one prompt
          </Line>
          <Line at={58} size={62} weight={900}>
            you would hate to lose.
          </Line>
          <div style={{ height: 14 }} />
          <Line at={80} size={44} color={MUTED}>
            Open your tool. Find it. Time yourself.
          </Line>
        </div>
      </AbsoluteFill>

      {/* Shot B: the stopwatch does the arguing */}
      <AbsoluteFill
        style={{
          paddingTop: SAFE_TOP,
          paddingBottom: SAFE_BOTTOM,
          paddingLeft: 72,
          paddingRight: 72,
          justifyContent: "center",
          alignItems: "center",
          opacity: watchOpacity,
        }}
      >
        <div
          style={{
            fontFamily: MONO,
            fontSize: 250,
            fontWeight: "bold",
            color: watchColor,
            letterSpacing: -6,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {mmss(elapsed)}
        </div>

        <div
          style={{
            marginTop: 40,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "24px 30px",
              borderRadius: 18,
              border: `1px solid rgba(123,111,255,${elapsed < 10 ? 0.85 : 0.16})`,
              backgroundColor: elapsed < 10 ? "rgba(91,80,232,0.16)" : "transparent",
            }}
          >
            <span style={{ fontFamily: MONO, fontSize: 30, color: MUTED }}>
              UNDER 0:10
            </span>
            <span style={{ fontFamily: SANS, fontSize: 38, color: LIGHT }}>
              a system
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "24px 30px",
              borderRadius: 18,
              border: `1px solid rgba(240,128,128,${elapsed >= 60 ? 0.85 : 0.16})`,
              backgroundColor: elapsed >= 60 ? "rgba(240,128,128,0.13)" : "transparent",
            }}
          >
            <span style={{ fontFamily: MONO, fontSize: 30, color: MUTED }}>
              OVER 1:00
            </span>
            <span style={{ fontFamily: SANS, fontSize: 38, color: LIGHT }}>
              a transcript
            </span>
          </div>
        </div>
      </AbsoluteFill>

      {/* Shot C */}
      <AbsoluteFill
        style={{
          paddingTop: SAFE_TOP,
          paddingBottom: SAFE_BOTTOM,
          paddingLeft: 72,
          paddingRight: 72,
          justifyContent: "center",
          opacity: fadeIn(frame, 292, 14),
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Line at={300} size={56} weight={700}>
            Most people land near a minute.
          </Line>
          <Line at={332} size={48} color={MUTED}>
            That is not a memory problem.
          </Line>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ═══════════════ 05 THE REFRAME, 1:12 to 1:25 ═══════════════ */

const Ch5Reframe: React.FC = () => {
  const frame = useScaledFrame();

  const strike = interpolate(frame, [58, 82], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const closeOpacity = fadeIn(frame, 200, 16);
  const openOpacity = fadeOut(frame, 200, 16);
  const handleOpacity = fadeIn(frame, 340, 20);

  return (
    <AbsoluteFill style={{ backgroundColor: INK }}>
      <ChapterTag n="05" label="THE REFRAME" />

      {/* Shot A: strike the wrong diagnosis, name the right one */}
      <AbsoluteFill
        style={{
          paddingTop: SAFE_TOP,
          paddingBottom: SAFE_BOTTOM,
          paddingLeft: 72,
          paddingRight: 72,
          justifyContent: "center",
          opacity: openOpacity,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Line at={-14} size={46} color={MUTED}>
            You do not have
          </Line>
          <div style={{ position: "relative", width: "fit-content" }}>
            <Line at={-4} size={68} weight={900}>
              a prompt writing problem.
            </Line>
            <div
              style={{
                position: "absolute",
                left: 0,
                top: "52%",
                height: 7,
                width: `${strike}%`,
                backgroundColor: CORAL,
                borderRadius: 4,
              }}
            />
          </div>
          <div style={{ height: 34 }} />
          <Line at={150} size={46} color={MUTED}>
            You have
          </Line>
          <Line at={160} size={78} weight={900} color={VIOLET}>
            a retrieval problem.
          </Line>
        </div>
      </AbsoluteFill>

      {/* Shot B: the portable model. No CTA. */}
      <AbsoluteFill
        style={{
          paddingTop: SAFE_TOP,
          paddingBottom: SAFE_BOTTOM,
          paddingLeft: 72,
          paddingRight: 72,
          justifyContent: "center",
          opacity: closeOpacity,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <Line at={228} size={88} weight={900}>
            Your prompt is
          </Line>
          <Line at={236} size={88} weight={900} color={VIOLET}>
            the asset.
          </Line>
          <div style={{ height: 30 }} />
          <Line at={268} size={62} weight={400} color={MUTED}>
            The chat log is just
          </Line>
          <Line at={276} size={62} weight={400} color={MUTED}>
            the receipt.
          </Line>
        </div>
      </AbsoluteFill>

      {/* Attribution, not a call to action */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: SAFE_BOTTOM - 90,
          textAlign: "center",
          opacity: handleOpacity,
          fontFamily: MONO,
          fontSize: 28,
          letterSpacing: 4,
          color: "rgba(139,133,193,0.75)",
        }}
      >
        @BUILDCADENCE.CO
      </div>
    </AbsoluteFill>
  );
};

/* ═══════════════ Timeline ═══════════════ */

/*
 * 3852 frames = 128.4s at 30fps.
 *
 * Chapter lengths are set by the measured voiceover, not the other way round.
 * The read came back at about 100 wpm, which is the unhurried delivery the
 * script asks for, so the picture stretched to meet it. Still inside the 60 to
 * 150s band in the launch plan, and the 65k reference reel ran 148s.
 *
 *   Cold open       0    –  315   (0:00 – 0:10.5)
 *   01 THE LOSS     315  – 1059   (0:10.5 – 0:35.3)
 *   02 WHY IT IS    1059 – 1836   (0:35.3 – 1:01.2)
 *   03 THE TAX      1836 – 2553   (1:01.2 – 1:25.1)
 *   04 THE TEST     2553 – 3138   (1:25.1 – 1:44.6)
 *   05 THE REFRAME  3138 – 3852   (1:44.6 – 2:08.4)
 */

export const POST_01_DURATION = 3852;

const A = (f: string) => staticFile(`audio/post-01/${f}`);

/* Voiceover, one clip per chapter, each cued a beat after its cut so the
 * words never land on the transition. */
const VO: { from: number; file: string }[] = [
  { from: 18, file: "vo-00-cold.mp3" },
  { from: 328, file: "vo-01-loss.mp3" },
  { from: 1072, file: "vo-02-why.mp3" },
  { from: 1849, file: "vo-03-tax.mp3" },
  { from: 2566, file: "vo-04-test.mp3" },
  { from: 3151, file: "vo-05-reframe.mp3" },
];

export const Post01BestPromptGone: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: INK }}>
    <Sequence from={0} durationInFrames={315}>
      <ScaleCtx.Provider value={S_COLD}>
        <ColdOpen />
      </ScaleCtx.Provider>
    </Sequence>
    <Sequence from={315} durationInFrames={744}>
      <ScaleCtx.Provider value={S_CH1}>
        <Ch1Loss />
      </ScaleCtx.Provider>
    </Sequence>
    <Sequence from={1059} durationInFrames={777}>
      <ScaleCtx.Provider value={S_CH2}>
        <Ch2Transcript />
      </ScaleCtx.Provider>
    </Sequence>
    <Sequence from={1836} durationInFrames={717}>
      <ScaleCtx.Provider value={S_CH3}>
        <Ch3Tax />
      </ScaleCtx.Provider>
    </Sequence>
    <Sequence from={2553} durationInFrames={585}>
      <ScaleCtx.Provider value={S_CH4}>
        <Ch4Test />
      </ScaleCtx.Provider>
    </Sequence>
    <Sequence from={3138} durationInFrames={714}>
      <ScaleCtx.Provider value={S_CH5}>
        <Ch5Reframe />
      </ScaleCtx.Provider>
    </Sequence>

    {/* Levels are baked into the files by scripts/audio, so everything plays at
     * unity here. Voice sits at -16 LUFS, bed 18 dB under it, SFX peaks -17 dB. */}
    <Audio src={A("music.mp3")} volume={1} />
    {/* Interface cues: typing, the card falling, chapter wooshes, the reset snap. */}
    <Audio src={A("sfx.mp3")} volume={1} />

    {VO.map((v) => (
      <Sequence key={v.file} from={v.from}>
        <Audio src={A(v.file)} volume={1} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
