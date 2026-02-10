import { describe, it, expect } from "vitest";
import uiReducer, { setActiveView } from "./uiSlice";

describe("uiSlice", () => {
  const initialState = { activeView: "home" as const };

  it("should return initial state", () => {
    const state = uiReducer(undefined, { type: "unknown" });
    expect(state).toEqual({ activeView: "home" });
  });

  it("should set active view", () => {
    const state = uiReducer(initialState, setActiveView("feed"));
    expect(state.activeView).toBe("feed");
  });

  it("should set active view to templates", () => {
    const state = uiReducer(initialState, setActiveView("templates"));
    expect(state.activeView).toBe("templates");
  });

  it("should set active view to marketplace", () => {
    const state = uiReducer(initialState, setActiveView("marketplace"));
    expect(state.activeView).toBe("marketplace");
  });

  it("should set active view back to home", () => {
    const feedState = uiReducer(initialState, setActiveView("feed"));
    const homeState = uiReducer(feedState, setActiveView("home"));
    expect(homeState.activeView).toBe("home");
  });

  it("should NOT have isMenuOpen property", () => {
    const state = uiReducer(undefined, { type: "unknown" });
    expect(state).not.toHaveProperty("isMenuOpen");
  });
});
