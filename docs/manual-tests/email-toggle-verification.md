# Email Toggle Functionality - Manual Verification Checklist

This document provides step-by-step instructions to verify that the email notification toggle system is working correctly.

---

## Prerequisites

Before beginning verification, ensure:

- [ ] Development server is running (`npm run dev`)
- [ ] You are signed in with a valid Clerk account
- [ ] Database is accessible (Prisma connection working)
- [ ] Email service is configured (or mock email logger is active)

---

## 1. Component UI Verification

### EmailPreferencesPanel Component Structure

**File:** `/src/components/EmailPreferencesPanel.tsx`

**Verified Implementation:**
- ✅ Master toggle for `enabled` (lines 101-116)
- ✅ Conditional rendering of frequency selector when enabled (lines 118-181)
- ✅ Conditional rendering of notification type toggles when enabled (lines 184-209)
- ✅ Message shown when disabled (lines 212-216)
- ✅ Save status indicator (lines 92-97)

**UI Testing Steps:**

1. **Navigate to Profile Page**
   - [ ] Go to `http://localhost:3000/profile`
   - [ ] Scroll down to locate "Email Notifications" section
   - [ ] Verify section header displays "Email Notifications"

2. **Master Toggle Visibility**
   - [ ] Verify "Enable email notifications" checkbox is visible
   - [ ] Verify description text: "Receive email updates about your goals and activity"
   - [ ] Check the current state (checked/unchecked)

3. **Conditional Content Display**
   - [ ] If toggle is OFF: Verify message "Email notifications are disabled. Enable them to customize your preferences."
   - [ ] If toggle is ON: Verify frequency selector and notification type groups are visible

---

## 2. Master Toggle Functionality Testing

### Test Case 2.1: Disable All Notifications

1. **Starting State**
   - [ ] Ensure master toggle is currently ON (enabled)

2. **Disable Notifications**
   - [ ] Click the master toggle checkbox to turn it OFF
   - [ ] Verify "Saving..." appears briefly (near the header)
   - [ ] Verify "✓ Saved" appears after save completes
   - [ ] Verify frequency selector disappears/becomes hidden
   - [ ] Verify all notification type toggles disappear/become hidden
   - [ ] Verify placeholder message appears: "Email notifications are disabled..."

3. **Persistence Verification**
   - [ ] Refresh the page (F5 or Ctrl+R)
   - [ ] Verify master toggle remains OFF
   - [ ] Verify conditional content remains hidden
   - [ ] Verify placeholder message is still displayed

4. **Database Verification (Optional)**
   - [ ] Open Prisma Studio: `npx prisma studio`
   - [ ] Navigate to `EmailPreferences` table
   - [ ] Find your user's preferences record
   - [ ] Verify `enabled` field is `false`

### Test Case 2.2: Re-enable Notifications

1. **Enable Notifications**
   - [ ] Click the master toggle checkbox to turn it ON
   - [ ] Verify "Saving..." → "✓ Saved" transition
   - [ ] Verify frequency selector appears (3 radio options)
   - [ ] Verify notification type groups appear (5 categories)

2. **Verify Default State**
   - [ ] Check which frequency is selected (default: "immediate")
   - [ ] Check which notification types are enabled (varies by user)
   - [ ] Verify all UI controls are interactive/enabled

3. **Persistence Verification**
   - [ ] Refresh the page
   - [ ] Verify master toggle remains ON
   - [ ] Verify all previously visible sections remain visible

---

## 3. Frequency Selector Testing

### Prerequisites
- [ ] Master toggle is ON (enabled)

### Test Case 3.1: Change Frequency to Daily

1. **Select Daily Digest**
   - [ ] Click the "Daily digest" radio button
   - [ ] Verify "Saving..." → "✓ Saved" transition
   - [ ] Verify radio button selection persists visually

2. **Verify Persistence**
   - [ ] Refresh the page
   - [ ] Verify "Daily digest" remains selected
   - [ ] Verify other options are not selected

### Test Case 3.2: Change Frequency to Weekly

1. **Select Weekly Summary**
   - [ ] Click the "Weekly summary" radio button
   - [ ] Verify "Saving..." → "✓ Saved" transition
   - [ ] Verify selection updates

2. **Verify Persistence**
   - [ ] Refresh the page
   - [ ] Verify "Weekly summary" remains selected

### Test Case 3.3: Reset to Immediate

1. **Select Immediate**
   - [ ] Click the "Immediate" radio button
   - [ ] Verify save confirmation
   - [ ] Verify persistence after refresh

---

## 4. Individual Notification Toggle Testing

### Prerequisites
- [ ] Master toggle is ON (enabled)

### Test Case 4.1: Toggle Individual Notification Types

**Test each notification category:**

**Account Notifications:**
- [ ] Toggle "Welcome email" ON → Verify save → Refresh → Verify persisted
- [ ] Toggle "Welcome email" OFF → Verify save → Refresh → Verify persisted
- [ ] Toggle "Profile changes" ON → Verify save → Refresh → Verify persisted

**Goal Notifications:**
- [ ] Toggle "Goal created" OFF → Verify save → Refresh → Verify persisted
- [ ] Toggle "Goal deleted" ON → Verify save → Refresh → Verify persisted

**Friend Notifications:**
- [ ] Toggle "Friend invitation sent" OFF → Verify save → Refresh → Verify persisted
- [ ] Toggle "Friend needs encouragement" ON → Verify save → Refresh → Verify persisted

**Streak Notifications:**
- [ ] Toggle "Streak milestones" OFF → Verify save → Refresh → Verify persisted
- [ ] Toggle "Daily streak reminders" OFF → Verify save → Refresh → Verify persisted
- [ ] Toggle "Friend streak alerts" ON → Verify save → Refresh → Verify persisted

**Template Notifications:**
- [ ] Toggle "Template published" ON → Verify save → Refresh → Verify persisted
- [ ] Toggle "Template shared with friends" OFF → Verify save → Refresh → Verify persisted
- [ ] Toggle "Someone forked your template" ON → Verify save → Refresh → Verify persisted

### Test Case 4.2: Disable Multiple Notifications

1. **Disable Several Types**
   - [ ] Turn OFF at least 5 different notification types
   - [ ] Verify each save completes successfully
   - [ ] Refresh the page
   - [ ] Verify all 5 toggles remain OFF

---

## 5. Backend Logic Verification

### Backend Implementation Review

**File:** `/src/lib/email/notifications.ts`

**Lines 75-83 - Master Toggle Check:**
```typescript
// Check if notifications are enabled
if (!preferences.enabled) {
  return { success: true }; // User has disabled all notifications
}

// Check if this specific notification type is enabled
if (!preferences[type]) {
  return { success: true }; // User has disabled this notification type
}
```

**Verified Logic:**
- ✅ Returns early with `success: true` when master toggle is OFF
- ✅ Returns early with `success: true` when specific notification type is OFF
- ✅ No email is sent in either case (function exits before `sendEmail` call)
- ✅ Email is only sent when BOTH `enabled` AND `preferences[type]` are true

### Test Case 5.1: Master Toggle Blocks All Emails

1. **Setup**
   - [ ] Navigate to profile page
   - [ ] Turn OFF the master toggle
   - [ ] Verify save completes

2. **Trigger Notification Event**
   - [ ] Create a new goal (or complete another action that triggers email)
   - [ ] Watch server console/logs

3. **Expected Behavior**
   - [ ] No email should be sent
   - [ ] Server logs may show: "User has disabled all notifications" (if implemented)
   - [ ] Check your email inbox - should NOT receive email
   - [ ] API response should still return `{ success: true }`

4. **Verification**
   - [ ] Confirmed no email was sent
   - [ ] Backend respected the `enabled: false` preference

### Test Case 5.2: Individual Toggle Blocks Specific Email Type

1. **Setup**
   - [ ] Enable master toggle
   - [ ] Enable "Goal created" notification
   - [ ] Disable "Goal deleted" notification
   - [ ] Save and verify

2. **Test Goal Created (Should Send)**
   - [ ] Create a new goal
   - [ ] Verify email IS sent (check logs/inbox)

3. **Test Goal Deleted (Should NOT Send)**
   - [ ] Delete a goal
   - [ ] Verify email is NOT sent (check logs/inbox)

4. **Verification**
   - [ ] Confirmed "Goal created" email was sent
   - [ ] Confirmed "Goal deleted" email was NOT sent
   - [ ] Backend respected individual notification type preferences

### Test Case 5.3: All Toggles Enabled (Normal Operation)

1. **Setup**
   - [ ] Enable master toggle
   - [ ] Enable all individual notification types
   - [ ] Save and verify

2. **Trigger Multiple Events**
   - [ ] Create a goal → Expect email
   - [ ] Update profile → Expect email
   - [ ] Complete a streak milestone → Expect email

3. **Verification**
   - [ ] All triggered emails were sent
   - [ ] Backend operates normally when all preferences are enabled

---

## 6. Edge Cases and Error Handling

### Test Case 6.1: Rapid Toggle Changes

1. **Stress Test**
   - [ ] Rapidly toggle master switch ON/OFF 10 times
   - [ ] Verify no errors in console
   - [ ] Verify final state persists correctly after page refresh

### Test Case 6.2: Network Error Simulation (Optional)

1. **Simulate Network Failure**
   - [ ] Open browser DevTools → Network tab
   - [ ] Enable "Offline" mode
   - [ ] Try to toggle a preference
   - [ ] Verify error handling (should show error or timeout gracefully)
   - [ ] Re-enable network
   - [ ] Verify subsequent toggles work correctly

### Test Case 6.3: Missing Preferences Record

**This tests the auto-creation logic in `notify()` function (lines 68-73):**

1. **Setup (requires database access)**
   - [ ] Open Prisma Studio
   - [ ] Delete your EmailPreferences record (if safe to do so)
   - [ ] Close Prisma Studio

2. **Trigger Notification**
   - [ ] Create a goal or trigger any notification event
   - [ ] Verify preferences are auto-created with defaults
   - [ ] Verify email is sent (default is enabled)

3. **Verification**
   - [ ] Check Prisma Studio - EmailPreferences record should exist
   - [ ] Profile page should display preferences panel correctly

---

## 7. Integration with Profile Page

### Profile Page Component

**File:** `/src/app/profile/page.tsx`

**Lines 271-274 - EmailPreferencesPanel Integration:**
```tsx
{/* Email Preferences */}
<div className="mb-6">
  <EmailPreferencesPanel />
</div>
```

**Verified Integration:**
- ✅ EmailPreferencesPanel is rendered on profile page
- ✅ Located in correct position (after activity calendar, before share section)
- ✅ Wrapped in proper container div with margin

### Test Case 7.1: Profile Page Layout

1. **Visual Verification**
   - [ ] Navigate to `/profile`
   - [ ] Verify EmailPreferencesPanel appears AFTER the Activity Calendar
   - [ ] Verify EmailPreferencesPanel appears BEFORE the "Share Your Progress" section
   - [ ] Verify panel has consistent styling with other profile sections
   - [ ] Verify white background, rounded corners, shadow (matches other cards)

2. **Responsive Design (Optional)**
   - [ ] Resize browser to mobile width (< 640px)
   - [ ] Verify panel remains readable and functional
   - [ ] Verify toggles are still clickable on small screens

---

## 8. Complete Workflow Test

### End-to-End Scenario

**Scenario:** User wants to disable streak notifications but keep goal notifications.

1. **Initial State**
   - [ ] Navigate to profile page
   - [ ] Verify master toggle is ON
   - [ ] Note current notification preferences

2. **Customize Preferences**
   - [ ] Keep master toggle ON
   - [ ] Enable: "Goal created", "Goal deleted"
   - [ ] Disable: "Streak milestones", "Daily streak reminders", "Friend streak alerts"
   - [ ] Verify each save completes

3. **Trigger Goal Event**
   - [ ] Create a new goal
   - [ ] Verify email IS sent (check logs/inbox)

4. **Trigger Streak Event**
   - [ ] Complete daily activity to increment streak
   - [ ] Verify email is NOT sent for streak milestone

5. **Refresh and Verify**
   - [ ] Refresh profile page
   - [ ] Verify all preference settings persisted correctly
   - [ ] Verify goal notifications still enabled
   - [ ] Verify streak notifications still disabled

6. **Final Verification**
   - [ ] User's preferences are respected end-to-end
   - [ ] UI accurately reflects backend state
   - [ ] No emails sent for disabled types
   - [ ] Emails sent for enabled types

---

## 9. Summary Checklist

### Implementation Verification

- [ ] EmailPreferencesPanel component has master toggle
- [ ] EmailPreferencesPanel component has individual notification toggles
- [ ] EmailPreferencesPanel shows/hides controls based on master toggle
- [ ] Backend `notify()` function checks `preferences.enabled` (line 76)
- [ ] Backend `notify()` function checks `preferences[type]` (line 81)
- [ ] Backend returns early (no email) when preferences are disabled
- [ ] EmailPreferencesPanel is rendered on profile page (line 273)
- [ ] Profile page integration is in correct location

### Functionality Verification

- [ ] Master toggle enables/disables all notifications
- [ ] Master toggle state persists across page refreshes
- [ ] Individual toggles work independently
- [ ] Individual toggle states persist across page refreshes
- [ ] Frequency selector works (Immediate/Daily/Weekly)
- [ ] Frequency selection persists across page refreshes
- [ ] Backend respects `enabled: false` (master toggle)
- [ ] Backend respects individual `type: false` preferences
- [ ] No emails sent when master toggle is OFF
- [ ] No emails sent when specific type is OFF
- [ ] Emails sent when both master and type are ON
- [ ] Save status indicator shows "Saving..." → "✓ Saved"
- [ ] Error handling works gracefully

### User Experience Verification

- [ ] UI is intuitive and clear
- [ ] Toggle interactions feel responsive
- [ ] No console errors during normal operation
- [ ] Page performance is acceptable
- [ ] Mobile responsive (optional)

---

## 10. Testing Notes

### Observations

**Record any observations during testing:**

```
Date: _______________
Tester: _______________

Observations:
-
-
-

Issues Found:
-
-
-

Suggestions:
-
-
-
```

---

## Conclusion

After completing this checklist, you should have verified:

1. ✅ **Component Structure**: EmailPreferencesPanel correctly implements all toggles
2. ✅ **UI Logic**: Conditional rendering works based on master toggle state
3. ✅ **Backend Logic**: `notify()` function respects all preference settings
4. ✅ **Integration**: Profile page correctly displays the panel
5. ✅ **Persistence**: All settings save and load correctly
6. ✅ **End-to-End**: Complete workflows function as expected

If all checklist items pass, the email toggle functionality is working correctly and ready for production use.
