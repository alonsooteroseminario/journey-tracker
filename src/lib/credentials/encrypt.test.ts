import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { encryptKey, decryptKey } from "./encrypt";

const VALID_KEY = "a".repeat(64); // 32-byte hex

describe("encryptKey / decryptKey", () => {
  beforeEach(() => {
    process.env.CREDENTIAL_ENCRYPTION_KEY = VALID_KEY;
  });

  afterEach(() => {
    delete process.env.CREDENTIAL_ENCRYPTION_KEY;
  });

  it("round-trips a plaintext key", () => {
    const plaintext = "sk-ant-api03-supersecretkey123";
    const { encryptedKey, iv } = encryptKey(plaintext);
    expect(decryptKey(encryptedKey, iv)).toBe(plaintext);
  });

  it("produces different ciphertext each call (random IV)", () => {
    const plaintext = "same-key";
    const first = encryptKey(plaintext);
    const second = encryptKey(plaintext);
    expect(first.iv).not.toBe(second.iv);
    expect(first.encryptedKey).not.toBe(second.encryptedKey);
    // Both still decrypt correctly
    expect(decryptKey(first.encryptedKey, first.iv)).toBe(plaintext);
    expect(decryptKey(second.encryptedKey, second.iv)).toBe(plaintext);
  });

  it("throws when CREDENTIAL_ENCRYPTION_KEY is missing", () => {
    delete process.env.CREDENTIAL_ENCRYPTION_KEY;
    expect(() => encryptKey("anything")).toThrow("CREDENTIAL_ENCRYPTION_KEY");
  });

  it("throws when CREDENTIAL_ENCRYPTION_KEY is wrong length", () => {
    process.env.CREDENTIAL_ENCRYPTION_KEY = "tooshort";
    expect(() => encryptKey("anything")).toThrow("32-byte");
  });

  it("throws when decrypting with wrong IV (auth tag mismatch)", () => {
    const { encryptedKey } = encryptKey("secret");
    const { iv: wrongIv } = encryptKey("other");
    expect(() => decryptKey(encryptedKey, wrongIv)).toThrow();
  });
});
