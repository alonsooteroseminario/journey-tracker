import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ShareWalletModal } from "./ShareWalletModal";

vi.mock("@/store/slices/promptsSlice", () => ({
  useShareWalletMutation: vi.fn(),
  useUnshareWalletMutation: vi.fn(),
  useRotateShareTokenMutation: vi.fn(),
}));

import {
  useShareWalletMutation,
  useUnshareWalletMutation,
  useRotateShareTokenMutation,
} from "@/store/slices/promptsSlice";

const mockShare = vi.fn();
const mockUnshare = vi.fn();
const mockRotate = vi.fn();

vi.mocked(useShareWalletMutation).mockReturnValue([mockShare, { isLoading: false }] as never);
vi.mocked(useUnshareWalletMutation).mockReturnValue([mockUnshare, { isLoading: false }] as never);
vi.mocked(useRotateShareTokenMutation).mockReturnValue([mockRotate, { isLoading: false }] as never);

// Clipboard mock
Object.defineProperty(navigator, "clipboard", {
  value: { writeText: vi.fn().mockResolvedValue(undefined) },
  configurable: true,
});

beforeEach(() => vi.clearAllMocks());

const WALLET_PRIVATE = { id: "w-1", title: "My Wallet", shareToken: null };
const WALLET_SHARED = { id: "w-1", title: "My Wallet", shareToken: "tok-123" };

describe("ShareWalletModal", () => {
  it("shows 'Private' state and enable sharing CTA when wallet is not shared", () => {
    render(<ShareWalletModal wallet={WALLET_PRIVATE} onClose={vi.fn()} />);
    expect(screen.getByText(/Private/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Generate share link/i })).toBeInTheDocument();
  });

  it("calls shareWallet mutation when enabling sharing", async () => {
    mockShare.mockResolvedValue({ data: { shareToken: "new-tok", shareUrl: "/wallet/share/new-tok" } });
    render(<ShareWalletModal wallet={WALLET_PRIVATE} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Generate share link/i }));
    await waitFor(() => expect(mockShare).toHaveBeenCalledWith("w-1"));
  });

  it("shows the share URL and copy button when wallet is already shared", () => {
    render(<ShareWalletModal wallet={WALLET_SHARED} onClose={vi.fn()} />);
    expect(screen.getByDisplayValue(/tok-123/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Copy link/i })).toBeInTheDocument();
  });

  it("copies URL to clipboard when Copy link is clicked", async () => {
    render(<ShareWalletModal wallet={WALLET_SHARED} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Copy link/i }));
    await waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining("tok-123"),
      ),
    );
  });

  it("calls unshareWallet when Stop sharing is clicked", async () => {
    mockUnshare.mockResolvedValue({});
    render(<ShareWalletModal wallet={WALLET_SHARED} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Stop sharing/i }));
    await waitFor(() => expect(mockUnshare).toHaveBeenCalledWith("w-1"));
  });

  it("calls rotateShareToken when Rotate link is clicked", async () => {
    mockRotate.mockResolvedValue({ data: { shareToken: "new-tok" } });
    render(<ShareWalletModal wallet={WALLET_SHARED} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Rotate link/i }));
    await waitFor(() => expect(mockRotate).toHaveBeenCalledWith("w-1"));
  });

  it("calls onClose when the close button is clicked", () => {
    const onClose = vi.fn();
    render(<ShareWalletModal wallet={WALLET_PRIVATE} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /Close/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
