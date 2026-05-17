#!/usr/bin/env node
/*
 * F1 — Theme Token Codemod
 *
 * Replaces literal gray/white Tailwind classes with semantic tokens
 * defined in tailwind.config.ts and globals.css.
 *
 * Run after staging your other changes (so you can `git diff` to review):
 *   node scripts/codemod-theme-tokens.mjs <glob>
 *
 * Examples:
 *   node scripts/codemod-theme-tokens.mjs 'src/components/feed/**\/*.tsx'
 *   node scripts/codemod-theme-tokens.mjs 'src/components/**\/*.tsx'
 *
 * Always review the diff before committing. Some files (LandingPage,
 * gradients, intentional dark-only chat surfaces) should NOT be migrated.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { argv, exit } from "node:process";

// Files to skip even if matched by glob.
const SKIP_PATTERNS = [
  /LandingPage\.tsx$/, // Marketing page stays light-only via data-theme override.
  /\.test\.tsx?$/, // Tests should not change.
];

// Order matters!
// 1) Drop redundant `dark:` variants FIRST while the gray classes are still
//    visible, so we don't accidentally migrate them and then have stranded
//    `dark:text-text-muted` clones.
// 2) Then migrate the remaining (light-mode) gray classes to semantic tokens.
const REPLACEMENTS = [
  // ── PHASE 1: Remove dark: variants of gray/white classes ─────────────
  // These were added during Phase B; semantic tokens now handle the dark side.
  // Match optional leading space so we don't leave double spaces.
  [/ ?dark:bg-gray-(?:50|100|200|700|800|900)(?:\/\d{1,3})?\b/g, ""],
  [/ ?dark:bg-white(?:\/\d{1,3})?\b/g, ""],
  [/ ?dark:text-gray-(?:100|200|300|400|500|600|700|800|900)\b/g, ""],
  [/ ?dark:border-gray-(?:100|200|300|600|700|800|900)\b/g, ""],
  [/ ?dark:hover:bg-gray-(?:50|100|200|700|800|900)(?:\/\d{1,3})?\b/g, ""],
  [/ ?dark:hover:text-gray-(?:100|200|300|400|500|600|700|800|900)\b/g, ""],
  [/ ?dark:hover:border-gray-(?:100|200|300|600|700|800|900)\b/g, ""],

  // ── PHASE 2: Modal scrim ─────────────────────────────────────────────
  [/\bbg-black\/(\d{1,3})\b/g, "bg-overlay/$1"],

  // ── PHASE 3: Surfaces ───────────────────────────────────────────────
  [/\bbg-white(?=\b|\/)/g, "bg-surface"],
  [/\bbg-gray-50\b/g, "bg-surface-muted"],
  [/\bbg-gray-100\b/g, "bg-surface-hover"],
  [/\bbg-gray-200\b/g, "bg-surface-hover"],

  [/\bhover:bg-gray-50\b/g, "hover:bg-surface-muted"],
  [/\bhover:bg-gray-100\b/g, "hover:bg-surface-hover"],
  [/\bhover:bg-gray-200\b/g, "hover:bg-surface-hover"],

  // ── PHASE 4: Text ───────────────────────────────────────────────────
  [/\btext-gray-300\b/g, "text-text-muted"], // disabled state — pair with opacity utility
  [/\btext-gray-400\b/g, "text-text-muted"],
  [/\btext-gray-500\b/g, "text-text-muted"],
  [/\btext-gray-600\b/g, "text-text-secondary"],
  [/\btext-gray-700\b/g, "text-text-secondary"],
  [/\btext-gray-800\b/g, "text-text-primary"],
  [/\btext-gray-900\b/g, "text-text-primary"],

  [/\bhover:text-gray-400\b/g, "hover:text-text-muted"],
  [/\bhover:text-gray-500\b/g, "hover:text-text-muted"],
  [/\bhover:text-gray-600\b/g, "hover:text-text-secondary"],
  [/\bhover:text-gray-700\b/g, "hover:text-text-secondary"],
  [/\bhover:text-gray-800\b/g, "hover:text-text-primary"],
  [/\bhover:text-gray-900\b/g, "hover:text-text-primary"],

  // ── PHASE 5: Borders ────────────────────────────────────────────────
  [/\bborder-gray-100\b/g, "border-border"],
  [/\bborder-gray-200\b/g, "border-border"],
  [/\bborder-gray-300\b/g, "border-border-strong"],

  [/\bhover:border-gray-200\b/g, "hover:border-border"],
  [/\bhover:border-gray-300\b/g, "hover:border-border-strong"],

  // ── PHASE 6: Cosmetic cleanup inside className="..." strings only ───
  // Collapse double-spaces and trim leading/trailing whitespace WITHIN
  // a className="..." value. Leaves source-code indentation alone.
];

// Apply className-only cleanup as a post-pass so we never touch code indent.
function cleanClassNames(body) {
  return body.replace(/className="([^"]+)"/g, (_, classes) => {
    const cleaned = classes
      .split(/\s+/)
      .filter((c) => c.length > 0)
      .join(" ");
    return `className="${cleaned}"`;
  });
}

function migrate(content) {
  let body = content;
  for (const [re, to] of REPLACEMENTS) {
    body = body.replace(re, to);
  }
  body = cleanClassNames(body);
  return body;
}

const targetDir = argv[2];
if (!targetDir) {
  console.error("Usage: node scripts/codemod-theme-tokens.mjs <dir>");
  console.error("Example: node scripts/codemod-theme-tokens.mjs src/components/feed");
  exit(1);
}

// Use grep to find candidate files (those containing at least one stale class).
// This is portable and fast. Falls back to all .tsx if the pattern returns empty.
let files = [];
try {
  const raw = execSync(
    `grep -lrE 'bg-(white|gray-[0-9])|text-gray-[0-9]+|border-gray-[0-9]+' ${targetDir} --include='*.tsx' --include='*.ts' || true`,
    { encoding: "utf8" },
  ).trim();
  if (raw) files = raw.split("\n");
} catch {
  /* grep returns non-zero if no matches; treat as empty list */
}

if (files.length === 0) {
  console.log(`No files in ${targetDir} contain stale gray/white classes. Nothing to do.`);
  exit(0);
}

let changed = 0;
let skipped = 0;
for (const file of files) {
  if (SKIP_PATTERNS.some((re) => re.test(file))) {
    skipped++;
    continue;
  }

  const original = readFileSync(file, "utf8");
  const updated = migrate(original);
  if (updated !== original) {
    writeFileSync(file, updated);
    changed++;
    console.log(`✓ ${file}`);
  }
}

console.log(
  `\nDone. ${changed} files changed, ${skipped} skipped, ${files.length - changed - skipped} unchanged.`,
);
console.log("Review diff: git diff --stat");
console.log("Or:           git diff <path>");
