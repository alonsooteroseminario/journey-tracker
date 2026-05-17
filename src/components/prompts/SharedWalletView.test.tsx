import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SharedWalletView } from "./SharedWalletView";

const WALLET = {
  id: "w-1",
  title: "My Wallet",
  icon: "💼",
  description: "Prompts for me",
  groups: [
    {
      id: "g-1",
      title: "Group A",
      description: null,
      chunks: [
        { id: "c-1", title: "Chunk 1", content: "prompt content here" },
      ],
    },
  ],
};

vi.mock("@clerk/nextjs", () => ({
  useUser: vi.fn(() => ({ isSignedIn: false })),
}));

// clipboard
Object.defineProperty(navigator, "clipboard", {
  value: { writeText: vi.fn().mockResolvedValue(undefined) },
  configurable: true,
});

describe("SharedWalletView", () => {
  it("renders wallet title, icon and description", () => {
    render(<SharedWalletView wallet={WALLET} ownerName="Alice" />);
    expect(screen.getByText("My Wallet")).toBeInTheDocument();
    expect(screen.getByText(/Shared by Alice/i)).toBeInTheDocument();
  });

  it("renders groups and chunks", () => {
    render(<SharedWalletView wallet={WALLET} ownerName="Alice" />);
    expect(screen.getByText("Group A")).toBeInTheDocument();
    expect(screen.getByText("Chunk 1")).toBeInTheDocument();
  });

  it("shows Sign in to save CTA when signed out", () => {
    render(<SharedWalletView wallet={WALLET} ownerName="Alice" />);
    expect(screen.getByRole("link", { name: /Sign in to save/i })).toBeInTheDocument();
  });
});
