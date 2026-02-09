import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PATCH } from "./route";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/auth");
vi.mock("@/lib/email/notifications", () => ({}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    emailPreferences: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

const mockGetCurrentUser = getCurrentUser as ReturnType<typeof vi.fn>;
const mockFindUnique = prisma.emailPreferences.findUnique as ReturnType<typeof vi.fn>;
const mockCreate = prisma.emailPreferences.create as ReturnType<typeof vi.fn>;
const mockUpdate = prisma.emailPreferences.update as ReturnType<typeof vi.fn>;

describe("GET /api/email-preferences", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if user is not authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("creates default preferences if none exist", async () => {
    mockGetCurrentUser.mockResolvedValue({ id: "user-123", email: "test@example.com" });
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue({
      id: "pref-123",
      userId: "user-123",
      enabled: true,
      frequency: "daily",
      welcomeEmail: true,
    });

    const response = await GET();
    const data = await response.json();

    expect(mockCreate).toHaveBeenCalledWith({
      data: { userId: "user-123" },
    });
    expect(response.status).toBe(200);
    expect(data.userId).toBe("user-123");
  });

  it("returns existing preferences", async () => {
    const existingPrefs = {
      id: "pref-123",
      userId: "user-123",
      enabled: true,
      frequency: "immediate",
    };

    mockGetCurrentUser.mockResolvedValue({ id: "user-123", email: "test@example.com" });
    mockFindUnique.mockResolvedValue(existingPrefs);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(existingPrefs);
    expect(mockCreate).not.toHaveBeenCalled();
  });
});

describe("PATCH /api/email-preferences", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if user is not authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const request = new Request("http://localhost/api/email-preferences", {
      method: "PATCH",
      body: JSON.stringify({ enabled: false }),
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("updates existing preferences", async () => {
    mockGetCurrentUser.mockResolvedValue({ id: "user-123", email: "test@example.com" });
    mockFindUnique.mockResolvedValue({ id: "pref-123", userId: "user-123" });
    mockUpdate.mockResolvedValue({
      id: "pref-123",
      userId: "user-123",
      enabled: false,
    });

    const request = new Request("http://localhost/api/email-preferences", {
      method: "PATCH",
      body: JSON.stringify({ enabled: false }),
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { userId: "user-123" },
      data: { enabled: false },
    });
    expect(response.status).toBe(200);
    expect(data.enabled).toBe(false);
  });

  it("creates preferences if none exist during update", async () => {
    mockGetCurrentUser.mockResolvedValue({ id: "user-123", email: "test@example.com" });
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue({
      id: "pref-123",
      userId: "user-123",
      frequency: "weekly",
    });

    const request = new Request("http://localhost/api/email-preferences", {
      method: "PATCH",
      body: JSON.stringify({ frequency: "weekly" }),
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(mockCreate).toHaveBeenCalledWith({
      data: { userId: "user-123", frequency: "weekly" },
    });
    expect(response.status).toBe(200);
  });

  it("returns 400 for invalid data", async () => {
    mockGetCurrentUser.mockResolvedValue({ id: "user-123", email: "test@example.com" });

    const request = new Request("http://localhost/api/email-preferences", {
      method: "PATCH",
      body: JSON.stringify({ frequency: "invalid" }),
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid request data");
  });
});
