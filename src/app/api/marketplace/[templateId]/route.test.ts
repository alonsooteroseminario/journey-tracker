import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    goalTemplate: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";

describe("GET /api/marketplace/[templateId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return a published public template", async () => {
    const mockTemplate = {
      id: "template-1",
      title: "Test Template",
      visibility: "public",
      isPublished: true,
      author: { id: "user-1", name: "Test User", profileImage: null },
    };

    (prisma.goalTemplate.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockTemplate);

    const request = new Request("http://localhost/api/marketplace/template-1");
    const response = await GET(request, {
      params: Promise.resolve({ templateId: "template-1" }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.title).toBe("Test Template");
  });

  it("should return 404 for non-existent template", async () => {
    (prisma.goalTemplate.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const request = new Request("http://localhost/api/marketplace/nonexistent");
    const response = await GET(request, {
      params: Promise.resolve({ templateId: "nonexistent" }),
    });

    expect(response.status).toBe(404);
  });

  it("should return 404 for unpublished template", async () => {
    const mockTemplate = {
      id: "template-2",
      title: "Private Template",
      visibility: "public",
      isPublished: false,
      author: { id: "user-1", name: "Test User", profileImage: null },
    };

    (prisma.goalTemplate.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockTemplate);

    const request = new Request("http://localhost/api/marketplace/template-2");
    const response = await GET(request, {
      params: Promise.resolve({ templateId: "template-2" }),
    });

    expect(response.status).toBe(404);
  });

  it("should return 404 for friends-only template", async () => {
    const mockTemplate = {
      id: "template-3",
      title: "Friends Template",
      visibility: "friends",
      isPublished: false,
      author: { id: "user-1", name: "Test User", profileImage: null },
    };

    (prisma.goalTemplate.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockTemplate);

    const request = new Request("http://localhost/api/marketplace/template-3");
    const response = await GET(request, {
      params: Promise.resolve({ templateId: "template-3" }),
    });

    expect(response.status).toBe(404);
  });
});
