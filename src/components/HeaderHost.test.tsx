import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { HeaderHost } from "./HeaderHost";

vi.mock("@clerk/nextjs", () => ({
  useUser: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));
vi.mock("@/hooks/useHeaderStats", () => ({
  useHeaderStats: () => ({ progress: 50, streak: 3 }),
}));
vi.mock("./Header", () => ({
  Header: (props: Record<string, unknown>) => (
    <div data-testid="header" data-progress={props.totalProgress} data-streak={props.currentStreak}>
      Header
    </div>
  ),
}));

import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";

const mockUseUser = vi.mocked(useUser);
const mockUsePathname = vi.mocked(usePathname);

function signedIn() {
  mockUseUser.mockReturnValue({ isSignedIn: true, isLoaded: true } as never);
}
function signedOut() {
  mockUseUser.mockReturnValue({ isSignedIn: false, isLoaded: true } as never);
}
function notLoaded() {
  mockUseUser.mockReturnValue({ isSignedIn: false, isLoaded: false } as never);
}

describe("HeaderHost", () => {
  it("renders Header for authenticated users on a normal route", () => {
    signedIn();
    mockUsePathname.mockReturnValue("/board");
    render(<HeaderHost />);
    expect(screen.getByTestId("header")).toBeInTheDocument();
  });

  it("renders Header on /wallet — the main F3 motivation", () => {
    signedIn();
    mockUsePathname.mockReturnValue("/wallet");
    render(<HeaderHost />);
    expect(screen.getByTestId("header")).toBeInTheDocument();
  });

  it("passes computed stats to Header", () => {
    signedIn();
    mockUsePathname.mockReturnValue("/feed");
    render(<HeaderHost />);
    expect(screen.getByTestId("header")).toHaveAttribute("data-progress", "50");
    expect(screen.getByTestId("header")).toHaveAttribute("data-streak", "3");
  });

  it("renders nothing while Clerk is loading (prevents hydration flash)", () => {
    notLoaded();
    mockUsePathname.mockReturnValue("/board");
    const { container } = render(<HeaderHost />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing for signed-out users on the landing page /", () => {
    signedOut();
    mockUsePathname.mockReturnValue("/");
    const { container } = render(<HeaderHost />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing for signed-out users on /wallet (landing page renders there)", () => {
    signedOut();
    mockUsePathname.mockReturnValue("/wallet");
    const { container } = render(<HeaderHost />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing on /sign-in", () => {
    signedIn();
    mockUsePathname.mockReturnValue("/sign-in");
    const { container } = render(<HeaderHost />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing on /sign-up", () => {
    signedIn();
    mockUsePathname.mockReturnValue("/sign-up");
    const { container } = render(<HeaderHost />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing on /wallet/share/* (public share view)", () => {
    signedIn();
    mockUsePathname.mockReturnValue("/wallet/share/abc123");
    const { container } = render(<HeaderHost />);
    expect(container.firstChild).toBeNull();
  });
});
