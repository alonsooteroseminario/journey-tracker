import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const hex = process.env.CREDENTIAL_ENCRYPTION_KEY;
  if (!hex) {
    throw new Error("CREDENTIAL_ENCRYPTION_KEY environment variable is not set");
  }
  const key = Buffer.from(hex, "hex");
  if (key.length !== 32) {
    throw new Error("CREDENTIAL_ENCRYPTION_KEY must be a 32-byte hex string (64 hex chars)");
  }
  return key;
}

export function encryptKey(plaintext: string): { encryptedKey: string; iv: string } {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const combined = Buffer.concat([encrypted, authTag]);
  return {
    encryptedKey: combined.toString("base64"),
    iv: iv.toString("base64"),
  };
}

export function decryptKey(encryptedKey: string, iv: string): string {
  const key = getKey();
  const ivBuf = Buffer.from(iv, "base64");
  const combined = Buffer.from(encryptedKey, "base64");
  const authTag = combined.subarray(combined.length - 16);
  const encrypted = combined.subarray(0, combined.length - 16);
  const decipher = createDecipheriv(ALGORITHM, key, ivBuf);
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted) + decipher.final("utf8");
}
