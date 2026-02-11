# Final Smoke Test Checklist - Clerk User Data Sync

**Date:** 2026-02-10
**Feature:** Sync Clerk User Data to Database
**Tester:** _________________
**Environment:** Development (local)

---

## Pre-Flight Checks

Before starting the smoke tests, verify the development environment is ready:

- [ ] Development server is running (`npm run dev`)
- [ ] MongoDB connection is active (check `.env` for `DATABASE_URL`)
- [ ] Clerk authentication is configured (check `.env` for Clerk keys)
- [ ] Can successfully sign in to the application
- [ ] Browser DevTools console shows no critical errors

**Notes:**
```
Server URL: http://localhost:3000
Database: MongoDB (Prisma)
Auth Provider: Clerk
```

---

## Test Suite 1: Template Creator Names Verification

**Objective:** Verify that template creator names display actual Clerk user data instead of placeholder values like "New User".

### Setup
1. Sign in to the application with your Clerk account
2. Ensure you have at least one published template (or create one for testing)

### Test Cases

#### TC1.1: Marketplace Template Cards
- [ ] Navigate to `/marketplace`
- [ ] Verify template cards display in the marketplace
- [ ] **Expected:** Creator name shows actual user name from Clerk (e.g., "John Doe")
- [ ] **Expected:** Creator name does NOT show "New User" or placeholder text
- [ ] **Expected:** Profile image displays correctly (if set in Clerk)
- [ ] **Expected:** If no profile image, default avatar is shown

**Actual Result:**
```
Creator Name: _______________
Profile Image: [ ] Displayed [ ] Default Avatar
```

#### TC1.2: Template Detail Page
- [ ] Click on a template card to open the detail page
- [ ] Navigate to `/marketplace/[templateId]`
- [ ] Verify the "Created by" section displays:
  - [ ] Correct profile image (or default avatar)
  - [ ] Correct creator name matching Clerk account
  - [ ] "Template Author" or similar label
- [ ] **Expected:** All creator information matches Clerk account data

**Actual Result:**
```
Creator Name: _______________
Profile Image: [ ] Displayed [ ] Default Avatar
Label: _______________
```

#### TC1.3: Newly Created Templates
- [ ] Create a new goal
- [ ] Publish the goal as a template
- [ ] Navigate to `/marketplace`
- [ ] **Expected:** Newly published template immediately shows correct creator name
- [ ] **Expected:** No delay or placeholder shown before sync

**Actual Result:**
```
Immediate Display: [ ] Pass [ ] Fail
Creator Name: _______________
```

#### TC1.4: Multiple Users (if available)
- [ ] If you have access to a second Clerk account:
  - [ ] Sign in with the second account
  - [ ] Create and publish a template
  - [ ] Sign out and sign back in with your original account
  - [ ] Navigate to `/marketplace`
  - [ ] **Expected:** Both your templates and the second user's templates show distinct creator names
  - [ ] **Expected:** Each creator's profile image is correct and distinct

**Actual Result:**
```
User 1 Name: _______________
User 2 Name: _______________
Names Are Distinct: [ ] Yes [ ] No
```

---

## Test Suite 2: Email Preferences Verification

**Objective:** Verify that the email notification toggle system works correctly and respects user preferences.

### Test Cases

#### TC2.1: Email Preferences Panel Display
- [ ] Navigate to `/profile`
- [ ] Scroll to the "Email Notifications" section
- [ ] **Expected:** Panel displays with the following elements:
  - [ ] Master toggle: "Enable email notifications"
  - [ ] Email frequency selector (Immediate, Daily digest, Weekly summary)
  - [ ] Individual notification type toggles grouped by category
  - [ ] Save status indicator (idle, saving, saved)

**Actual Result:**
```
Panel Visible: [ ] Yes [ ] No
Master Toggle: [ ] Present [ ] Missing
Frequency Selector: [ ] Present [ ] Missing
Individual Toggles: [ ] Present [ ] Missing
```

#### TC2.2: Master Toggle - Disable All Notifications
- [ ] Click the master toggle to disable all notifications
- [ ] **Expected:** "Saving..." appears briefly
- [ ] **Expected:** "✓ Saved" appears after save completes
- [ ] **Expected:** Frequency selector becomes disabled/hidden
- [ ] **Expected:** Individual notification toggles become disabled/hidden
- [ ] Refresh the page (`Ctrl+R` or `Cmd+R`)
- [ ] **Expected:** Master toggle remains in the "off" state
- [ ] **Expected:** All dependent controls remain disabled/hidden

**Actual Result:**
```
Save Indicator: [ ] Shown [ ] Not Shown
Frequency Disabled: [ ] Yes [ ] No
Individual Toggles Disabled: [ ] Yes [ ] No
State Persisted After Refresh: [ ] Yes [ ] No
```

#### TC2.3: Master Toggle - Enable Notifications
- [ ] Click the master toggle to enable notifications
- [ ] **Expected:** "Saving..." appears briefly
- [ ] **Expected:** "✓ Saved" appears after save completes
- [ ] **Expected:** Frequency selector becomes enabled/visible
- [ ] **Expected:** Individual notification toggles become enabled/visible
- [ ] Refresh the page
- [ ] **Expected:** Master toggle remains in the "on" state
- [ ] **Expected:** All dependent controls remain enabled/visible

**Actual Result:**
```
Save Indicator: [ ] Shown [ ] Not Shown
Frequency Enabled: [ ] Yes [ ] No
Individual Toggles Enabled: [ ] Yes [ ] No
State Persisted After Refresh: [ ] Yes [ ] No
```

#### TC2.4: Individual Notification Toggles
- [ ] Ensure master toggle is enabled
- [ ] Toggle an individual notification type (e.g., "Goal created")
- [ ] **Expected:** "Saving..." appears briefly for that specific toggle
- [ ] **Expected:** "✓ Saved" appears after save completes
- [ ] Toggle another notification type (e.g., "Streak milestones")
- [ ] Refresh the page
- [ ] **Expected:** All toggle states persist correctly
- [ ] **Expected:** Previously enabled toggles remain enabled
- [ ] **Expected:** Previously disabled toggles remain disabled

**Actual Result:**
```
Toggle 1 Name: _______________ State: [ ] On [ ] Off
Toggle 2 Name: _______________ State: [ ] On [ ] Off
States Persisted: [ ] Yes [ ] No
```

#### TC2.5: Email Frequency Selector
- [ ] Ensure master toggle is enabled
- [ ] Change the email frequency (e.g., from "Immediate" to "Daily digest")
- [ ] **Expected:** "Saving..." appears briefly
- [ ] **Expected:** "✓ Saved" appears after save completes
- [ ] Refresh the page
- [ ] **Expected:** Selected frequency persists

**Actual Result:**
```
Frequency Selected: _______________
Persisted After Refresh: [ ] Yes [ ] No
```

#### TC2.6: Backend Respects Master Toggle
- [ ] Disable the master email toggle
- [ ] Trigger a notification event (e.g., create a new goal)
- [ ] Check server logs (in terminal running `npm run dev`)
- [ ] **Expected:** Log message: "User has disabled all notifications" or similar
- [ ] **Expected:** No email is sent (check inbox and logs)

**Actual Result:**
```
Log Message Found: [ ] Yes [ ] No
Email Sent: [ ] Yes (FAIL) [ ] No (PASS)
Server Console Output:
_______________________________________________
```

#### TC2.7: Backend Respects Individual Notification Toggles
- [ ] Enable the master email toggle
- [ ] Disable a specific notification type (e.g., "Goal created")
- [ ] Trigger that notification event (e.g., create a new goal)
- [ ] Check server logs
- [ ] **Expected:** No email is sent for disabled notification type
- [ ] Enable the previously disabled notification type
- [ ] Trigger the event again
- [ ] **Expected:** Email is now sent (check logs)

**Actual Result:**
```
With Toggle Disabled:
  Email Sent: [ ] Yes (FAIL) [ ] No (PASS)

With Toggle Enabled:
  Email Sent: [ ] Yes (PASS) [ ] No (FAIL)
```

---

## Test Suite 3: Profile Data Sync Verification

**Objective:** Verify that user data syncs from Clerk to the database automatically.

### Test Cases

#### TC3.1: Profile Page Display
- [ ] Navigate to `/profile`
- [ ] **Expected:** Profile page shows:
  - [ ] Correct name from Clerk account
  - [ ] Correct email from Clerk account
  - [ ] Correct profile image from Clerk account (or default)

**Actual Result:**
```
Name Matches Clerk: [ ] Yes [ ] No
Email Matches Clerk: [ ] Yes [ ] No
Image Matches Clerk: [ ] Yes [ ] No

Clerk Name: _______________
Displayed Name: _______________
```

#### TC3.2: Data Sync After Clerk Update
- [ ] Open Clerk Dashboard (or update profile via Clerk UI)
- [ ] Update your name in Clerk (e.g., change "John Doe" to "Jane Smith")
- [ ] Return to the application
- [ ] Refresh any page that requires authentication
- [ ] Navigate to `/profile`
- [ ] **Expected:** Updated name appears immediately
- [ ] **Expected:** No manual sync or delay required

**Actual Result:**
```
Name Updated in App: [ ] Yes [ ] No
Delay Observed: [ ] Yes (note duration: ___) [ ] No
```

#### TC3.3: Profile Image Sync
- [ ] Update your profile image in Clerk
- [ ] Return to the application
- [ ] Refresh any authenticated page
- [ ] Navigate to `/profile`
- [ ] **Expected:** New profile image appears
- [ ] Navigate to `/marketplace` (if you have published templates)
- [ ] **Expected:** Template creator image is updated

**Actual Result:**
```
Profile Image Updated: [ ] Yes [ ] No
Marketplace Image Updated: [ ] Yes [ ] No
```

---

## Performance & Monitoring

### Performance Characteristics

- [ ] Open browser DevTools → Network tab
- [ ] Navigate to any protected page
- [ ] Measure API request time
- [ ] **Expected:** Auth flow completes in < 500ms (typical)
- [ ] **Expected:** No significant performance degradation from user sync

**Actual Result:**
```
Average API Response Time: _______________ ms
Auth Flow Duration: _______________ ms
Performance Impact: [ ] Minimal [ ] Moderate [ ] Severe
```

### Notes on Performance
- Clerk SDK caches user data internally
- Database updates only occur when user data has changed
- No update is performed if name, email, and profileImage are unchanged
- Typical overhead: 50-100ms for Clerk API call (cached)

### Monitoring Suggestions
- Monitor Clerk API rate limits in production (check Clerk dashboard)
- Set up alerts for authentication errors
- Track database write frequency for `User` table updates
- Consider caching synced user data in Redis for high-traffic scenarios

---

## Edge Cases & Error Handling

### Edge Case Testing

#### EC1: Missing Email in Clerk
- [ ] If possible, test with a Clerk account that has no email address
- [ ] **Expected:** System uses placeholder email: `{clerkId}@placeholder.com`
- [ ] **Expected:** No application errors or crashes

**Actual Result:**
```
Placeholder Email Used: [ ] Yes [ ] No
Errors Observed: [ ] Yes [ ] No
```

#### EC2: Missing Name in Clerk
- [ ] If possible, test with a Clerk account that has no full name
- [ ] **Expected:** System falls back to `firstName` or "User"
- [ ] **Expected:** No application errors or crashes

**Actual Result:**
```
Fallback Name Used: [ ] Yes [ ] No
Fallback Value: _______________
Errors Observed: [ ] Yes [ ] No
```

#### EC3: Missing Profile Image
- [ ] Test with a Clerk account that has no profile image
- [ ] **Expected:** Default avatar is displayed throughout the app
- [ ] **Expected:** No broken image placeholders

**Actual Result:**
```
Default Avatar Shown: [ ] Yes [ ] No
Broken Images: [ ] Yes [ ] No
```

---

## Sign-Off

### Automated Test Results
- [ ] Unit tests: **415 tests passed** (`npm run test`)
- [ ] Build: **Succeeded** (`npm run build`)
- [ ] TypeScript compilation: **No errors**

### Manual Test Summary
- [ ] All Template Creator Names tests passed (TC1.1 - TC1.4)
- [ ] All Email Preferences tests passed (TC2.1 - TC2.7)
- [ ] All Profile Data Sync tests passed (TC3.1 - TC3.3)
- [ ] Performance characteristics acceptable
- [ ] Edge cases handled gracefully

### Critical Issues Found
```
Issue #1: _______________________________________________
Severity: [ ] Critical [ ] Major [ ] Minor
Status: [ ] Blocked [ ] Fixed [ ] Deferred

Issue #2: _______________________________________________
Severity: [ ] Critical [ ] Major [ ] Minor
Status: [ ] Blocked [ ] Fixed [ ] Deferred
```

### Sign-Off
- [ ] All critical functionality verified
- [ ] No blocking issues identified
- [ ] Feature ready for deployment

**Tester Name:** _______________
**Date:** _______________
**Signature:** _______________

---

## Additional Notes

Use this space to document any additional observations, suggestions, or issues:

```
_______________________________________________
_______________________________________________
_______________________________________________
```

---

## Related Documentation

- Implementation Plan: `docs/plans/2026-02-10-sync-clerk-user-data.md`
- Architecture: `CLAUDE.md` (sections: Request & Auth Flow, User Data Synchronization, Email Notifications)
- Code:
  - `src/lib/auth.ts` - User sync logic
  - `src/components/EmailPreferencesPanel.tsx` - Email preferences UI
  - `src/lib/email/notifications.ts` - Email notification logic
  - `src/lib/auth.test.ts` - User sync unit tests
  - `src/lib/email/notifications.integration.test.ts` - Email preferences tests
