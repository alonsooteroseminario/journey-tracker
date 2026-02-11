# Template Creator Names - Manual Verification Checklist

**Purpose:** Verify that template creator names and profile images display correctly after implementing Clerk user data synchronization.

**Related Implementation:** `docs/plans/2026-02-10-sync-clerk-user-data.md` (Tasks 1-2)

---

## Prerequisites

Before starting the verification, ensure:

- [ ] Tasks 1 and 2 from the implementation plan are complete
- [ ] `getCurrentUser()` has been updated to sync Clerk data
- [ ] Unit tests for auth sync are passing
- [ ] You have access to at least one Clerk user account

---

## Setup

### 1. Start the Development Server

```bash
npm run dev
```

**Expected:** Server starts successfully at `http://localhost:3000`

### 2. Sign In to Your Account

1. Navigate to `http://localhost:3000`
2. Click "Sign In" or navigate to `/sign-in`
3. Log in with your Clerk credentials

**Expected:** Successfully redirected to the goals page

---

## Section 1: Profile Page Verification

**Objective:** Confirm that your profile displays the correct Clerk user data.

### Steps:

1. Navigate to `http://localhost:3000/profile`
2. Locate the profile information section at the top of the page

### Verification Checklist:

- [ ] Profile picture displays correctly (matches your Clerk avatar)
- [ ] Name displays correctly (matches your Clerk full name)
- [ ] Email displays correctly (matches your Clerk email)
- [ ] If you recently updated your name in Clerk, the change is reflected here

**Notes:**
- If data is incorrect, refresh the page once to trigger a new auth check
- The sync happens on every authenticated request via `getCurrentUser()`

---

## Section 2: Marketplace - Template Cards

**Objective:** Verify that template cards show the correct creator names and profile images.

### Prerequisites:

You need at least one published template. If none exist:

1. Navigate to `/goals`
2. Create a new goal with at least one task
3. Click the "Share" button on the goal card
4. Toggle "Publish to marketplace"
5. Fill in required fields (description, category, difficulty, etc.)
6. Click "Publish"

### Steps:

1. Navigate to `http://localhost:3000/marketplace`
2. Locate your published template in the grid

### Verification Checklist:

- [ ] Template card displays "by [Your Actual Name]" (not "by Unknown" or "by New User")
- [ ] Template card shows the correct template icon
- [ ] If you have a profile image, it appears in the "Created by" section
- [ ] Fork count displays correctly
- [ ] Difficulty badge shows correct level (beginner/intermediate/advanced)

**Visual Reference:**

The template card should show:
```
[Icon] Template Title
       by [Your Name]

[Description text]

[beginner] [category] ⏱ duration
[tags...]

🍴 X forks | 🌍 Public/👥 Friends
```

---

## Section 3: Marketplace - Template Detail Page

**Objective:** Verify the full template detail page displays creator information correctly.

### Steps:

1. From the marketplace page, click on any template card
2. The detail page opens at `/marketplace/[templateId]`

### Verification Checklist:

- [ ] Template title displays at the top with the icon
- [ ] "Created by" section is visible
- [ ] Creator's profile image displays correctly (or gradient placeholder if no image)
- [ ] Creator's name displays correctly below the image
- [ ] "Template Author" label appears under the name
- [ ] All other template details display (description, tasks, tags, etc.)
- [ ] Fork button appears (if viewing someone else's template)
- [ ] "This is your own template" message appears (if viewing your own template)

**Visual Reference:**

The "Created by" section should look like:
```
CREATED BY
[Profile Image]  Your Name
                 Template Author
```

---

## Section 4: Templates Page (Private Sharing)

**Objective:** Verify that templates shared with friends also display creator names correctly.

### Prerequisites:

- You need at least one friend connection
- Friend must have shared a template with you (visibility: "friends")

### Steps:

1. Navigate to `http://localhost:3000/templates`
2. Use the filter buttons to view different template types

### Verification Checklist:

- [ ] "All Templates" filter shows all accessible templates
- [ ] "My Templates" filter shows only your templates
- [ ] "Friends Only" filter shows templates shared by friends
- [ ] Each template card shows the correct creator name
- [ ] Clicking "Friends Only" templates shows friend's name (not yours)
- [ ] Template detail modal shows correct creator info

---

## Section 5: Multi-User Verification (Optional)

**Objective:** Confirm that templates from different users show distinct creator names.

### Prerequisites:

Access to a second Clerk account (or ask a friend/colleague to help)

### Steps:

1. Sign out of your current account
2. Sign in with a different Clerk account
3. Create and publish a template
4. Sign back in with your original account
5. Navigate to `/marketplace`

### Verification Checklist:

- [ ] Your template shows your name
- [ ] The other user's template shows their name
- [ ] Profile images are distinct for each creator
- [ ] No templates show "Unknown" or "New User"

---

## Section 6: Real-Time Sync Verification

**Objective:** Verify that name changes in Clerk immediately reflect in the app.

### Steps:

1. Open a new browser tab and navigate to your Clerk Dashboard
2. Update your profile name in Clerk (e.g., change "John Doe" to "John D. Doe")
3. Return to the Journey Tracker app
4. Navigate to any protected page (e.g., `/profile` or `/marketplace`)

### Verification Checklist:

- [ ] Updated name displays immediately on the profile page
- [ ] Templates you created show the updated name
- [ ] No need to sign out and sign back in
- [ ] Change persists across page refreshes

**Technical Note:** The sync happens via `getCurrentUser()` which is called on every authenticated API request.

---

## Section 7: Edge Cases

**Objective:** Test scenarios where user data might be incomplete or missing.

### Test Cases:

#### 7.1 User with No Profile Image

If you don't have a Clerk profile image:

- [ ] Marketplace template cards show a gradient placeholder with your first initial
- [ ] Template detail page shows the same gradient placeholder
- [ ] Profile page shows the gradient placeholder

#### 7.2 User with Only First Name (No Full Name)

If your Clerk account only has a first name:

- [ ] App uses `firstName` as fallback
- [ ] Template cards show "by [FirstName]"
- [ ] No errors in console

#### 7.3 User with No Email

This scenario is unlikely with Clerk, but if it happens:

- [ ] App generates placeholder email: `[clerkId]@placeholder.com`
- [ ] No errors occur
- [ ] Profile page loads successfully

---

## Section 8: Performance Check

**Objective:** Ensure the Clerk sync doesn't negatively impact performance.

### Steps:

1. Open browser DevTools (F12)
2. Go to Network tab
3. Navigate to any protected page (e.g., `/marketplace`)
4. Observe the request/response times

### Verification Checklist:

- [ ] Page loads in under 2 seconds (typical)
- [ ] Auth requests complete in under 500ms
- [ ] No visible delay when navigating between pages
- [ ] No console errors related to Clerk or auth

**Technical Note:** Clerk SDK caches user data, so subsequent requests are very fast.

---

## Section 9: Database Verification (Optional)

**Objective:** Confirm that user data is correctly stored in the Prisma database.

### Steps:

1. Open Prisma Studio:
   ```bash
   npx prisma studio
   ```
2. Navigate to the `User` table
3. Find your user record (search by email or clerkId)

### Verification Checklist:

- [ ] `name` field matches your Clerk full name
- [ ] `email` field matches your Clerk email
- [ ] `profileImage` field contains your Clerk image URL (or null if no image)
- [ ] `clerkId` field matches your Clerk user ID
- [ ] `updatedAt` timestamp reflects recent activity

---

## Troubleshooting

### Issue: Template shows "Unknown" instead of my name

**Possible Causes:**
1. The template was created before the sync implementation
2. Clerk data hasn't been fetched yet

**Solution:**
1. Navigate to any protected page to trigger `getCurrentUser()`
2. Refresh the marketplace page
3. Check browser console for errors

### Issue: Profile image not displaying

**Possible Causes:**
1. Image URL is invalid or expired
2. CORS/CSP blocking the image

**Solution:**
1. Check the browser console for CORS errors
2. Verify the image URL in Prisma Studio
3. Try re-uploading your Clerk profile image

### Issue: Name changes in Clerk don't reflect in app

**Possible Causes:**
1. Browser cache
2. Clerk session not refreshed

**Solution:**
1. Hard refresh the page (Ctrl+Shift+R / Cmd+Shift+R)
2. Clear browser cache
3. Sign out and sign back in

---

## Sign-Off

**Date:** _____________

**Tester:** _____________

### Final Summary:

- [ ] All verification steps completed successfully
- [ ] No critical issues found
- [ ] Template creator names display correctly across all pages
- [ ] Profile images display correctly
- [ ] Real-time sync works as expected
- [ ] Performance is acceptable

### Issues Found (if any):

_________________________________________________________________

_________________________________________________________________

_________________________________________________________________

---

## Next Steps

After completing this verification:

1. Mark Task 3 as complete in the implementation plan
2. Proceed to Task 4: "Verify Email Toggle Functionality"
3. Report any issues found to the development team

---

**Document Version:** 1.0
**Last Updated:** 2026-02-10
**Related Plan:** `docs/plans/2026-02-10-sync-clerk-user-data.md`
