/**
 * Renders the link preview card to social-assets/og-preview.png so it can be
 * looked at without deploying. The route at src/app/opengraph-image.tsx serves
 * the same element from src/lib/social/ogImage.tsx.
 * Run: npx tsx scripts/generate-og-preview.tsx
 */
import { ImageResponse } from "next/og";
import * as fs from "fs";
import * as path from "path";
import { ogImageElement, OG_SIZE } from "../src/lib/social/ogImage";

const root = process.cwd();
const font = (f: string) => fs.readFileSync(path.join(root, "public/fonts", f));

async function main() {
  const icon = `data:image/svg+xml;base64,${fs
    .readFileSync(path.join(root, "public/brand-icon-dark.svg"))
    .toString("base64")}`;

  const response = new ImageResponse(ogImageElement(icon), {
    ...OG_SIZE,
    fonts: [
      { name: "Barlow", data: font("Barlow-Regular.ttf"), weight: 400, style: "normal" },
      { name: "Barlow", data: font("Barlow-Bold.ttf"), weight: 700, style: "normal" },
      { name: "Barlow", data: font("Barlow-Black.ttf"), weight: 900, style: "normal" },
    ],
  });

  const out = path.join(root, "social-assets", "og-preview.png");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const buf = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(out, buf);
  console.log(`wrote ${out}  ${Math.round(buf.length / 1024)} KB  ${OG_SIZE.width}x${OG_SIZE.height}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
