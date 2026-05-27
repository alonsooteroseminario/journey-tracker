# TODOS

Deferred work captured with enough context to start immediately.

---

## Received-notifications stop time (check-streaks)

**What:** Extend quiet-window behavior to notifications that users *receive* from friends.
Specifically: `src/app/api/cron/check-streaks/route.ts` sends streak-risk alerts to a user's friends using the *sender's* preferences. This route was deliberately excluded from the Smart Reminder Bell stop-time feature (2026-05-26) because gating it on the sender's `reminderStopTime` would silence what the *receiver* gets — a different privacy contract.

**Why:** Users who configure a quiet window still receive check-streaks notifications at any hour. Completing the notification privacy story requires a "received notification preferences" system.

**Context:** The Smart Reminder Bell design doc (`~/.gstack/projects/alonsooteroseminario-journey-tracker/alonsooteroseminario-main-design-20260526-201820.md`) explains the exclusion under Feature 3 → "check-streaks/route.ts: Excluded. This cron notifies friends when a user's streak is at risk — it is a friend-facing notification, not the user's own digest." That reasoning should guide the design of the received-notification preferences feature.

**Where to start:** `src/app/api/cron/check-streaks/route.ts` + a new `EmailPreferences` field (e.g., `muteReceivedReminders: Boolean`) + UI in `EmailPreferencesPanel.tsx`.

**Depends on / blocked by:** None — independent of the Smart Reminder Bell implementation.

---
