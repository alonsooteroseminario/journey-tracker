import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";

// Mock auth
vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(),
}));

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    forkRequest: {
      findMany: vi.fn(),
    },
  },
}));

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

describe("GET /api/fork-requests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if not authenticated", async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const response = await GET();
    expect(response.status).toBe(401);
  });

  it("should return fork requests for the user's templates", async () => {
    const mockUser = { id: "user-1", name: "Author" };
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);

    const mockRequests = [
      {
        id: "req-1",
        templateId: "template-1",
        requesterId: "user-2",
        status: "pending",
        requester: { id: "user-2", name: "Requester", profileImage: null },
        template: { id: "template-1", title: "My Goal", icon: "🎯" },
      },
    ];

    (prisma.forkRequest.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockRequests);

    const response = await GET();
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveLength(1);
    expect(data[0].status).toBe("pending");
  });

  it("should return empty array when no requests", async () => {
    const mockUser = { id: "user-1", name: "Author" };
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    (prisma.forkRequest.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const response = await GET();
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveLength(0);
  });
});
