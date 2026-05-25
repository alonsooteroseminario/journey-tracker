import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DiscordWebhookForm } from "./DiscordWebhookForm";

const VALID_URL = "https://discord.com/api/webhooks/123/abc";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("DiscordWebhookForm — no existing webhook", () => {
  it("renders URL input and Save button", () => {
    render(<DiscordWebhookForm initialUrl={null} />);
    expect(screen.getByLabelText("Discord webhook URL")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Save Webhook" })).toBeTruthy();
  });

  it("Save button is disabled when input is empty (not dirty)", () => {
    render(<DiscordWebhookForm initialUrl={null} />);
    const btn = screen.getByRole("button", { name: "Save Webhook" });
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });

  it("shows validation error for non-Discord URL", async () => {
    render(<DiscordWebhookForm initialUrl={null} />);
    const input = screen.getByLabelText("Discord webhook URL");
    fireEvent.change(input, { target: { value: "https://example.com/webhook" } });
    const btn = screen.getByRole("button", { name: "Save Webhook" });
    fireEvent.click(btn);
    await waitFor(() => {
      expect(screen.getByText(/Must be a Discord webhook URL/i)).toBeTruthy();
    });
  });

  it("calls PATCH /api/email-preferences on save with valid URL", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal("fetch", mockFetch);

    render(<DiscordWebhookForm initialUrl={null} />);
    const input = screen.getByLabelText("Discord webhook URL");
    fireEvent.change(input, { target: { value: VALID_URL } });
    fireEvent.click(screen.getByRole("button", { name: "Save Webhook" }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/email-preferences",
        expect.objectContaining({ method: "PATCH" }),
      );
    });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.discordWebhookUrl).toBe(VALID_URL);
  });

  it("shows success message after save", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
    render(<DiscordWebhookForm initialUrl={null} />);
    fireEvent.change(screen.getByLabelText("Discord webhook URL"), { target: { value: VALID_URL } });
    fireEvent.click(screen.getByRole("button", { name: "Save Webhook" }));
    await waitFor(() => {
      expect(screen.getByText(/Webhook saved/i)).toBeTruthy();
    });
  });

  it("shows error message when API returns error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Invalid URL" }),
    }));
    render(<DiscordWebhookForm initialUrl={null} />);
    fireEvent.change(screen.getByLabelText("Discord webhook URL"), { target: { value: VALID_URL } });
    fireEvent.click(screen.getByRole("button", { name: "Save Webhook" }));
    await waitFor(() => {
      expect(screen.getByText("Invalid URL")).toBeTruthy();
    });
  });
});

describe("DiscordWebhookForm — existing webhook", () => {
  it("shows masked URL and Connected badge", () => {
    render(<DiscordWebhookForm initialUrl={VALID_URL} />);
    expect(screen.getByText(/Connected/)).toBeTruthy();
    // Shows masked URL with ••••••••
    expect(screen.getByText(/••••••••/)).toBeTruthy();
  });

  it("shows Disconnect button when URL is saved", () => {
    render(<DiscordWebhookForm initialUrl={VALID_URL} />);
    expect(screen.getByRole("button", { name: "Disconnect" })).toBeTruthy();
  });

  it("shows Send test ping button when URL is saved", () => {
    render(<DiscordWebhookForm initialUrl={VALID_URL} />);
    expect(screen.getByRole("button", { name: "Send test ping" })).toBeTruthy();
  });

  it("clears URL on Disconnect", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal("fetch", mockFetch);

    render(<DiscordWebhookForm initialUrl={VALID_URL} />);
    fireEvent.click(screen.getByRole("button", { name: "Disconnect" }));

    await waitFor(() => {
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.discordWebhookUrl).toBeNull();
    });
  });

  it("sends test ping to Discord webhook URL", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", mockFetch);

    render(<DiscordWebhookForm initialUrl={VALID_URL} />);
    fireEvent.click(screen.getByRole("button", { name: "Send test ping" }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(VALID_URL, expect.objectContaining({ method: "POST" }));
    });
    expect(screen.getByText(/Test message sent/i)).toBeTruthy();
  });

  it("shows ping fail message when Discord returns error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

    render(<DiscordWebhookForm initialUrl={VALID_URL} />);
    fireEvent.click(screen.getByRole("button", { name: "Send test ping" }));

    await waitFor(() => {
      expect(screen.getByText(/Ping failed/i)).toBeTruthy();
    });
  });
});
