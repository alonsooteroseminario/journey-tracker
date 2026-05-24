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
      subject: "Welcome to Cadence!",
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

  it("sends goalDeleted email", async () => {
    mockFindUnique.mockResolvedValue({
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
      emailPreferences: { enabled: true, frequency: "immediate", goalDeleted: true },
    });
    mockSendEmail.mockResolvedValue({ success: true });

    const result = await notify("user-123", "goalDeleted", {
      goalTitle: "My Goal",
    });

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ subject: expect.stringContaining("My Goal") })
    );
    expect(result.success).toBe(true);
  });

  it("sends friendInvitation email", async () => {
    mockFindUnique.mockResolvedValue({
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
      emailPreferences: { enabled: true, frequency: "immediate", friendInvitation: true },
    });
    mockSendEmail.mockResolvedValue({ success: true });

    const result = await notify("user-123", "friendInvitation", {
      invitationCode: "ABC123",
    });

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ subject: expect.stringContaining("invitation") })
    );
    expect(result.success).toBe(true);
  });

  it("sends goalPublished email", async () => {
    mockFindUnique.mockResolvedValue({
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
      emailPreferences: { enabled: true, frequency: "immediate", goalPublished: true },
    });
    mockSendEmail.mockResolvedValue({ success: true });

    const result = await notify("user-123", "goalPublished", {
      goalTitle: "Fitness Plan",
    });

    expect(result.success).toBe(true);
    expect(mockSendEmail).toHaveBeenCalled();
  });

  it("sends goalShared email", async () => {
    mockFindUnique.mockResolvedValue({
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
      emailPreferences: { enabled: true, frequency: "immediate", goalShared: true },
    });
    mockSendEmail.mockResolvedValue({ success: true });

    const result = await notify("user-123", "goalShared", {
      goalTitle: "Fitness Plan",
    });

    expect(result.success).toBe(true);
    expect(mockSendEmail).toHaveBeenCalled();
  });

  it("sends goalForked email", async () => {
    mockFindUnique.mockResolvedValue({
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
      emailPreferences: { enabled: true, frequency: "immediate", goalForked: true },
    });
    mockSendEmail.mockResolvedValue({ success: true });

    const result = await notify("user-123", "goalForked", {
      goalTitle: "Fitness Plan",
      forkerName: "Alice",
      totalForks: 3,
    });

    expect(result.success).toBe(true);
    expect(mockSendEmail).toHaveBeenCalled();
  });

  it("sends streakReminder email", async () => {
    mockFindUnique.mockResolvedValue({
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
      emailPreferences: { enabled: true, frequency: "immediate", streakReminder: true },
    });
    mockSendEmail.mockResolvedValue({ success: true });

    const result = await notify("user-123", "streakReminder", {
      currentStreak: 5,
    });

    expect(result.success).toBe(true);
    expect(mockSendEmail).toHaveBeenCalled();
  });

  it("sends friendActivity email", async () => {
    mockFindUnique.mockResolvedValue({
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
      emailPreferences: { enabled: true, frequency: "immediate", friendActivity: true },
    });
    mockSendEmail.mockResolvedValue({ success: true });

    const result = await notify("user-123", "friendActivity", {
      friendName: "Bob",
      friendStreak: 10,
    });

    expect(result.success).toBe(true);
    expect(mockSendEmail).toHaveBeenCalled();
  });

  it("returns skipped for unknown notification type", async () => {
    mockFindUnique.mockResolvedValue({
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
      emailPreferences: { enabled: true },
    });

    const result = await notify("user-123", "unknownType" as never, {});

    // Unknown type has no preference key, so it is treated as disabled — skips silently
    expect(result.success).toBe(true);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });
});
