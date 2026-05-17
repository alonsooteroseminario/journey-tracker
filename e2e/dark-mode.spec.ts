import { test, expect, Page } from "@playwright/test";

/**
 * F1 Dark Mode — Regression Test
 *
 * Locks down the semantic token system end-to-end:
 * - Tailwind config + globals.css produce real computed colors at runtime.
 * - `html.dark` flips every token from light to dark.
 * - `[data-theme="light"]` island survives even when html.dark is present
 *   (so LandingPage stays light no matter what).
 *
 * No auth required — runs against /sign-in which loads our root layout.
 */

const ROUTE = "/sign-in";

async function setDark(page: Page, isDark: boolean) {
  await page.evaluate((dark) => {
    // Persist the choice in localStorage so ThemeProvider, when it (re)mounts
    // or fires a system-pref listener, doesn't reset our manual class change.
    try {
      localStorage.setItem("theme", dark ? "dark" : "light");
    } catch {
      /* private mode */
    }
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    // Force style recompute by reading layout property.
    void document.documentElement.offsetHeight;
  }, isDark);
}

/** Render a probe element with a class, return its computed background color. */
async function probeBg(page: Page, className: string): Promise<string> {
  return page.evaluate((cls) => {
    const probe = document.createElement("div");
    probe.className = cls;
    probe.style.cssText = "width:10px;height:10px;position:absolute;left:-9999px;";
    probe.setAttribute("data-probe", "true");
    document.body.appendChild(probe);
    const color = window.getComputedStyle(probe).backgroundColor;
    probe.remove();
    return color;
  }, className);
}

async function probeColor(page: Page, className: string): Promise<string> {
  return page.evaluate((cls) => {
    const probe = document.createElement("div");
    probe.className = cls;
    probe.textContent = "X";
    probe.style.cssText = "width:10px;height:10px;position:absolute;left:-9999px;";
    probe.setAttribute("data-probe", "true");
    document.body.appendChild(probe);
    const color = window.getComputedStyle(probe).color;
    probe.remove();
    return color;
  }, className);
}

/** Parse "rgb(R, G, B)" or "rgba(R, G, B, A)" → [R, G, B]. */
function parseRGB(s: string): [number, number, number] {
  const m = s.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) throw new Error(`Could not parse color: ${s}`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function isLight(rgb: [number, number, number]): boolean {
  // Light = WCAG-y luminance > 0.5; here we just average channels.
  const avg = (rgb[0] + rgb[1] + rgb[2]) / 3;
  return avg > 127;
}

test.describe.configure({ mode: "serial" });

test.describe("F1 dark mode tokens", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTE);
    await page.waitForLoadState("domcontentloaded");
    // Wait for Tailwind's CSS to be applied — the bg-surface class must
    // resolve to a real color (not transparent) before we can probe.
    await page.waitForFunction(
      () => {
        const probe = document.createElement("div");
        probe.className = "bg-surface";
        probe.style.cssText = "width:10px;height:10px;position:absolute;left:-9999px;";
        document.body.appendChild(probe);
        const bg = window.getComputedStyle(probe).backgroundColor;
        probe.remove();
        return bg !== "rgba(0, 0, 0, 0)" && bg !== "";
      },
      undefined,
      { timeout: 10000 },
    );
    // After class change, give the engine a tick to recompute.
    // setDark uses page.evaluate which is synchronous in the renderer, but
    // some browsers batch style recompute.
  });

  test("bg-surface flips from light to dark when html.dark is set", async ({ page }) => {
    await setDark(page, false);
    const lightBg = await probeBg(page, "bg-surface");
    expect(isLight(parseRGB(lightBg))).toBe(true);

    await setDark(page, true);
    const darkBg = await probeBg(page, "bg-surface");
    expect(isLight(parseRGB(darkBg))).toBe(false);

    expect(lightBg).not.toBe(darkBg);
  });

  test("text-text-primary flips from dark to light when html.dark is set", async ({ page }) => {
    await setDark(page, false);
    const lightText = await probeColor(page, "text-text-primary");
    expect(isLight(parseRGB(lightText))).toBe(false); // dark text on light bg

    await setDark(page, true);
    const darkText = await probeColor(page, "text-text-primary");
    expect(isLight(parseRGB(darkText))).toBe(true); // light text on dark bg
  });

  test("bg-app reflects the page background token in both themes", async ({ page }) => {
    await setDark(page, false);
    const light = await probeBg(page, "bg-app");
    expect(isLight(parseRGB(light))).toBe(true);

    await setDark(page, true);
    const dark = await probeBg(page, "bg-app");
    expect(isLight(parseRGB(dark))).toBe(false);
  });

  test('[data-theme="light"] island stays light even when html.dark is set', async ({ page }) => {
    await setDark(page, true);
    const islandBg = await page.evaluate(() => {
      const wrapper = document.createElement("div");
      wrapper.setAttribute("data-theme", "light");
      const probe = document.createElement("div");
      probe.className = "bg-surface";
      wrapper.appendChild(probe);
      document.body.appendChild(wrapper);
      const color = window.getComputedStyle(probe).backgroundColor;
      wrapper.remove();
      return color;
    });
    expect(isLight(parseRGB(islandBg))).toBe(true);
  });

  test("brand colors stay literal in both themes (no token swap)", async ({ page }) => {
    await setDark(page, false);
    const light = await probeBg(page, "bg-brand-primary");
    expect(parseRGB(light)).toEqual([91, 80, 232]); // #5B50E8

    await setDark(page, true);
    const dark = await probeBg(page, "bg-brand-primary");
    expect(parseRGB(dark)).toEqual([91, 80, 232]); // unchanged
  });
});
