import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Import the Tailwind config directly. Path is relative to project root.
import tailwindConfig from "../../../tailwind.config";

const SEMANTIC_TOKENS = [
  "app",
  "surface",
  "text",
  "border",
  "overlay",
] as const;

const TEXT_KEYS = ["primary", "secondary", "muted"] as const;
const SURFACE_KEYS = ["DEFAULT", "elevated", "hover", "muted"] as const;
const BORDER_KEYS = ["DEFAULT", "strong"] as const;

const GLOBALS_CSS_PATH = join(__dirname, "..", "..", "app", "globals.css");

function readGlobals(): string {
  return readFileSync(GLOBALS_CSS_PATH, "utf8");
}

describe("F1 semantic theme tokens", () => {
  describe("tailwind.config.ts", () => {
    it("registers all five semantic top-level tokens under theme.extend.colors", () => {
      const colors =
        (tailwindConfig.theme?.extend as { colors?: Record<string, unknown> } | undefined)
          ?.colors ?? {};

      for (const token of SEMANTIC_TOKENS) {
        expect(colors).toHaveProperty(token);
      }
    });

    it("uses the rgb(var(--token) / <alpha-value>) pattern so alpha utilities work in both themes", () => {
      const colors =
        (tailwindConfig.theme?.extend as { colors?: Record<string, Record<string, unknown> | string> } | undefined)
          ?.colors ?? {};

      // `app` is a flat token — single string value
      expect(typeof colors.app).toBe("string");
      expect(colors.app as string).toMatch(/rgb\(var\(--[a-z-]+\) \/ <alpha-value>\)/);

      // `overlay` is also flat
      expect(typeof colors.overlay).toBe("string");
      expect(colors.overlay as string).toMatch(/rgb\(var\(--[a-z-]+\) \/ <alpha-value>\)/);

      // surface, text, border are nested
      const surface = colors.surface as Record<string, string>;
      for (const key of SURFACE_KEYS) {
        expect(surface[key]).toMatch(/rgb\(var\(--[a-z-]+\) \/ <alpha-value>\)/);
      }

      const text = colors.text as Record<string, string>;
      for (const key of TEXT_KEYS) {
        expect(text[key]).toMatch(/rgb\(var\(--[a-z-]+\) \/ <alpha-value>\)/);
      }

      const border = colors.border as Record<string, string>;
      for (const key of BORDER_KEYS) {
        expect(border[key]).toMatch(/rgb\(var\(--[a-z-]+\) \/ <alpha-value>\)/);
      }
    });

    it("preserves existing brand and streak palettes verbatim", () => {
      const colors =
        (tailwindConfig.theme?.extend as { colors?: Record<string, Record<string, string>> } | undefined)
          ?.colors ?? {};

      expect(colors.brand.primary).toBe("#5B50E8");
      expect(colors.brand.secondary).toBe("#7B6FFF");
      expect(colors.streak.fire).toBe("#FF9600");
    });
  });

  describe("globals.css CSS variables", () => {
    it(":root defines RGB-triplet variables for every semantic token", () => {
      const css = readGlobals();
      // Light theme values — each must be three integers 0-255 separated by spaces.
      const required = [
        "--bg-app",
        "--surface-default",
        "--surface-elevated",
        "--surface-hover",
        "--surface-muted",
        "--text-primary",
        "--text-secondary",
        "--text-muted",
        "--border-default",
        "--border-strong",
        "--overlay",
      ];

      // Match :root block specifically (not html.dark) — non-greedy up to next } that closes the block
      const rootBlock = css.match(/:root\s*\{([\s\S]*?)\n\}/);
      expect(rootBlock, ":root block must exist in globals.css").toBeTruthy();
      const rootBody = rootBlock?.[1] ?? "";

      for (const v of required) {
        // Each variable must be defined as an RGB triplet (three numbers separated by spaces, optional with /alpha)
        const re = new RegExp(`${v}\\s*:\\s*\\d{1,3}\\s+\\d{1,3}\\s+\\d{1,3}`);
        expect(rootBody, `${v} must be an RGB triplet in :root`).toMatch(re);
      }
    });

    it('[data-theme="light"] island block exists for LandingPage exemption', () => {
      const css = readGlobals();
      const lightIsland = css.match(/\[data-theme="light"\]\s*\{([\s\S]*?)\n\}/);
      expect(lightIsland, '[data-theme="light"] block must exist in globals.css').toBeTruthy();
      const body = lightIsland?.[1] ?? "";
      // The light island must redeclare the surface tokens so they survive
      // even when html.dark is set on the root.
      expect(body).toMatch(/--bg-app\s*:\s*\d{1,3}\s+\d{1,3}\s+\d{1,3}/);
      expect(body).toMatch(/--surface-default\s*:\s*\d{1,3}\s+\d{1,3}\s+\d{1,3}/);
      expect(body).toMatch(/--text-primary\s*:\s*\d{1,3}\s+\d{1,3}\s+\d{1,3}/);
    });

    it("html.dark overrides each semantic variable with a dark RGB triplet", () => {
      const css = readGlobals();
      const required = [
        "--bg-app",
        "--surface-default",
        "--surface-elevated",
        "--surface-hover",
        "--surface-muted",
        "--text-primary",
        "--text-secondary",
        "--text-muted",
        "--border-default",
        "--border-strong",
        "--overlay",
      ];

      const darkBlock = css.match(/html\.dark\s*\{([\s\S]*?)\n\}/);
      expect(darkBlock, "html.dark block must exist in globals.css").toBeTruthy();
      const darkBody = darkBlock?.[1] ?? "";

      for (const v of required) {
        const re = new RegExp(`${v}\\s*:\\s*\\d{1,3}\\s+\\d{1,3}\\s+\\d{1,3}`);
        expect(darkBody, `${v} must be an RGB triplet in html.dark`).toMatch(re);
      }
    });
  });
});
