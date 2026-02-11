import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCurrentUser } from "./auth";
import { prisma } from "./prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";

// Mock Clerk and Prisma
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
  clerkClient: vi.fn(() => ({
    users: {
      getUser: vi.fn(),
    },
  })),
}));

vi.mock("./prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("./email/notifications", () => ({
  notify: vi.fn().mockResolvedValue({ success: true }),
}));

describe("getCurrentUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return null when user is not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as any);

    const result = await getCurrentUser();

    expect(result).toBeNull();
  });

  it("should create a new user with Clerk data on first login", async () => {
    const clerkId = "clerk_123";
    const mockClerkUser = {
      id: clerkId,
      fullName: "John Doe",
      firstName: "John",
      emailAddresses: [{ emailAddress: "john@example.com" }],
      imageUrl: "https://example.com/avatar.jpg",
    };
    const mockDbUser = {
      id: "db_123",
      clerkId,
      name: "John Doe",
      email: "john@example.com",
      profileImage: "https://example.com/avatar.jpg",
    };

    const mockGetUser = vi.fn().mockResolvedValue(mockClerkUser);
    vi.mocked(auth).mockResolvedValue({ userId: clerkId } as any);
    vi.mocked(clerkClient).mockResolvedValue({
      users: { getUser: mockGetUser },
    } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue(mockDbUser as any);

    const result = await getCurrentUser();

    expect(mockGetUser).toHaveBeenCalledWith(clerkId);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        clerkId,
        email: "john@example.com",
        name: "John Doe",
        profileImage: "https://example.com/avatar.jpg",
        streakData: {
          create: {
            currentStreak: 0,
            longestStreak: 0,
            streakHistory: [],
          },
        },
      },
    });
    expect(result).toEqual(mockDbUser);
  });

  it("should update existing user when Clerk data has changed", async () => {
    const clerkId = "clerk_123";
    const mockClerkUser = {
      id: clerkId,
      fullName: "Jane Smith",
      emailAddresses: [{ emailAddress: "jane@example.com" }],
      imageUrl: "https://example.com/new-avatar.jpg",
    };
    const existingDbUser = {
      id: "db_123",
      clerkId,
      name: "Old Name",
      email: "old@example.com",
      profileImage: "https://example.com/old-avatar.jpg",
    };
    const updatedDbUser = {
      ...existingDbUser,
      name: "Jane Smith",
      email: "jane@example.com",
      profileImage: "https://example.com/new-avatar.jpg",
    };

    const mockGetUser = vi.fn().mockResolvedValue(mockClerkUser);
    vi.mocked(auth).mockResolvedValue({ userId: clerkId } as any);
    vi.mocked(clerkClient).mockResolvedValue({
      users: { getUser: mockGetUser },
    } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(existingDbUser as any);
    vi.mocked(prisma.user.update).mockResolvedValue(updatedDbUser as any);

    const result = await getCurrentUser();

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "db_123" },
      data: {
        name: "Jane Smith",
        email: "jane@example.com",
        profileImage: "https://example.com/new-avatar.jpg",
      },
    });
    expect(result).toEqual(updatedDbUser);
  });

  it("should NOT update user when Clerk data has NOT changed", async () => {
    const clerkId = "clerk_123";
    const mockClerkUser = {
      id: clerkId,
      fullName: "Jane Smith",
      emailAddresses: [{ emailAddress: "jane@example.com" }],
      imageUrl: "https://example.com/avatar.jpg",
    };
    const existingDbUser = {
      id: "db_123",
      clerkId,
      name: "Jane Smith",
      email: "jane@example.com",
      profileImage: "https://example.com/avatar.jpg",
    };

    const mockGetUser = vi.fn().mockResolvedValue(mockClerkUser);
    vi.mocked(auth).mockResolvedValue({ userId: clerkId } as any);
    vi.mocked(clerkClient).mockResolvedValue({
      users: { getUser: mockGetUser },
    } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(existingDbUser as any);

    const result = await getCurrentUser();

    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(result).toEqual(existingDbUser);
  });

  it("should handle missing Clerk email gracefully", async () => {
    const clerkId = "clerk_123";
    const mockClerkUser = {
      id: clerkId,
      fullName: "John Doe",
      emailAddresses: [],
      imageUrl: null,
    };

    const mockGetUser = vi.fn().mockResolvedValue(mockClerkUser);
    vi.mocked(auth).mockResolvedValue({ userId: clerkId } as any);
    vi.mocked(clerkClient).mockResolvedValue({
      users: { getUser: mockGetUser },
    } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue({ id: "db_123", clerkId } as any);

    await getCurrentUser();

    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: `${clerkId}@placeholder.com`,
        }),
      })
    );
  });
});
