import { describe, it, expect } from "vitest";
import { generateShareToken } from "./shareToken";

describe("generateShareToken", () => {
  it("returns a non-empty string", () => {
    expect(typeof generateShareToken()).toBe("string");
    expect(generateShareToken().length).toBeGreaterThan(0);
  });

  it("produces tokens of at least 16 characters (≥128 bits entropy)", () => {
    expect(generateShareToken().length).toBeGreaterThanOrEqual(16);
  });

  it("produces URL-safe characters only (base64url alphabet)", () => {
    const token = generateShareToken();
    // base64url uses A-Z a-z 0-9 - _  (no +, / or =)
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("produces unique tokens across 1000 generations", () => {
    const tokens = new Set(Array.from({ length: 1000 }, () => generateShareToken()));
    expect(tokens.size).toBe(1000);
  });
});
