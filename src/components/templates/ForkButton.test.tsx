import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AccessProvider } from "@/components/AccessProvider";
import { ForkButton } from "./ForkButton";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/store/slices/templatesSlice", () => ({
  useForkTemplateMutation: () => [vi.fn(), { isLoading: false }],
  useCreateForkRequestMutation: () => [vi.fn(), { isLoading: false }],
  useGetForkRequestStatusQuery: () => ({ data: undefined }),
}));

describe("ForkButton", () => {
  it("renders nothing for free (wallet-only) users", () => {
    const { container } = render(
      <AccessProvider value={false}>
        <ForkButton templateId="t1" templateTitle="My Template" />
      </AccessProvider>
    );
    expect(screen.queryByText("Fork This Template")).toBeNull();
    expect(container.firstChild).toBeNull();
  });

  it("shows the fork affordance for full-access users (context default)", () => {
    render(<ForkButton templateId="t1" templateTitle="My Template" />);
    expect(screen.getByText("Fork This Template")).toBeTruthy();
  });
});
