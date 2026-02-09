import { describe, it, expect, vi, beforeEach } from "vitest";
import { notify } from "./notifications";
import { prisma } from "@/lib/prisma";
import * as sendModule from "./send";

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

vi.mock("./send", () => ({
  sendEmail: vi.fn(),
}));

const mockFindUnique = prisma.user.findUnique as ReturnType<typeof vi.fn>;
const mockCreatePreferences = prisma.emailPreferences.create as ReturnType<typeof vi.fn>;
const mockSendEmail = sendModule.sendEmail as ReturnType<typeof vi.fn>;

describe("notify", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error if user not found", async () => {
    mockFindUnique.mockResolvedValue(null);

    const result = await notify("user-123", "goalCreated", {
      goalTitle: "Test Goal",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("User not found");
  });

  it("skips sending if notifications are disabled", async () => {
    mockFindUnique.mockResolvedValue({
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
      emailPreferences: {
        enabled: false,
        goalCreated: true,
      },
    });

    const result = await notify("user-123", "goalCreated", {
      goalTitle: "Test Goal",
    });

    expect(result.success).toBe(true);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("skips sending if specific notification type is disabled", async () => {
    mockFindUnique.mockResolvedValue({
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
      emailPreferences: {
        enabled: true,
        goalCreated: false,
      },
    });

    const result = await notify("user-123", "goalCreated", {
      goalTitle: "Test Goal",
    });

    expect(result.success).toBe(true);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("creates default preferences if none exist", async () => {
    mockFindUnique.mockResolvedValue({
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
      emailPreferences: null,
    });

    mockCreatePreferences.mockResolvedValue({
      userId: "user-123",
      enabled: true,
      goalCreated: true,
    });

    mockSendEmail.mockResolvedValue({ success: true });

    const result = await notify("user-123", "goalCreated", {
      goalTitle: "Test Goal",
      taskCount: 5,
    });

    expect(mockCreatePreferences).toHaveBeenCalledWith({
      data: { userId: "user-123" },
    });
    expect(result.success).toBe(true);
  });

  it("sends email for enabled notification type", async () => {
    mockFindUnique.mockResolvedValue({
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
      emailPreferences: {
        enabled: true,
        frequency: "immediate",
        goalCreated: true,
      },
    });

    mockSendEmail.mockResolvedValue({ success: true });

    const result = await notify("user-123", "goalCreated", {
      goalTitle: "Test Goal",
      taskCount: 3,
    });

    expect(mockSendEmail).toHaveBeenCalledWith({
      to: "test@example.com",
      subject: "New goal created: Test Goal",
      react: expect.anything(),
    });
    expect(result.success).toBe(true);
  });

  it("sends welcome email", async () => {
    mockFindUnique.mockResolvedValue({
      id: "user-123",
      email: "test@example.com",
      name: "John Doe",
      emailPreferences: {
        enabled: true,
        frequency: "immediate",
        welcomeEmail: true,
      },
    });

    mockSendEmail.mockResolvedValue({ success: true });

    const result = await notify("user-123", "welcomeEmail", {
      userName: "John Doe",
    });

    expect(mockSendEmail).toHaveBeenCalledWith({
      to: "test@example.com",
      subject: "Welcome to Journey Tracker!",
      react: expect.anything(),
    });
    expect(result.success).toBe(true);
  });

  it("sends streak milestone email", async () => {
    mockFindUnique.mockResolvedValue({
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
      emailPreferences: {
        enabled: true,
        frequency: "immediate",
        streakMilestone: true,
      },
    });

    mockSendEmail.mockResolvedValue({ success: true });

    const result = await notify("user-123", "streakMilestone", {
      streakCount: 7,
    });

    expect(mockSendEmail).toHaveBeenCalledWith({
      to: "test@example.com",
      subject: "7-day streak milestone!",
      react: expect.anything(),
    });
    expect(result.success).toBe(true);
  });
});
