# Migration Guide: localStorage → Cloud Database

This guide explains how the automatic migration works and what happens to your existing data.

---

## 🎯 Overview

Your Journey Tracker has been upgraded from storing data in **browser localStorage** to a **cloud MongoDB database**. This means:

- ✅ **Your data is safe** - Synced across devices
- ✅ **No manual work** - Migration happens automatically on first login
- ✅ **Nothing is lost** - localStorage is kept as backup
- ✅ **Works offline** - Redux cache keeps data available

---

## 🚀 What Happens During Migration

### First-Time User (No Existing Data)

```
1. Visit http://localhost:3000
2. Clerk redirects to /sign-in
3. Sign up with email or OAuth
4. User created in MongoDB
5. Dashboard loads (empty state - no migration needed)
```

**Result:** Fresh start with cloud storage from day 1.

---

### Existing User (Has localStorage Data)

```
1. Visit http://localhost:3000
2. Clerk redirects to /sign-in
3. Sign in with your new account
   ↓
4. AutoMigration component detects localStorage data
   ↓
5. Shows migration overlay:
   ┌─────────────────────────────────────┐
   │  ⏳ Migrating Your Data             │
   │                                     │
   │  Transferring your goals and        │
   │  progress to the cloud...           │
   └─────────────────────────────────────┘
   ↓
6. POST /api/migrate with localStorage JSON
   ↓
7. Server transfers to MongoDB:
   - Goals → goals collection
   - Streak → streaks collection  
   - Profile → users collection
   - Activity Log → activity_logs collection
   ↓
8. localStorage marked as migrated
   ↓
9. Dashboard loads with all your data!
```

**Result:** All goals, tasks, streaks, and progress are now in MongoDB.

---

## 📊 What Gets Migrated

| Data Type | Source (localStorage) | Destination (MongoDB) | Notes |
|-----------|----------------------|----------------------|-------|
| **Goals** | `state.goals` array | `goals` collection | All tasks, substeps, phases, budgets, documents |
| **Tasks** | `goal.tasks` array | Embedded in goal JSON | Includes all substeps, costs, dates |
| **Streak Data** | `state.streak` object | `streaks` collection | currentStreak, longestStreak, history |
| **Profile** | `state.profile` object | `users` collection | Name, bio, location, timezone, profileImage |
| **Activity Log** | `state.activityLog` array | `activity_logs` collection | All task completions, cost updates |
| **Friends** | `state.friends` array | NOT migrated | Friends added via invite codes in new system |
| **Invitations** | `state.invitations` array | NOT migrated | Generate new invite codes |
| **Social Shares** | `state.socialShares` array | NOT migrated | Historical data only |

---

## 🔍 Technical Details

### Migration Logic (AutoMigration.tsx)

```typescript
useEffect(() => {
  // 1. Check if already migrated
  const alreadyMigrated = localStorage.getItem('journey-tracker-migrated-to-db');
  if (alreadyMigrated) return;

  // 2. Load localStorage data
  const localData = JSON.parse(localStorage.getItem('journey-tracker-state'));

  // 3. Check if there's anything worth migrating
  const hasGoals = localData.goals?.length > 0;
  const hasStreak = localData.streak?.currentStreak > 0;
  const hasActivity = localData.activityLog?.length > 0;

  if (!hasGoals && !hasStreak && !hasActivity) {
    // Nothing to migrate
    localStorage.setItem('journey-tracker-migrated-to-db', 'true');
    return;
  }

  // 4. Perform migration
  await migrateData(localData);

  // 5. Mark as migrated to prevent duplicate migrations
  localStorage.setItem('journey-tracker-migrated-to-db', 'true');
}, [user]);
```

### Server-Side Migration (api/migrate/route.ts)

```typescript
export async function POST(req) {
  const user = await getCurrentUser(); // From Clerk
  const { goals, profile, streak, activityLog } = await req.json();

  // 1. Migrate goals (only if user has no goals yet)
  const existingGoals = await prisma.goal.count({ where: { userId: user.id } });
  if (existingGoals === 0) {
    for (const goal of goals) {
      await prisma.goal.create({
        data: {
          userId: user.id,
          title: goal.title,
          tasks: goal.tasks, // JSON field preserves nested structure
          // ... all other fields
        },
      });
    }
  }

  // 2. Update profile data
  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: profile.name,
      bio: profile.bio,
      // ...
    },
  });

  // 3. Migrate streak data
  await prisma.streakData.upsert({
    where: { userId: user.id },
    update: { /* streak data */ },
    create: { /* streak data */ },
  });

  // 4. Migrate activity log
  for (const activity of activityLog) {
    await prisma.activityLog.create({
      data: { userId: user.id, /* activity fields */ },
    });
  }

  return { success: true };
}
```

---

## 🛠️ Manual Migration (If Needed)

If automatic migration fails or you want to manually transfer data:

### Step 1: Export localStorage Data

Open browser console and run:

```javascript
// Get all data from localStorage
const data = JSON.parse(localStorage.getItem('journey-tracker-state'));

// Save to file
const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'journey-tracker-backup.json';
a.click();
```

You now have a `journey-tracker-backup.json` file.

### Step 2: Import via API

```bash
# Sign in to get auth token
curl -X POST http://localhost:3000/api/migrate \
  -H "Content-Type: application/json" \
  -H "Cookie: __session=<your-clerk-token>" \
  -d @journey-tracker-backup.json
```

### Step 3: Verify in MongoDB

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Browse Collections → `journey-tracker` database
3. Check collections:
   - `goals` - Should have your goals
   - `streaks` - Should have your streak data
   - `users` - Should have updated profile
   - `activity_logs` - Should have your activity history

---

## 🔄 Re-Migration (Edge Cases)

### Scenario: Migration Failed Mid-Process

If you see errors during migration, you can retry:

```javascript
// In browser console:
localStorage.removeItem('journey-tracker-migrated-to-db');
// Refresh page - migration will run again
```

### Scenario: Want to Add More Data After Migration

Migration only runs once. To add more goals later:

**Option 1:** Use the app normally (goals auto-save to MongoDB)

**Option 2:** Manually create via API:

```bash
curl -X POST http://localhost:3000/api/goals \
  -H "Content-Type: application/json" \
  -H "Cookie: __session=<token>" \
  -d '{
    "title": "New Goal",
    "description": "Added manually",
    "tasks": []
  }'
```

### Scenario: Duplicate Data After Migration

If you see duplicate goals (rare), delete via UI or API:

```bash
# List all goals
curl http://localhost:3000/api/goals \
  -H "Cookie: __session=<token>"

# Delete specific goal
curl -X DELETE http://localhost:3000/api/goals/<goal-id> \
  -H "Cookie: __session=<token>"
```

---

## 📦 Data Backup Best Practices

### Before Migration

1. **Export localStorage** (instructions above)
2. Keep the JSON file safe
3. Verify file contains your goals

### After Migration

1. **Test data integrity:**
   - Open app → check all goals are visible
   - Click into a goal → verify all tasks/substeps
   - Check streak counter
   - Verify profile information

2. **Verify in MongoDB:**
   - Browse collections in Atlas
   - Spot-check a few goals
   - Confirm streak history array

3. **Keep localStorage as backup** (for now):
   - Don't clear browser data immediately
   - After 1-2 weeks of successful cloud usage, you can clear

---

## 🚨 Troubleshooting

### Issue: Migration overlay stuck/infinite loading

**Cause:** API request failed or took too long

**Solution:**
```javascript
// Force migration to complete
localStorage.setItem('journey-tracker-migrated-to-db', 'true');
// Refresh page
location.reload();

// Then manually verify data migrated in MongoDB Atlas
// If not, use Manual Migration steps above
```

### Issue: Old data still in localStorage after migration

**This is normal!** localStorage is kept as backup. The app now reads from MongoDB via Redux.

To verify which source is active:
```javascript
// Check if migration happened
localStorage.getItem('journey-tracker-migrated-to-db'); // Should be "true"

// Open Network tab in DevTools
// Create a goal
// You should see: POST /api/goals (not localStorage setItem)
```

### Issue: Data in MongoDB but not showing in app

**Cause:** RTK Query cache issue

**Solution:**
```javascript
// Hard refresh to clear cache
window.location.reload(true);

// Or clear all caches
localStorage.clear();
sessionStorage.clear();
// Then sign in again
```

### Issue: Want to reset and start fresh

**Steps:**
1. Delete all MongoDB collections in Atlas
2. Clear browser localStorage
3. Sign out of Clerk
4. Sign back in (creates fresh user)

---

## 📊 Migration Statistics

To see how much data was migrated:

```javascript
// In browser console (before migration):
const state = JSON.parse(localStorage.getItem('journey-tracker-state'));

console.log('Migration Stats:');
console.log('- Goals:', state.goals?.length || 0);
console.log('- Total Tasks:', state.goals?.reduce((sum, g) => sum + g.tasks.length, 0));
console.log('- Substeps:', state.goals?.reduce((sum, g) => 
  sum + g.tasks.reduce((s, t) => s + (t.substeps?.length || 0), 0), 0));
console.log('- Current Streak:', state.streak?.currentStreak || 0);
console.log('- Longest Streak:', state.streak?.longestStreak || 0);
console.log('- Activity Log Entries:', state.activityLog?.length || 0);
console.log('- Friends:', state.friends?.length || 0);
```

---

## ✅ Post-Migration Checklist

After migration completes:

- [ ] All goals visible in dashboard
- [ ] Tasks and substeps intact
- [ ] Streak counter shows correct value
- [ ] Profile information correct
- [ ] Create new goal → saves to MongoDB
- [ ] Toggle task completion → updates MongoDB
- [ ] Activity log shows historical entries
- [ ] Friends list may be empty (re-add via invite codes)
- [ ] MongoDB Atlas shows data in all collections

---

## 🎓 Understanding the New Data Flow

### Old System (localStorage only):

```
User Action → useGoals Hook → setState → localStorage.setItem
                                             ↓
                                        Browser Storage
                                        (Lost if cache cleared)
```

### New System (Cloud Database):

```
User Action → useGoals Hook → RTK Query Mutation → API Route → Prisma → MongoDB
                                     ↓                                      ↓
                              Redux Cache                          Cloud Storage
                          (Instant UI update)                    (Persistent)
```

**Benefits:**
- ✅ Data survives browser cache clears
- ✅ Accessible across devices
- ✅ RTK Query handles caching automatically
- ✅ Optimistic updates for instant UI
- ✅ Auto-refetch keeps data fresh

---

## 🔐 Security Notes

### Your Data is Safe Because:

1. **Clerk Authentication** - Only you can access your data
2. **Middleware Protection** - All API routes require valid session
3. **Ownership Checks** - Server verifies `userId` on every mutation
4. **MongoDB Access Control** - Only your Prisma client can connect
5. **Environment Variables** - Secrets never in client code

### What's Stored Where:

| Data | Storage | Encrypted | Accessible |
|------|---------|-----------|------------|
| Goals, Tasks | MongoDB | In transit (TLS) | Only your user ID |
| Clerk Session | Cookies | Yes | Clerk + your backend |
| Redux Cache | Memory | N/A | Current browser tab only |
| localStorage Backup | Browser | No | Local only (cleared after migration verified) |

---

## 📞 Need Help?

**Migration Issues:**
1. Check browser console for errors
2. Check Network tab for failed API calls
3. Verify MongoDB connection in Atlas
4. Review Clerk dashboard for auth issues

**Data Integrity Concerns:**
- Always keep your localStorage backup JSON
- MongoDB Atlas has automatic backups (7 days on free tier)
- You can export from MongoDB anytime

**Questions?**
- Read SETUP_GUIDE.md for full documentation
- Run `node scripts/verify-setup.js` to check configuration
- Check MongoDB Atlas connection logs
- Review Clerk webhook delivery logs

---

## 🎉 Migration Complete!

Your data is now safely stored in the cloud and synced in real-time. Enjoy the benefits:

- 📱 Access from any device
- 🌐 Data persists forever (not tied to browser)
- 🤝 Real friend collaboration
- 📊 Analytics and insights
- 🚀 Fast, cached performance
- 🔒 Secure, authenticated access

**Welcome to cloud-powered goal tracking!** 🚀
