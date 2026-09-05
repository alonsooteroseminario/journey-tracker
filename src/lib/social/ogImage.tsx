/**
 * The link preview card for buildcadence.co.
 *
 * The campaign's only acquisition path is the Instagram bio link, so this image
 * is what every DM, Slack paste and repost of the domain renders as. Without it
 * they render a bare grey box.
 *
 * Shared by `src/app/opengraph-image.tsx` (serves it) and
 * `scripts/generate-og-preview.tsx` (writes a PNG so it can be looked at).
 * The palette and type match the Instagram carousels in
 * `promptWalletCarousel.tsx`, so a shared link looks like the grid it came from.
 */
import * as React from "react";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_ALT = "Prompt Wallet — your prompts, actually organized";

const CREAM = "#F0EDE6";
const VIOLET = "#5B50E8";
const INK = "#1A1726";

/** `icon` is a data URI. Omitted rather than broken if it cannot be loaded. */
export function ogImageElement(icon?: string) {
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        padding: "72px 80px",
        alignItems: "center",
        backgroundColor: CREAM,
        backgroundImage: `linear-gradient(150deg, #F6F3ED 0%, ${CREAM} 48%, #EBE6DC 100%)`,
        fontFamily: "Barlow",
        position: "relative",
      }}
    >
      {/* the carousels bleed a block off an edge; this keeps the family resemblance */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          right: 0,
          bottom: "-110px",
          width: "104px",
          height: "250px",
          backgroundColor: VIOLET,
        }}
      />

      <div style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
        <div
          style={{
            display: "flex",
            fontSize: "26px",
            fontWeight: 700,
            letterSpacing: "-0.3px",
            color: VIOLET,
            marginBottom: "28px",
          }}
        >
          the prompt is the asset
        </div>
        <div
          style={{
            display: "flex",
            fontSize: "82px",
            fontWeight: 900,
            letterSpacing: "-2.6px",
            lineHeight: 1.04,
            color: INK,
          }}
        >
          Your prompts,
        </div>
        <div
          style={{
            display: "flex",
            fontSize: "82px",
            fontWeight: 900,
            letterSpacing: "-2.6px",
            lineHeight: 1.04,
            color: VIOLET,
          }}
        >
          actually organized
        </div>
        <div
          style={{
            display: "flex",
            fontSize: "34px",
            fontWeight: 400,
            lineHeight: 1.35,
            color: INK,
            opacity: 0.74,
            marginTop: "30px",
          }}
        >
          Save the ones that work. Reuse them in seconds.
        </div>
        <div
          style={{
            display: "flex",
            fontSize: "27px",
            fontWeight: 700,
            color: VIOLET,
            marginTop: "34px",
          }}
        >
          buildcadence.co
        </div>
      </div>

      {icon ? (
        <div style={{ display: "flex", marginLeft: "64px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={icon} width={268} height={268} alt="" />
        </div>
      ) : null}
    </div>
  );
}
