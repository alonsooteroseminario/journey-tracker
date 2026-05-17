import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AgentKeyForm } from "./AgentKeyForm";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AgentKeyForm", () => {
  describe("when no key is set", () => {
    it("shows warning that a key is needed", () => {
      render(<AgentKeyForm hasKey={false} maskedKey={null} lastValidated={null} />);
      expect(screen.getByText(/You need an Anthropic API key/)).toBeInTheDocument();
    });

    it("save button is disabled when input is empty", () => {
      render(<AgentKeyForm hasKey={false} maskedKey={null} lastValidated={null} />);
      const btn = screen.getByRole("button", { name: /Save Key/i });
      expect(btn).toBeDisabled();
    });

    it("shows success state after valid save", async () => {
      mockFetch.mockResolvedValue({ ok: true, json: async () => ({ maskedKey: "••••NEW" }) });
      const onSaved = vi.fn();
      render(
        <AgentKeyForm hasKey={false} maskedKey={null} lastValidated={null} onSaved={onSaved} />,
      );
      fireEvent.change(screen.getByLabelText(/Anthropic API key/i), {
        target: { value: "sk-ant-validkey12345" },
      });
      fireEvent.click(screen.getByRole("button", { name: /Save Key/i }));
      await waitFor(() =>
        expect(screen.getByText(/Key saved and verified/i)).toBeInTheDocument(),
      );
      expect(onSaved).toHaveBeenCalled();
    });

    it("shows error message when API returns error", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Anthropic rejected the key as invalid." }),
      });
      render(<AgentKeyForm hasKey={false} maskedKey={null} lastValidated={null} />);
      fireEvent.change(screen.getByLabelText(/Anthropic API key/i), {
        target: { value: "sk-ant-badkey12345" },
      });
      fireEvent.click(screen.getByRole("button", { name: /Save Key/i }));
      await waitFor(() =>
        expect(screen.getByText(/Anthropic rejected/i)).toBeInTheDocument(),
      );
    });
  });

  describe("when a key is already set", () => {
    it("shows masked key and replace/remove buttons", () => {
      render(
        <AgentKeyForm hasKey={true} maskedKey="••••XYZ" lastValidated="2026-01-01T00:00:00Z" />,
      );
      expect(screen.getByText("••••XYZ")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Replace Key/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Remove/i })).toBeInTheDocument();
    });

    it("shows remove confirmation when Remove is clicked", () => {
      render(
        <AgentKeyForm hasKey={true} maskedKey="••••XYZ" lastValidated={null} />,
      );
      fireEvent.click(screen.getByRole("button", { name: /^Remove$/i }));
      expect(screen.getByText(/Remove key\? Chat will be gated/i)).toBeInTheDocument();
    });

    it("calls DELETE and fires onSaved after confirming removal", async () => {
      mockFetch.mockResolvedValue({ ok: true });
      const onSaved = vi.fn();
      render(
        <AgentKeyForm hasKey={true} maskedKey="••••XYZ" lastValidated={null} onSaved={onSaved} />,
      );
      fireEvent.click(screen.getByRole("button", { name: /^Remove$/i }));
      fireEvent.click(screen.getByRole("button", { name: /Yes, remove/i }));
      await waitFor(() => expect(onSaved).toHaveBeenCalled());
      expect(mockFetch).toHaveBeenCalledWith("/api/settings/ai-key", { method: "DELETE" });
    });
  });
});
