import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { sendEmail } from "./send";
import * as React from "react";

// Mock the resend module
vi.mock("./resend", () => ({
  resend: {
    emails: {
      send: vi.fn(),
    },
  },
}));

import { resend } from "./resend";

const mockSend = resend.emails.send as ReturnType<typeof vi.fn>;

describe("sendEmail", () => {
  const originalEnv = process.env.RESEND_API_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = "test-api-key";
  });

  afterAll(() => {
    process.env.RESEND_API_KEY = originalEnv;
  });

  it("sends email successfully", async () => {
    mockSend.mockResolvedValue({ data: { id: "email-123" }, error: null });

    const result = await sendEmail({
      to: "test@example.com",
      subject: "Test Subject",
      react: React.createElement("div", null, "Hello"),
    });

    expect(result.success).toBe(true);
    expect(mockSend).toHaveBeenCalledWith({
      from: expect.any(String),
      to: "test@example.com",
      subject: "Test Subject",
      react: expect.anything(),
    });
  });

  it("returns error when Resend API returns error", async () => {
    mockSend.mockResolvedValue({ data: null, error: { message: "Invalid recipient" } });

    const result = await sendEmail({
      to: "bad@example.com",
      subject: "Test",
      react: React.createElement("div", null, "Hello"),
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid recipient");
  });

  it("returns error when send throws", async () => {
    mockSend.mockRejectedValue(new Error("Network error"));

    const result = await sendEmail({
      to: "test@example.com",
      subject: "Test",
      react: React.createElement("div", null, "Hello"),
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Network error");
  });

  it("skips sending when RESEND_API_KEY is not configured", async () => {
    delete process.env.RESEND_API_KEY;

    const result = await sendEmail({
      to: "test@example.com",
      subject: "Test",
      react: React.createElement("div", null, "Hello"),
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("RESEND_API_KEY not configured");
    expect(mockSend).not.toHaveBeenCalled();
  });
});
