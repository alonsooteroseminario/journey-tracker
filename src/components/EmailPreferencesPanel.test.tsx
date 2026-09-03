import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { EmailPreferencesPanel } from "./EmailPreferencesPanel";
import * as profileSlice from "@/store/slices/profileSlice";

vi.mock("@/store/slices/profileSlice", () => ({
  useGetEmailPreferencesQuery: vi.fn(),
  useUpdateEmailPreferencesMutation: vi.fn(),
}));

const mockUseGetEmailPreferencesQuery = profileSlice.useGetEmailPreferencesQuery as ReturnType<typeof vi.fn>;
const mockUseUpdateEmailPreferencesMutation = profileSlice.useUpdateEmailPreferencesMutation as ReturnType<typeof vi.fn>;

describe("EmailPreferencesPanel", () => {
  it("shows loading state", () => {
    mockUseGetEmailPreferencesQuery.mockReturnValue({
      data: null,
      isLoading: true,
    });
    mockUseUpdateEmailPreferencesMutation.mockReturnValue([vi.fn()]);

    render(<EmailPreferencesPanel />);

    expect(screen.getByText("Loading preferences...")).toBeInTheDocument();
  });

  it("renders preferences when loaded", () => {
    mockUseGetEmailPreferencesQuery.mockReturnValue({
      data: {
        enabled: true,
        frequency: "daily",
        welcomeEmail: true,
        goalCreated: true,
        streakMilestone: false,
      },
      isLoading: false,
    });
    mockUseUpdateEmailPreferencesMutation.mockReturnValue([vi.fn()]);

    render(<EmailPreferencesPanel />);

    expect(screen.getByText("Email Notifications")).toBeInTheDocument();
    expect(screen.getByText("Enable email notifications")).toBeInTheDocument();
  });

  it("shows disabled state when notifications are off", () => {
    mockUseGetEmailPreferencesQuery.mockReturnValue({
      data: {
        enabled: false,
        frequency: "daily",
        welcomeEmail: true,
      },
      isLoading: false,
    });
    mockUseUpdateEmailPreferencesMutation.mockReturnValue([vi.fn()]);

    render(<EmailPreferencesPanel />);

    expect(
      screen.getByText("Email notifications are disabled. Enable them to customize your preferences.")
    ).toBeInTheDocument();
  });

  it("calls update mutation when toggling master switch", async () => {
    const mockUpdate = vi.fn().mockResolvedValue({ unwrap: () => Promise.resolve({}) });
    mockUseGetEmailPreferencesQuery.mockReturnValue({
      data: {
        enabled: true,
        frequency: "daily",
        welcomeEmail: true,
      },
      isLoading: false,
    });
    mockUseUpdateEmailPreferencesMutation.mockReturnValue([mockUpdate]);

    render(<EmailPreferencesPanel />);

    const masterToggle = screen.getByRole("checkbox", { name: /enable email notifications/i });
    fireEvent.click(masterToggle);

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({ enabled: false });
    });
  });

  it("shows frequency options when enabled", () => {
    mockUseGetEmailPreferencesQuery.mockReturnValue({
      data: {
        enabled: true,
        frequency: "daily",
        welcomeEmail: true,
      },
      isLoading: false,
    });
    mockUseUpdateEmailPreferencesMutation.mockReturnValue([vi.fn()]);

    render(<EmailPreferencesPanel />);

    expect(screen.getByText("Email frequency")).toBeInTheDocument();
    expect(screen.getByText("Immediate")).toBeInTheDocument();
    expect(screen.getByText("Daily digest")).toBeInTheDocument();
    expect(screen.getByText("Weekly summary")).toBeInTheDocument();
  });

  it("calls update mutation when changing frequency", async () => {
    const mockUpdate = vi.fn().mockResolvedValue({ unwrap: () => Promise.resolve({}) });
    mockUseGetEmailPreferencesQuery.mockReturnValue({
      data: {
        enabled: true,
        frequency: "daily",
        welcomeEmail: true,
      },
      isLoading: false,
    });
    mockUseUpdateEmailPreferencesMutation.mockReturnValue([mockUpdate]);

    render(<EmailPreferencesPanel />);

    const weeklyRadio = screen.getByRole("radio", { name: /weekly summary/i });
    fireEvent.click(weeklyRadio);

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({ frequency: "weekly" });
    });
  });

  it("renders all notification groups", () => {
    mockUseGetEmailPreferencesQuery.mockReturnValue({
      data: {
        enabled: true,
        frequency: "daily",
        welcomeEmail: true,
        goalCreated: true,
        streakMilestone: true,
        friendInvitation: true,
        goalPublished: true,
      },
      isLoading: false,
    });
    mockUseUpdateEmailPreferencesMutation.mockReturnValue([vi.fn()]);

    render(<EmailPreferencesPanel />);

    expect(screen.getByText("Account")).toBeInTheDocument();
    expect(screen.getByText("Goals")).toBeInTheDocument();
    expect(screen.getByText("Friends")).toBeInTheDocument();
    expect(screen.getByText("Streaks")).toBeInTheDocument();
    expect(screen.getByText("Templates & Marketplace")).toBeInTheDocument();
  });

  it("renders start-time picker when reminderDigest is enabled", () => {
    mockUseGetEmailPreferencesQuery.mockReturnValue({
      data: {
        enabled: true,
        frequency: "daily",
        reminderDigest: true,
        reminderStartTime: "09:00",
      },
      isLoading: false,
    });
    mockUseUpdateEmailPreferencesMutation.mockReturnValue([vi.fn()]);

    render(<EmailPreferencesPanel />);
    expect(screen.getByRole("option", { name: "9:00 AM" })).toBeInTheDocument();
  });

  it("renders stop-time picker when reminderDigest is enabled", () => {
    mockUseGetEmailPreferencesQuery.mockReturnValue({
      data: {
        enabled: true,
        frequency: "daily",
        reminderDigest: true,
        reminderStopTime: null,
      },
      isLoading: false,
    });
    mockUseUpdateEmailPreferencesMutation.mockReturnValue([vi.fn()]);

    render(<EmailPreferencesPanel />);
    expect(screen.getByText("No stop time")).toBeInTheDocument();
    expect(screen.getByText("quiet until next start")).toBeInTheDocument();
  });

  it("calls update mutation with null when stop time cleared", async () => {
    const mockUpdate = vi.fn().mockResolvedValue({ unwrap: () => Promise.resolve({}) });
    mockUseGetEmailPreferencesQuery.mockReturnValue({
      data: {
        enabled: true,
        frequency: "daily",
        reminderDigest: true,
        reminderStopTime: "22:00",
      },
      isLoading: false,
    });
    mockUseUpdateEmailPreferencesMutation.mockReturnValue([mockUpdate]);

    render(<EmailPreferencesPanel />);

    const stopSelect = screen.getAllByRole("combobox").find(
      (el) => (el as HTMLSelectElement).value === "22:00"
    ) as HTMLSelectElement;
    fireEvent.change(stopSelect!, { target: { value: "" } });

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({ reminderStopTime: null });
    });
  });
});

describe("EmailPreferencesPanel — accountOnly", () => {
  const seed = () => {
    mockUseGetEmailPreferencesQuery.mockReturnValue({
      data: {
        enabled: true,
        frequency: "daily",
        welcomeEmail: true,
        profileChanges: true,
        goalCreated: true,
        goalDeleted: true,
        friendInvitation: true,
        friendActivity: true,
        streakMilestone: true,
        streakReminder: true,
        friendStreakReminder: true,
        goalPublished: true,
        goalShared: true,
        goalForked: true,
        morningDigest: true,
        overdueAlert: true,
        reminderDigest: false,
      },
      isLoading: false,
    });
    mockUseUpdateEmailPreferencesMutation.mockReturnValue([vi.fn()]);
  };

  it("shows only the Account group when accountOnly", () => {
    seed();
    render(<EmailPreferencesPanel accountOnly />);
    expect(screen.getByText("Account")).toBeInTheDocument();
    expect(screen.queryByText("Goals")).toBeNull();
    expect(screen.queryByText("Friends")).toBeNull();
    expect(screen.queryByText("Streaks")).toBeNull();
    expect(screen.queryByText("Templates & Marketplace")).toBeNull();
    expect(screen.queryByText("Digests & Reminders")).toBeNull();
  });

  it("shows every group by default", () => {
    seed();
    render(<EmailPreferencesPanel />);
    expect(screen.getByText("Account")).toBeInTheDocument();
    expect(screen.getByText("Goals")).toBeInTheDocument();
    expect(screen.getByText("Digests & Reminders")).toBeInTheDocument();
  });
});
