import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    lLMCredential: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("@/lib/credentials/encrypt", () => ({
  decryptKey: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { decryptKey } from "@/lib/credentials/encrypt";
import { getUserAgentKey } from "./getUserAgentKey";

const mockFindFirst = vi.mocked(prisma.lLMCredential.findFirst);
const mockDecrypt = vi.mocked(decryptKey);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getUserAgentKey", () => {
  it("returns null when the user has no anthropic credential", async () => {
    mockFindFirst.mockResolvedValue(null);
    const result = await getUserAgentKey("user-1");
    expect(result).toBeNull();
    expect(mockFindFirst).toHaveBeenCalledWith({
      where: { userId: "user-1", provider: "anthropic" },
      orderBy: { updatedAt: "desc" },
    });
  });

  it("returns the decrypted API key when a credential exists", async () => {
    mockFindFirst.mockResolvedValue({
      id: "cred-1",
      userId: "user-1",
      provider: "anthropic",
      label: "Default",
      encryptedKey: "enc-abc",
      iv: "iv-xyz",
      maskedKey: "sk-...XYZ",
      keyType: "standard",
      lastSyncedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);
    mockDecrypt.mockReturnValue("sk-ant-realkey");

    const result = await getUserAgentKey("user-1");

    expect(result).toBe("sk-ant-realkey");
    expect(mockDecrypt).toHaveBeenCalledWith("enc-abc", "iv-xyz");
  });

  it("returns null and warns when decryption throws", async () => {
    mockFindFirst.mockResolvedValue({
      id: "cred-1",
      userId: "user-1",
      provider: "anthropic",
      label: "Default",
      encryptedKey: "corrupted",
      iv: "bad-iv",
      maskedKey: "sk-...XYZ",
      keyType: null,
      lastSyncedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);
    mockDecrypt.mockImplementation(() => {
      throw new Error("decryption failed");
    });
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await getUserAgentKey("user-1");

    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("user-1"),
      expect.any(Error),
    );
    warnSpy.mockRestore();
  });
});
