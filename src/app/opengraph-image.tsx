import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { ImageResponse } from "next/og";
import { ogImageElement, OG_SIZE, OG_ALT } from "@/lib/social/ogImage";

export const alt = OG_ALT;
export const size = OG_SIZE;
export const contentType = "image/png";

/**
 * Assets are read with `fs` off a `new URL(..., import.meta.url)` path, not
 * `fetch`. Next's file tracer follows the literal URL form into the serverless
 * bundle, but `fetch` on the resulting `file:` URL throws "not implemented"
 * in Node's undici and fails the prerender.
 */
const asset = (p: string) => readFileSync(fileURLToPath(new URL(p, import.meta.url)));

export default async function OpengraphImage() {
  let icon: string | undefined;
  try {
    icon = `data:image/svg+xml;base64,${asset("./icon.svg").toString("base64")}`;
  } catch {
    // the card is still correct without the mark; never fail the whole image
  }

  return new ImageResponse(ogImageElement(icon), {
    ...size,
    fonts: [
      { name: "Barlow", data: asset("../../public/fonts/Barlow-Regular.ttf"), weight: 400, style: "normal" },
      { name: "Barlow", data: asset("../../public/fonts/Barlow-Bold.ttf"), weight: 700, style: "normal" },
      { name: "Barlow", data: asset("../../public/fonts/Barlow-Black.ttf"), weight: 900, style: "normal" },
    ],
  });
}
