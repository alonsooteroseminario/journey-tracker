# Journey Tracker - Complete Setup Guide

## 🎯 What You Have Now

Your app has been upgraded from a localStorage-only application to a **full-stack, authenticated, cloud-backed system**:

- ✅ **MongoDB Atlas** - Persistent cloud database (Prisma ORM)
- ✅ **Clerk Authentication** - Secure user management with OAuth
- ✅ **Redux Toolkit** - Centralized state + API caching (RTK Query)
- ✅ **Auto Migration** - Seamless localStorage → MongoDB transfer
- ✅ **12 API Routes** - RESTful backend for all features
- ✅ **Backward Compatible** - All existing pages work without changes

---

## 📋 Prerequisites

1. **Node.js 18.x** (current: v18.18.0)
2. **MongoDB Atlas account** (free tier works)
3. **Clerk account** (free tier works)

---

## 🚀 Quick Start (5 minutes)

### Step 1: Verify MongoDB Connection

Your `.env` already has a working MongoDB connection:
```bash
DATABASE_URL="mongodb+srv://admin:NPMDBBr13o1EYMqR@cluster0.rzdyo.mongodb.net/journey-tracker?retryWrites=true&w=majority&appName=Cluster0"
```

✅ **Already done** - Database schema has been pushed to MongoDB

### Step 2: Verify Clerk Configuration

Your `.env` already has Clerk credentials:
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_dG91Y2hpbmctZG9lLTcuY2xlcmsuYWNjb3VudHMuZGV2JA
CLERK_SECRET_KEY=sk_test_Y308HEPus2lsyEjHmn7WmcP2LiBOxFum2AhBeN2crS
```

### Step 3: Install Dependencies (if not done)

```bash
npm install
```

### Step 4: Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) - you'll be redirected to Clerk sign-in.

---

## 🔐 First Login Experience

### What Happens on First Sign-Up:

1. **Clerk Creates Account** → User chooses email/password or OAuth (Google, GitHub)
2. **Webhook Triggers** → Creates user in MongoDB `users` collection
3. **Auto-Migration Runs** → If you have localStorage data, sees migration prompt
4. **You're In!** → All features now persist to MongoDB

### Test the Flow:

```bash
npm run dev
```

1. Visit http://localhost:3000
2. Click "Sign up" (or use existing account)
3. Complete sign-up flow
4. **Watch for migration overlay** if you had local data
5. Dashboard loads with your data now in the cloud

---

## 📂 Project Structure

```
journey-tracker/
├── prisma/
│   └── schema.prisma              # 7 MongoDB models
├── src/
│   ├── app/
│   │   ├── api/                   # 12 API routes
│   │   │   ├── goals/             # GET, POST, PATCH, DELETE goals
│   │   │   ├── profile/           # User profile management
│   │   │   ├── friends/           # Friend system + invites
│   │   │   ├── streaks/           # Streak tracking
│   │   │   ├── activity/          # Activity log
│   │   │   ├── invitations/       # Invite code generation
│   │   │   └── migrate/           # localStorage → MongoDB
│   │   ├── sign-in/               # Clerk sign-in page
│   │   ├── sign-up/               # Clerk sign-up page
│   │   └── layout.tsx             # ClerkProvider + AppShell
│   ├── components/
│   │   ├── AutoMigration.tsx      # Auto-migrates localStorage data
│   │   └── AppShell.tsx           # Redux + Migration wrapper
│   ├── store/
│   │   ├── index.ts               # Redux store config
│   │   ├── hooks.ts               # Typed useAppDispatch/useAppSelector
│   │   ├── provider.tsx           # <ReduxProvider>
│   │   └── slices/
│   │       ├── goalsSlice.ts      # Goals RTK Query API + UI state
│   │       ├── profileSlice.ts    # Profile API + UI state
│   │       ├── friendsSlice.ts    # Friends API + UI state
│   │       └── streaksSlice.ts    # Streaks API + UI state
│   ├── hooks/
│   │   ├── useGoals.ts            # ⭐ Rewritten - now uses RTK Query
│   │   └── useGoalsLocal.ts       # Backup of old localStorage hook
│   └── lib/
│       ├── prisma.ts              # Prisma client singleton
│       ├── auth.ts                # getCurrentUser() helper
│       └── storage.ts             # Utility functions (unchanged)
├── middleware.ts                  # Clerk route protection
├── .env                           # Your credentials (DO NOT COMMIT)
└── .env.example                   # Template for new developers
```

---

## 🔧 Configuration Details

### MongoDB Atlas Collections Created:

When you ran `npx prisma db push`, these collections were created:

| Collection | Purpose | Indexes |
|------------|---------|---------|
| `users` | User profiles (name, email, Clerk ID) | `clerkId`, `email` |
| `goals` | Goals with embedded tasks/substeps (JSON) | `userId` |
| `streaks` | Streak data (currentStreak, history) | `userId` |
| `friendships` | Bidirectional friend relationships | `userId`, `friendId`, unique pair |
| `invitations` | Friend invite codes | `code`, `userId` |
| `social_shares` | Social media share tracking | `userId` |
| `activity_logs` | Activity feed entries | `userId`, `timestamp` |

### Clerk Routes:

| Route | Access | Description |
|-------|--------|-------------|
| `/sign-in` | Public | Clerk sign-in UI |
| `/sign-up` | Public | Clerk sign-up UI |
| `/` | Protected | Main dashboard (requires auth) |
| `/goals` | Protected | Goals management |
| `/friends` | Protected | Friends list |
| `/profile` | Protected | User profile |
| `/api/*` | Protected | All API routes require auth |

---

## 🧪 Testing Checklist

### Manual Testing:

```bash
npm run dev
```

**1. Authentication Flow:**
- [ ] Visit http://localhost:3000 → redirects to `/sign-in`
- [ ] Sign up with email/password
- [ ] Verify redirect to dashboard
- [ ] Sign out (use Clerk UserButton if added)
- [ ] Sign in again

**2. Auto-Migration:**
- [ ] Open DevTools → Application → localStorage
- [ ] Check for key `journey-tracker-state` with goals data
- [ ] Sign in to trigger migration
- [ ] See migration overlay (if data exists)
- [ ] Verify data appears in dashboard after migration
- [ ] Check MongoDB Atlas - see data in collections

**3. Goal CRUD:**
- [ ] Create a new goal → check MongoDB `goals` collection
- [ ] Add tasks to goal → verify in database
- [ ] Toggle task completion → check `activity_logs` collection
- [ ] Delete goal → verify removed from database

**4. Streak System:**
- [ ] Complete a task → streak increments
- [ ] Check MongoDB `streaks` collection
- [ ] Verify `streakHistory` array updated

**5. Friends System:**
- [ ] Go to `/friends`
- [ ] Generate invite code
- [ ] Copy code, sign up as different user
- [ ] Use invite code to add friend
- [ ] Check `friendships` collection (2 records: bidirectional)

**6. Profile:**
- [ ] Go to `/profile`
- [ ] Update name/bio/location
- [ ] Upload profile image
- [ ] Check `users` collection for updates

### API Testing (with curl):

```bash
# Get all goals (requires authentication - use Clerk session token)
curl http://localhost:3000/api/goals \
  -H "Cookie: __session=<clerk-token>"

# Create a goal
curl -X POST http://localhost:3000/api/goals \
  -H "Content-Type: application/json" \
  -H "Cookie: __session=<clerk-token>" \
  -d '{"title":"Test Goal","tasks":[]}'

# Get streak data
curl http://localhost:3000/api/streaks \
  -H "Cookie: __session=<clerk-token>"
```

---

## 🐛 Troubleshooting

### Issue: "Unauthorized" on all API calls

**Solution:**
1. Make sure you're signed in via Clerk
2. Check `middleware.ts` is protecting routes correctly
3. Verify Clerk environment variables are set

### Issue: Migration overlay stuck/won't dismiss

**Solution:**
```javascript
// In browser console:
localStorage.setItem('journey-tracker-migrated-to-db', 'true')
// Refresh page
```

### Issue: Prisma Client not found

**Solution:**
```bash
npx prisma generate
npm run dev
```

### Issue: MongoDB connection failed

**Solution:**
1. Check `DATABASE_URL` in `.env`
2. Verify IP whitelist in MongoDB Atlas (allow `0.0.0.0/0` for testing)
3. Check username/password are correct

### Issue: Build fails with type errors

**Solution:**
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

### Issue: Old localStorage hook still being used

**Solution:**
The new `useGoals()` hook should automatically use RTK Query. If you see localStorage operations:
1. Check you're importing from `@/hooks/useGoals` (not `useGoalsLocal`)
2. Verify Redux store is mounted in `layout.tsx`
3. Check browser Network tab - should see API calls to `/api/goals`, etc.

---

## 🚢 Deployment (Vercel)

### Step 1: Push to GitHub

```bash
git add .
git commit -m "feat: Add MongoDB, Clerk, Redux Toolkit integration"
git push origin main
```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repo
3. **Add Environment Variables:**
   ```
   DATABASE_URL=mongodb+srv://...
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```
4. Click "Deploy"

### Step 3: Configure Clerk for Production

1. Go to [clerk.com dashboard](https://dashboard.clerk.com)
2. Update allowed redirect URLs:
   - Add `https://your-app.vercel.app`
   - Add `https://your-app.vercel.app/sign-in`
   - Add `https://your-app.vercel.app/sign-up`

### Step 4: Setup Clerk Webhook (Optional but Recommended)

1. In Clerk dashboard → Webhooks
2. Add endpoint: `https://your-app.vercel.app/api/webhooks/clerk`
3. Subscribe to events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
4. Copy signing secret
5. Add to Vercel environment variables:
   ```
   CLERK_WEBHOOK_SECRET=whsec_...
   ```

### Step 5: Verify Production

1. Visit your Vercel URL
2. Sign up with a new account
3. Check MongoDB Atlas - user should be created
4. Create a goal - should persist

---

## 📊 Monitoring

### MongoDB Atlas

1. Go to [MongoDB Atlas Dashboard](https://cloud.mongodb.com)
2. Click your cluster → Browse Collections
3. See real-time data in `journey-tracker` database

### Clerk Dashboard

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Users tab → see all registered users
3. Sessions tab → active sessions
4. Webhooks tab → delivery logs

### Vercel Logs

```bash
# Install Vercel CLI
npm i -g vercel

# View logs
vercel logs <your-project-name>
```

---

## 🔒 Security Checklist

- [x] Clerk middleware protects all routes except sign-in/sign-up
- [x] API routes verify user ownership before mutations
- [x] MongoDB uses connection pooling (Prisma handles this)
- [x] Environment variables in `.env` (not committed to git)
- [ ] **TODO:** Add rate limiting to API routes
- [ ] **TODO:** Add CORS configuration for production
- [ ] **TODO:** Enable Clerk MFA for admin users

---

## 🎓 How the System Works

### Data Flow: Creating a Goal

```
1. User clicks "Create Goal" in UI
   ↓
2. Component calls `addGoal()` from useGoals hook
   ↓
3. Hook calls `createGoalMutation()` from RTK Query
   ↓
4. RTK Query sends: POST /api/goals
   ↓
5. API route middleware checks Clerk auth
   ↓
6. getCurrentUser() resolves Clerk user to DB user
   ↓
7. Prisma creates goal in MongoDB
   ↓
8. API returns new goal JSON
   ↓
9. RTK Query caches response in Redux store
   ↓
10. UI re-renders with new goal (no manual refresh!)
```

### Caching & Invalidation

RTK Query automatically:
- **Caches** all GET requests (goals, profile, friends, streaks)
- **Invalidates** cache when mutations occur (create, update, delete)
- **Refetches** data in background to stay fresh
- **Optimistic updates** for instant UI feedback

Example:
```typescript
// When you delete a goal:
deleteGoalMutation(goalId)
  → API: DELETE /api/goals/:id
  → Redux: Invalidate tag "Goal"
  → RTK Query: Refetch all queries tagged "Goal"
  → UI: Updates automatically
```

---

## 📚 API Reference

### Goals API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/goals` | GET | List all goals for current user |
| `/api/goals` | POST | Create new goal |
| `/api/goals/:id` | GET | Get single goal |
| `/api/goals/:id` | PATCH | Update goal |
| `/api/goals/:id` | DELETE | Delete goal |
| `/api/goals/:goalId/tasks/:taskId` | PATCH | Update specific task |

### Profile API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/profile` | GET | Get current user profile |
| `/api/profile` | PATCH | Update profile |
| `/api/profile/image` | POST | Upload profile image (Base64) |

### Friends API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/friends` | GET | List all friends with stats |
| `/api/friends` | POST | Add friend via invite code |
| `/api/friends/:id` | GET | Get friend details + goals |
| `/api/friends/:id` | DELETE | Remove friend |

### Streaks API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/streaks` | GET | Get current streak data |
| `/api/streaks` | PATCH | Record activity + update streak |

### Activity API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/activity` | GET | Get activity log (`?limit=50`) |
| `/api/activity` | POST | Log new activity entry |

### Invitations API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/invitations` | GET | List user's invite codes |
| `/api/invitations` | POST | Generate new invite code |

### Migration API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/migrate` | POST | Migrate localStorage data to MongoDB |

---

## 🛠️ Advanced Customization

### Adding a New Feature

Example: Add a "Comments" feature to goals

**1. Update Prisma Schema:**
```prisma
// prisma/schema.prisma
model Comment {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  userId    String   @db.ObjectId
  user      User     @relation(fields: [userId], references: [id])
  goalId    String
  text      String
  createdAt DateTime @default(now())

  @@map("comments")
}
```

**2. Push to DB:**
```bash
npx prisma db push
npx prisma generate
```

**3. Create Redux Slice:**
```typescript
// src/store/slices/commentsSlice.ts
export const commentsApi = createApi({
  reducerPath: 'commentsApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  endpoints: (builder) => ({
    getComments: builder.query<Comment[], string>({
      query: (goalId) => `/comments?goalId=${goalId}`,
    }),
    addComment: builder.mutation<Comment, { goalId: string; text: string }>({
      query: (body) => ({
        url: '/comments',
        method: 'POST',
        body,
      }),
    }),
  }),
});
```

**4. Add API Route:**
```typescript
// src/app/api/comments/route.ts
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  const { goalId, text } = await req.json();
  
  const comment = await prisma.comment.create({
    data: { userId: user.id, goalId, text },
  });
  
  return NextResponse.json(comment);
}
```

**5. Use in Components:**
```typescript
const { data: comments } = useGetCommentsQuery(goalId);
const [addComment] = useAddCommentMutation();
```

---

## 🎉 Success!

Your Journey Tracker is now a **production-ready, full-stack application** with:
- ✅ Cloud database persistence
- ✅ Secure authentication
- ✅ Centralized state management
- ✅ RESTful API backend
- ✅ Auto-migration from localStorage
- ✅ Real-time friend activity
- ✅ Scalable architecture

**Next Steps:**
1. Test the sign-up flow
2. Create a goal and watch it save to MongoDB
3. Invite a friend and test the social features
4. Deploy to Vercel
5. Share your achievement tracker with the world!

---

## 📞 Support

**Issues?** Check:
1. This guide's troubleshooting section
2. MongoDB Atlas connection logs
3. Clerk dashboard webhook delivery logs
4. Browser console for errors
5. Vercel deployment logs

**Need help?** 
- MongoDB Atlas docs: https://docs.atlas.mongodb.com
- Clerk docs: https://clerk.com/docs
- Prisma docs: https://www.prisma.io/docs
- Redux Toolkit docs: https://redux-toolkit.js.org

**Enjoy your cloud-powered goal tracker!** 🚀
