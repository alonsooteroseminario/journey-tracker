import { describe, it, expect } from "vitest";
import { WelcomeEmail } from "../welcome";
import { ProfileChangedEmail } from "../profile-changed";
import { GoalCreatedEmail } from "../goal-created";
import { GoalDeletedEmail } from "../goal-deleted";
import { FriendInvitationEmail } from "../friend-invitation";
import { StreakMilestoneEmail } from "../streak-milestone";
import { StreakReminderEmail } from "../streak-reminder";
import { FriendStreakReminderEmail } from "../friend-streak-reminder";
import { GoalPublishedEmail } from "../goal-published";
import { GoalSharedEmail } from "../goal-shared";
import { GoalUnsharedEmail } from "../goal-unshared";
import { GoalForkedEmail } from "../goal-forked";
import * as React from "react";

describe("Email Templates", () => {
  it("renders WelcomeEmail without errors", () => {
    expect(() =>
      React.createElement(WelcomeEmail, { userName: "John Doe" })
    ).not.toThrow();
  });

  it("renders ProfileChangedEmail without errors", () => {
    expect(() =>
      React.createElement(ProfileChangedEmail, {
        userName: "Jane",
        changedFields: ["Name", "Bio"],
      })
    ).not.toThrow();
  });

  it("renders GoalCreatedEmail without errors", () => {
    expect(() =>
      React.createElement(GoalCreatedEmail, {
        userName: "Test User",
        goalTitle: "Learn TypeScript",
        taskCount: 10,
      })
    ).not.toThrow();
  });

  it("renders GoalDeletedEmail without errors", () => {
    expect(() =>
      React.createElement(GoalDeletedEmail, {
        userName: "Test User",
        goalTitle: "Old Goal",
      })
    ).not.toThrow();
  });

  it("renders FriendInvitationEmail without errors", () => {
    expect(() =>
      React.createElement(FriendInvitationEmail, {
        userName: "Test User",
        invitationCode: "ABC12345",
      })
    ).not.toThrow();
  });

  it("renders StreakMilestoneEmail without errors", () => {
    expect(() =>
      React.createElement(StreakMilestoneEmail, {
        userName: "Test",
        streakCount: 7,
      })
    ).not.toThrow();
  });

  it("renders StreakReminderEmail without errors", () => {
    expect(() =>
      React.createElement(StreakReminderEmail, {
        userName: "Test",
        currentStreak: 5,
      })
    ).not.toThrow();
  });

  it("renders FriendStreakReminderEmail without errors", () => {
    expect(() =>
      React.createElement(FriendStreakReminderEmail, {
        userName: "Test",
        friendName: "Alice",
        friendStreak: 10,
      })
    ).not.toThrow();
  });

  it("renders GoalPublishedEmail without errors", () => {
    expect(() =>
      React.createElement(GoalPublishedEmail, {
        userName: "Test",
        goalTitle: "Test Goal",
        goalIcon: "🎯",
      })
    ).not.toThrow();
  });

  it("renders GoalSharedEmail without errors", () => {
    expect(() =>
      React.createElement(GoalSharedEmail, {
        userName: "Test",
        goalTitle: "Shared Goal",
      })
    ).not.toThrow();
  });

  it("renders GoalUnsharedEmail without errors", () => {
    expect(() =>
      React.createElement(GoalUnsharedEmail, {
        userName: "Test",
        goalTitle: "Unshared Goal",
      })
    ).not.toThrow();
  });

  it("renders GoalForkedEmail without errors", () => {
    expect(() =>
      React.createElement(GoalForkedEmail, {
        userName: "Test",
        goalTitle: "Forked Goal",
        forkerName: "Bob",
        totalForks: 3,
      })
    ).not.toThrow();
  });
});
