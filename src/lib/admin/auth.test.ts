import { describe, it, expect, vi, beforeEach } from "vitest";
import { isAdmin, requireAdmin, hasFullAccess, requireFullAccess } from "./auth";
import type { User } from "@prisma/client";

vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn().mockImplementation((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

import { getCurrentUser } from "@/lib/auth";
const mockGetCurrentUser = getCurrentUser as ReturnType<typeof vi.fn>;

describe("isAdmin", () => {
  const mockUser: User = {
    id: "test-user-id",
    clerkId: "clerk_123",
    email: "admin@example.com",
    name: "Admin User",
    profileImage: null,
    bio: null,
    location: null,
    timezone: null,
    joinedDate: new Date(),
    lastLoginDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.resetModules();
    delete process.env.OWNER_ADMIN_EMAIL;
  });

  it("should return false when user is null", () => {
    process.env.OWNER_ADMIN_EMAIL = "admin@example.com";
    expect(isAdmin(null)).toBe(false);
  });

  it("should return false when OWNER_ADMIN_EMAIL is not configured", () => {
    expect(isAdmin(mockUser)).toBe(false);
  });

  it("should return true when user email matches OWNER_ADMIN_EMAIL", () => {
    process.env.OWNER_ADMIN_EMAIL = "admin@example.com";
    expect(isAdmin(mockUser)).toBe(true);
  });

  it("should return false when user email does not match OWNER_ADMIN_EMAIL", () => {
    process.env.OWNER_ADMIN_EMAIL = "different@example.com";
    expect(isAdmin(mockUser)).toBe(false);
  });

  it("should be case-sensitive for email comparison", () => {
    process.env.OWNER_ADMIN_EMAIL = "ADMIN@EXAMPLE.COM";
    expect(isAdmin(mockUser)).toBe(false);
  });
});

describe("requireAdmin", () => {
  const mockUser = {
    id: "test-user-id",
    clerkId: "clerk_123",
    email: "admin@example.com",
    name: "Admin User",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OWNER_ADMIN_EMAIL = "admin@example.com";
  });

  it("redirects to /sign-in when user is not authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null);
    await expect(requireAdmin()).rejects.toThrow("REDIRECT:/sign-in");
  });

  it("redirects to / when user is not admin", async () => {
    process.env.OWNER_ADMIN_EMAIL = "other@example.com";
    mockGetCurrentUser.mockResolvedValue(mockUser);
    await expect(requireAdmin()).rejects.toThrow("REDIRECT:/");
  });

  it("returns user when authenticated and admin", async () => {
    mockGetCurrentUser.mockResolvedValue(mockUser);
    const result = await requireAdmin();
    expect(result).toBe(mockUser);
  });
});

describe("hasFullAccess", () => {
  const mockUser = {
    id: "u1", clerkId: "clerk_123", email: "person@example.com", name: "Person",
  } as unknown as User;

  beforeEach(() => {
    delete process.env.OWNER_ADMIN_EMAIL;
    delete process.env.FULL_ACCESS_EMAILS;
  });

  it("returns false for a null user", () => {
    process.env.FULL_ACCESS_EMAILS = "person@example.com";
    expect(hasFullAccess(null)).toBe(false);
  });

  it("returns true for the admin even when the allowlist is unset", () => {
    process.env.OWNER_ADMIN_EMAIL = "person@example.com";
    expect(hasFullAccess(mockUser)).toBe(true);
  });

  it("returns false when neither env var is configured", () => {
    expect(hasFullAccess(mockUser)).toBe(false);
  });

  it("returns true when the email is on the allowlist", () => {
    process.env.FULL_ACCESS_EMAILS = "person@example.com";
    expect(hasFullAccess(mockUser)).toBe(true);
  });

  it("matches the allowlist case-insensitively", () => {
    process.env.FULL_ACCESS_EMAILS = "PERSON@EXAMPLE.COM";
    expect(hasFullAccess(mockUser)).toBe(true);
  });

  it("tolerates whitespace and empty entries in the list", () => {
    process.env.FULL_ACCESS_EMAILS = " ,  person@example.com , ";
    expect(hasFullAccess(mockUser)).toBe(true);
  });

  it("returns false for an email not on the allowlist", () => {
    process.env.FULL_ACCESS_EMAILS = "someone@example.com,other@example.com";
    expect(hasFullAccess(mockUser)).toBe(false);
  });

  it("does not treat an empty allowlist as matching everyone", () => {
    process.env.FULL_ACCESS_EMAILS = "";
    expect(hasFullAccess(mockUser)).toBe(false);
  });
});

describe("requireFullAccess", () => {
  const mockUser = {
    id: "u1", clerkId: "clerk_123", email: "person@example.com", name: "Person",
  } as unknown as User;

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.OWNER_ADMIN_EMAIL;
    delete process.env.FULL_ACCESS_EMAILS;
  });

  it("redirects to /sign-in when not authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null);
    await expect(requireFullAccess()).rejects.toThrow("REDIRECT:/sign-in");
  });

  it("redirects to /wallet when the user lacks full access", async () => {
    mockGetCurrentUser.mockResolvedValue(mockUser);
    await expect(requireFullAccess()).rejects.toThrow("REDIRECT:/wallet");
  });

  it("returns the user when they have full access", async () => {
    process.env.FULL_ACCESS_EMAILS = "person@example.com";
    mockGetCurrentUser.mockResolvedValue(mockUser);
    expect(await requireFullAccess()).toBe(mockUser);
  });
});
