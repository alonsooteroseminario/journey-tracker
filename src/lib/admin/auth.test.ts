import { describe, it, expect, vi, beforeEach } from "vitest";
import { isAdmin } from "./auth";
import type { User } from "@prisma/client";

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
