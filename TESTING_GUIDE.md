# 🧪 Testing Guide - Journey Tracker Social Features

## ✅ Server Status: RUNNING on http://localhost:3000

---

## 📝 **Quick Start Testing**

### 1. Open the App
```
http://localhost:3000
```

### 2. First Time Setup
The app will load with:
- Default profile: "Journey Tracker"
- No goals yet
- No friends yet
- 0 day streak

---

## 🧪 **Test Scenarios**

### **Test 1: Profile Picture & Info**

**Steps:**
1. Click the profile icon (top-right corner - shows "J" initial)
2. Click "Edit Profile"
3. Click on the avatar to upload image
4. Choose an image (< 2MB)
5. Fill in:
   - Name: "Your Name"
   - Email: "you@email.com"
   - Bio: "Tracking my journey to success!"
   - Location: "Vancouver, BC"
6. Click "Save Changes"

**Expected Results:**
✅ Profile picture appears everywhere
✅ Information saved and displayed
✅ Stats show: Member Since, Current Streak (0), etc.
✅ Can see social share buttons

---

### **Test 2: Create Your First Goal**

**Steps:**
1. From home, click "New Goal"
2. Select "BC PNP to Permanent Residence" template
3. Wait for goal to load

**Expected Results:**
✅ Goal created with 55 tasks
✅ Each task has auto-generated substeps
✅ Can see all 8 phases
✅ Progress bar shows 0%
✅ Can drag tasks and substeps

---

### **Test 3: Complete Tasks & Build Streak**

**Steps:**
1. Expand first task "Start WES ECA"
2. Check off first substep: "Go to wes.org/eca/"
3. Check another substep
4. Look at streak counter (top-right)

**Expected Results:**
✅ Substeps turn green when checked
✅ Progress bar increases
✅ Streak counter shows 1 day 🔥
✅ Task progress updates

---

### **Test 4: Money Tracking**

**Steps:**
1. Scroll to a task with cost (e.g., "Start WES ECA - $256")
2. Expand the task
3. Look for "Cost Tracking" section
4. Check substeps to update "Spent on Completed Items"

**Expected Results:**
✅ Cost tracking section appears
✅ Shows Estimated, Actual, Spent on Completed
✅ Progress bar shows budget usage
✅ Updates when substeps completed

---

### **Test 5: Drag and Drop**

**Steps:**
1. In Goals page (`/goals`)
2. Find a task with substeps
3. Hover over substep → see drag handle (≡)
4. Drag substep to new position
5. Try dragging a whole task (☰ icon on left)

**Expected Results:**
✅ Drag handles appear
✅ Items become transparent while dragging
✅ Drop works smoothly
✅ Order persists on refresh

---

### **Test 6: Friends Comparison**

**Steps:**
1. Navigate to `/friends`
2. Click "Invite Friend" button
3. Copy the generated code (e.g., "ABC123XY")
4. In the "Add a Friend" input, paste a code
5. Click "Add Friend"

**Expected Results:**
✅ Invite modal opens with large code
✅ Can copy code
✅ Can share via Twitter, Facebook, WhatsApp
✅ Friend appears in list with random stats
✅ Comparison shows "vs" format
✅ Shows who's ahead with emoji indicators

---

### **Test 7: Profile Page Features**

**Steps:**
1. Go to `/profile`
2. Look at stats grid (4 cards)
3. Scroll to "Share Your Progress" section
4. Click Twitter share button

**Expected Results:**
✅ Member Since shows join date
✅ Current Streak: 1 day (if you completed test 3)
✅ Longest Streak: 1 day
✅ Goals: shows count
✅ Twitter opens with pre-filled message
✅ Message includes your streak count

---

### **Test 8: Goals Page**

**Steps:**
1. Navigate to `/goals`
2. See all goals listed
3. Click "New Goal" → Create custom goal
4. Title: "Learn Spanish"
5. Add task: "Complete Lesson 1"

**Expected Results:**
✅ All goals show as cards
✅ Can create new custom goals
✅ Custom goal appears immediately
✅ Back button returns to dashboard

---

### **Test 9: Navigation**

**Steps:**
1. Click profile picture → goes to `/profile`
2. Click back button → returns to home
3. Try navigating between all pages

**Expected Results:**
✅ Profile picture always visible
✅ Back buttons work
✅ Smooth transitions
✅ Profile image shows everywhere

---

### **Test 10: Data Persistence**

**Steps:**
1. Complete several substeps
2. Upload profile picture
3. Add a friend
4. Refresh the page (F5)

**Expected Results:**
✅ All tasks still checked
✅ Progress bars unchanged
✅ Profile picture still there
✅ Friends still in list
✅ Streak preserved
✅ Everything saved to localStorage

---

## 🐛 **Troubleshooting**

### Issue: Profile picture won't upload
**Solution:** 
- Check file size < 2MB
- Use JPG, PNG, or GIF format
- Try a different image

### Issue: Streak not updating
**Solution:**
- Must complete a task or substep
- Streak updates once per day
- Check date in browser

### Issue: Drag and drop not working
**Solution:**
- Make sure you're hovering to see drag handle
- Click and hold, then drag
- Try refreshing page

### Issue: Data lost on refresh
**Solution:**
- Check browser localStorage not disabled
- Check console for errors
- Try clearing localStorage and restart

---

## 📊 **Expected Data Structure**

After testing, your localStorage should contain:

```javascript
{
  "goals": [
    {
      "id": "...",
      "title": "BC PNP to Permanent Residence",
      "tasks": [/* 55 tasks with substeps */]
    }
  ],
  "profile": {
    "name": "Your Name",
    "email": "you@email.com",
    "bio": "Tracking my journey...",
    "profileImage": "data:image/jpeg;base64,...",
    "location": "Vancouver, BC"
  },
  "friends": [
    {
      "name": "Friend (ABC1)",
      "currentStreak": 15,
      // ... stats
    }
  ],
  "streak": {
    "currentStreak": 1,
    "longestStreak": 1,
    "streakHistory": ["2026-01-28"]
  },
  "invitations": [
    {
      "code": "ABC123XY",
      "used": false
    }
  ],
  "socialShares": [
    // Tracks when you share
  ]
}
```

---

## ✅ **Test Checklist**

- [ ] Profile picture uploaded and visible
- [ ] Profile info saved and displayed
- [ ] Goal created with substeps
- [ ] Tasks can be checked/unchecked
- [ ] Streak counter updates
- [ ] Progress bars work
- [ ] Money tracking displays correctly
- [ ] Drag-and-drop works for tasks
- [ ] Drag-and-drop works for substeps
- [ ] Friend invite code generated
- [ ] Friend added to list
- [ ] Friend comparison shows stats
- [ ] Social share buttons open correctly
- [ ] Navigation between pages works
- [ ] Back buttons work
- [ ] Data persists on refresh
- [ ] Mobile responsive (try resizing)

---

## 🎯 **Success Criteria**

Your app is working perfectly if:

✅ All 4 pages load without errors
✅ Profile picture appears in corner
✅ Can create and manage goals
✅ Drag-and-drop works smoothly
✅ Money tracking displays
✅ Friends can be added
✅ Invite codes work
✅ Social share opens platforms
✅ Data persists after refresh
✅ No console errors

---

## 📸 **Screenshots to Verify**

### Home Page Should Show:
- Profile picture in top-right
- Streak counter if > 0
- Goals list
- "New Goal" button

### Profile Page Should Show:
- Large avatar (uploaded or initial)
- Name, email, bio, location
- 4 stat cards
- Social share buttons

### Goals Page Should Show:
- All goals as expandable cards
- Tasks with substeps
- Drag handles on hover
- Cost tracking sections

### Friends Page Should Show:
- Add friend input
- Invite button
- Friend cards with comparisons
- "vs" format for stats
- Motivational banner

---

## 🚀 **You're Ready!**

If all tests pass, you have a **fully functional** social goal tracking app!

**Next Steps:**
1. Clear localStorage to start fresh
2. Create your real profile
3. Add your real goals
4. Invite real friends
5. Share your progress!

**Enjoy tracking your journey! 🎉**
