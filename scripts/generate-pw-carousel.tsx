/**
 * Writes the Prompt Wallet campaign carousel to /social-assets as PNGs.
 * Templates live in src/lib/social/promptWalletCarousel.tsx.
 * Run: npx tsx scripts/generate-pw-carousel.tsx
 */
import { ImageResponse } from "next/og";
import * as fs from "fs";
import * as path from "path";
import { PW_POST_02, fonts, W, H } from "../src/lib/social/promptWalletCarousel";

const OUT_DIR = path.join(process.cwd(), "social-assets");

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const [slug, render] of Object.entries(PW_POST_02)) {
    const response = new ImageResponse(render(), { width: W, height: H, fonts: fonts() });
    const buf = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(path.join(OUT_DIR, `${slug}.png`), buf);
    console.log(`wrote ${slug}.png  ${Math.round(buf.length / 1024)} KB`);
  }

  console.log(`\n${Object.keys(PW_POST_02).length} slides written to ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
