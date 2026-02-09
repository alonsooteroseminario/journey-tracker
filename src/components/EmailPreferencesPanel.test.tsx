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
});
