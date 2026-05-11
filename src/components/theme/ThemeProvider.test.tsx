import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ThemeProvider, useTheme } from "./ThemeProvider";

function Probe() {
  const { theme, resolvedTheme, setTheme, cycleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <button onClick={() => setTheme("dark")}>set-dark</button>
      <button onClick={() => setTheme("light")}>set-light</button>
      <button onClick={() => setTheme("system")}>set-system</button>
      <button onClick={cycleTheme}>cycle</button>
    </div>
  );
}

function setMatchMedia(prefersDark: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: query.includes("dark") ? prefersDark : false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
  document.documentElement.style.colorScheme = "";
  setMatchMedia(false);
});

afterEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
});

describe("ThemeProvider", () => {
  it("defaults to system theme on first mount with no stored preference", () => {
    render(<ThemeProvider><Probe /></ThemeProvider>);
    expect(screen.getByTestId("theme").textContent).toBe("system");
  });

  it("reads stored 'dark' from localStorage and applies the class", () => {
    localStorage.setItem("theme", "dark");
    render(<ThemeProvider><Probe /></ThemeProvider>);
    expect(screen.getByTestId("theme").textContent).toBe("dark");
    expect(screen.getByTestId("resolved").textContent).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("setTheme('dark') persists to localStorage and applies the class", () => {
    render(<ThemeProvider><Probe /></ThemeProvider>);
    act(() => { fireEvent.click(screen.getByText("set-dark")); });
    expect(localStorage.getItem("theme")).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("setTheme('light') clears the dark class", () => {
    localStorage.setItem("theme", "dark");
    render(<ThemeProvider><Probe /></ThemeProvider>);
    act(() => { fireEvent.click(screen.getByText("set-light")); });
    expect(localStorage.getItem("theme")).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("system mode follows prefers-color-scheme: dark", () => {
    setMatchMedia(true);
    render(<ThemeProvider><Probe /></ThemeProvider>);
    act(() => { fireEvent.click(screen.getByText("set-system")); });
    expect(screen.getByTestId("resolved").textContent).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("cycleTheme moves light -> dark -> system -> light", () => {
    localStorage.setItem("theme", "light");
    render(<ThemeProvider><Probe /></ThemeProvider>);
    expect(screen.getByTestId("theme").textContent).toBe("light");
    act(() => { fireEvent.click(screen.getByText("cycle")); });
    expect(screen.getByTestId("theme").textContent).toBe("dark");
    act(() => { fireEvent.click(screen.getByText("cycle")); });
    expect(screen.getByTestId("theme").textContent).toBe("system");
    act(() => { fireEvent.click(screen.getByText("cycle")); });
    expect(screen.getByTestId("theme").textContent).toBe("light");
  });

  it("useTheme outside provider returns safe light defaults", () => {
    render(<Probe />);
    expect(screen.getByTestId("theme").textContent).toBe("light");
  });
});
