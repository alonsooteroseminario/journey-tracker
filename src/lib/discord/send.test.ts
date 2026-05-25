import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendDiscordMessage, buildTaskReminderEmbed, buildStreakReminderEmbed } from "./send";

const WEBHOOK = "https://discord.com/api/webhooks/test/token";

describe("sendDiscordMessage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns false when webhookUrl is empty", async () => {
    const result = await sendDiscordMessage("", { content: "hi" });
    expect(result).toBe(false);
  });

  it("POSTs to the webhook URL and returns true on 204", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
    const result = await sendDiscordMessage(WEBHOOK, { content: "hello" });
    expect(result).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      WEBHOOK,
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("returns false when fetch returns non-ok status", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    const result = await sendDiscordMessage(WEBHOOK, { content: "hello" });
    expect(result).toBe(false);
  });

  it("returns false when fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")));
    const result = await sendDiscordMessage(WEBHOOK, { content: "hello" });
    expect(result).toBe(false);
  });

  it("includes username: Cadence in the POST body", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
    await sendDiscordMessage(WEBHOOK, { content: "test" });
    const body = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body.username).toBe("Cadence");
  });
});

describe("buildTaskReminderEmbed", () => {
  it("sets title with task count", () => {
    const embed = buildTaskReminderEmbed("Alice", [
      { title: "Task A", goalTitle: "Goal 1" },
      { title: "Task B", goalTitle: "Goal 2" },
    ]);
    expect(embed.title).toContain("2 tasks");
  });

  it("sets singular title for one task", () => {
    const embed = buildTaskReminderEmbed("Alice", [{ title: "Task A", goalTitle: "Goal 1" }]);
    expect(embed.title).toContain("1 task");
    expect(embed.title).not.toContain("tasks");
  });

  it("includes task titles in description", () => {
    const embed = buildTaskReminderEmbed("Alice", [
      { title: "Write tests", goalTitle: "Ship v1" },
    ]);
    expect(embed.description).toContain("Write tests");
    expect(embed.description).toContain("Ship v1");
  });

  it("appends aiContext as italic when provided", () => {
    const embed = buildTaskReminderEmbed("Alice", [{ title: "T", goalTitle: "G" }], "You got this!");
    expect(embed.description).toContain("_You got this!_");
  });

  it("omits aiContext block when null", () => {
    const embed = buildTaskReminderEmbed("Alice", [{ title: "T", goalTitle: "G" }], null);
    expect(embed.description).not.toContain("You got this");
  });

  it("formats due date when present", () => {
    const embed = buildTaskReminderEmbed("Alice", [
      { title: "T", goalTitle: "G", dueDate: "2026-06-01" },
    ]);
    expect(embed.description).toContain("Jun 1");
  });
});

describe("buildStreakReminderEmbed", () => {
  it("includes streak count in title", () => {
    const embed = buildStreakReminderEmbed("Alice", 14);
    expect(embed.title).toContain("14-day streak");
  });

  it("mentions the user name", () => {
    const embed = buildStreakReminderEmbed("Bob", 7);
    expect(embed.description).toContain("Bob");
  });

  it("appends aiContext as italic when provided", () => {
    const embed = buildStreakReminderEmbed("Alice", 5, "Small steps count!");
    expect(embed.description).toContain("_Small steps count!_");
  });

  it("omits aiContext block when null", () => {
    const embed = buildStreakReminderEmbed("Alice", 5, null);
    expect(embed.description).not.toContain("_");
  });
});
