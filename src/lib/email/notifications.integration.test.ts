import { describe, it, expect, vi, beforeEach } from "vitest";
import { notify } from "./notifications";
import { prisma } from "@/lib/prisma";

// Mock sendEmail
vi.mock("./send", () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    emailPreferences: {
      create: vi.fn(),
    },
  },
}));

describe("notify - email preferences integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should NOT send email when master toggle is disabled", async () => {
    const mockUser = {
      id: "user_123",
      email: "test@example.com",
      name: "Test User",
      emailPreferences: {
        enabled: false,
        goalCreated: true,
      },
    };

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

    const result = await notify("user_123", "goalCreated", {
      goalTitle: "Test Goal",
    });

    expect(result.success).toBe(true);
    const { sendEmail } = await import("./send");
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("should NOT send email when specific notification type is disabled", async () => {
    const mockUser = {
      id: "user_123",
      email: "test@example.com",
      name: "Test User",
      emailPreferences: {
        enabled: true,
        goalCreated: false, // This specific type is disabled
      },
    };

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

    const result = await notify("user_123", "goalCreated", {
      goalTitle: "Test Goal",
    });

    expect(result.success).toBe(true);
    const { sendEmail } = await import("./send");
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("should send email when both master and type-specific toggles are enabled", async () => {
    const mockUser = {
      id: "user_123",
      email: "test@example.com",
      name: "Test User",
      emailPreferences: {
        enabled: true,
        goalCreated: true,
        frequency: "immediate",
      },
    };

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

    const result = await notify("user_123", "goalCreated", {
      goalTitle: "Test Goal",
    });

    expect(result.success).toBe(true);
    const { sendEmail } = await import("./send");
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "test@example.com",
        subject: expect.stringContaining("Test Goal"),
      })
    );
  });

  it("should create default preferences if none exist", async () => {
    const mockUser = {
      id: "user_123",
      email: "test@example.com",
      name: "Test User",
      emailPreferences: null,
    };
    const mockDefaultPreferences = {
      enabled: true,
      goalCreated: true,
      frequency: "immediate",
    };

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.emailPreferences.create).mockResolvedValue(
      mockDefaultPreferences as any
    );

    const result = await notify("user_123", "goalCreated", {
      goalTitle: "Test Goal",
    });

    expect(prisma.emailPreferences.create).toHaveBeenCalledWith({
      data: { userId: "user_123" },
    });
    expect(result.success).toBe(true);
  });
});
