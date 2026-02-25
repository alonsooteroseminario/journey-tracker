# Goal Groups Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement user-created goal groups (single group per goal) with CRUD, filtering on Home and Board pages.

**Architecture:** New `GoalGroup` Prisma model with `groupId` on `Goal`. New API routes for group CRUD. RTK Query endpoints. UI components: GoalGroupManager (CRUD modal), GoalGroupSelector (on GoalCard), GoalGroupFilter (filter chips on Home/Board).

**Tech Stack:** Prisma + MongoDB, Next.js API routes, RTK Query, React, Tailwind CSS

---

## Task 1: Add GoalGroup model to Prisma schema

**Files:**
- Modify: `prisma/schema.prisma`

### Step 1: Add GoalGroup model

In `prisma/schema.prisma`, add after the Goal model (after line 85):

```prisma
model GoalGroup {
  id     String @id @default(auto()) @map("_id") @db.ObjectId
  userId String @db.ObjectId
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  name  String
  color String  @default("#6366f1")
  icon  String?
  order Int     @default(0)

  goals Goal[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("goal_groups")
}
```

### Step 2: Add groupId to Goal model

In the Goal model (around line 80), add before the `order` field:

```prisma
  groupId String?    @db.ObjectId
  group   GoalGroup? @relation(fields: [groupId], references: [id])
```

### Step 3: Add goalGroups relation to User model

In the User model (around line 40), add:

```prisma
  goalGroups GoalGroup[]
```

### Step 4: Regenerate Prisma client

Run: `npx prisma generate`
Expected: "Generated Prisma Client"

### Step 5: Commit

```bash
git add prisma/schema.prisma
git commit -m "feat: add GoalGroup model with groupId on Goal"
```

---

## Task 2: Add GoalGroup type to TypeScript types

**Files:**
- Modify: `src/types/index.ts`

### Step 1: Add GoalGroup interface

In `src/types/index.ts`, add after the Goal interface (around line 69):

```typescript
export interface GoalGroup {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}
```

### Step 2: Add groupId to Goal interface

In the Goal interface, add:

```typescript
  groupId?: string;
```

### Step 3: Verify build

Run: `npx tsc --noEmit`

### Step 4: Commit

```bash
git add src/types/index.ts
git commit -m "feat: add GoalGroup TypeScript interface and groupId to Goal"
```

---

## Task 3: Create GoalGroup API routes

**Files:**
- Create: `src/app/api/groups/route.ts`
- Create: `src/app/api/groups/[groupId]/route.ts`

### Step 1: Create GET + POST /api/groups

Create `src/app/api/groups/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const groups = await prisma.goalGroup.findMany({
    where: { userId: user.id },
    orderBy: { order: "asc" },
  });

  return NextResponse.json(groups);
}

export async function POST(req: Request) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();
  const { name, color, icon } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const count = await prisma.goalGroup.count({ where: { userId: user.id } });

  const group = await prisma.goalGroup.create({
    data: {
      userId: user.id,
      name: name.trim(),
      color: color || "#6366f1",
      icon: icon || undefined,
      order: count,
    },
  });

  return NextResponse.json(group, { status: 201 });
}
```

### Step 2: Create PATCH + DELETE /api/groups/[groupId]

Create `src/app/api/groups/[groupId]/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const group = await prisma.goalGroup.findUnique({ where: { id: groupId } });
  if (!group || group.userId !== user.id) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  const body = await req.json();
  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name.trim();
  if (body.color !== undefined) updates.color = body.color;
  if (body.icon !== undefined) updates.icon = body.icon;
  if (body.order !== undefined) updates.order = body.order;

  const updated = await prisma.goalGroup.update({
    where: { id: groupId },
    data: updates,
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const group = await prisma.goalGroup.findUnique({ where: { id: groupId } });
  if (!group || group.userId !== user.id) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  // Unset groupId on all goals in this group
  await prisma.goal.updateMany({
    where: { groupId },
    data: { groupId: null },
  });

  await prisma.goalGroup.delete({ where: { id: groupId } });

  return NextResponse.json({ success: true });
}
```

### Step 3: Verify build

Run: `npx tsc --noEmit`

### Step 4: Commit

```bash
git add src/app/api/groups/route.ts src/app/api/groups/[groupId]/route.ts
git commit -m "feat: add GoalGroup CRUD API routes"
```

---

## Task 4: Add GoalGroup RTK Query slice

**Files:**
- Create: `src/store/slices/groupsSlice.ts`
- Modify: `src/store/store.ts` (add reducer)

### Step 1: Create groupsSlice

Create `src/store/slices/groupsSlice.ts`:

```typescript
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { GoalGroup } from "@/types";

export const groupsApi = createApi({
  reducerPath: "groupsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["GoalGroup"],
  endpoints: (builder) => ({
    getGroups: builder.query<GoalGroup[], void>({
      query: () => "/groups",
      providesTags: ["GoalGroup"],
    }),
    createGroup: builder.mutation<GoalGroup, { name: string; color?: string; icon?: string }>({
      query: (body) => ({ url: "/groups", method: "POST", body }),
      invalidatesTags: ["GoalGroup"],
    }),
    updateGroup: builder.mutation<GoalGroup, { id: string; updates: Partial<GoalGroup> }>({
      query: ({ id, updates }) => ({ url: `/groups/${id}`, method: "PATCH", body: updates }),
      invalidatesTags: ["GoalGroup"],
    }),
    deleteGroup: builder.mutation<void, string>({
      query: (id) => ({ url: `/groups/${id}`, method: "DELETE" }),
      invalidatesTags: ["GoalGroup"],
    }),
  }),
});

export const {
  useGetGroupsQuery,
  useCreateGroupMutation,
  useUpdateGroupMutation,
  useDeleteGroupMutation,
} = groupsApi;
```

### Step 2: Register in store

In `src/store/store.ts`, import and add the groupsApi reducer and middleware (follow the pattern of goalsApi).

### Step 3: Verify build

Run: `npx tsc --noEmit`

### Step 4: Commit

```bash
git add src/store/slices/groupsSlice.ts src/store/store.ts
git commit -m "feat: add GoalGroup RTK Query slice and register in store"
```

---

## Task 5: Create GoalGroupManager component

**Files:**
- Create: `src/components/GoalGroupManager.tsx`

### Step 1: Create the group management UI

Create `src/components/GoalGroupManager.tsx`:

A modal/popover component that:
- Lists all groups with colored dots, name, and edit/delete buttons
- Has "Add Group" form (name input, color picker with 8 preset colors, optional emoji icon)
- Inline editing of group name/color
- Delete with confirmation
- Uses `useGetGroupsQuery`, `useCreateGroupMutation`, `useUpdateGroupMutation`, `useDeleteGroupMutation`

The component should accept `isOpen: boolean` and `onClose: () => void` props.

Preset colors: `["#6366f1", "#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#64748b"]`

### Step 2: Verify build

Run: `npx tsc --noEmit`

### Step 3: Commit

```bash
git add src/components/GoalGroupManager.tsx
git commit -m "feat: add GoalGroupManager component for group CRUD"
```

---

## Task 6: Create GoalGroupFilter component

**Files:**
- Create: `src/components/GoalGroupFilter.tsx`

### Step 1: Create filter chips component

Create `src/components/GoalGroupFilter.tsx`:

A horizontal row of filter chips:
- "All" chip (always first, selected when no group filter active)
- One chip per group (colored dot + name)
- Clicking a chip sets `selectedGroupId` state
- Accepts: `selectedGroupId: string | null`, `onGroupSelect: (id: string | null) => void`
- Uses `useGetGroupsQuery` to load groups
- Also shows a "Manage Groups" button (gear icon) that opens GoalGroupManager

### Step 2: Verify build

Run: `npx tsc --noEmit`

### Step 3: Commit

```bash
git add src/components/GoalGroupFilter.tsx
git commit -m "feat: add GoalGroupFilter component with filter chips"
```

---

## Task 7: Integrate group filter on Home page

**Files:**
- Modify: `src/app/page.tsx` or the component that renders GoalCards on the home page

### Step 1: Add GoalGroupFilter above goal list

- Import GoalGroupFilter
- Add `selectedGroupId` state
- Filter goals by `groupId` when a group is selected
- Render GoalGroupFilter above the goals grid

### Step 2: Add GoalGroupSelector to GoalCard header

In `src/components/GoalCard.tsx`, add a small dropdown in the header that allows assigning the goal to a group. Use the existing `updateGoal` mutation to set `groupId`.

### Step 3: Verify build

Run: `npx tsc --noEmit`

### Step 4: Commit

```bash
git add src/app/page.tsx src/components/GoalCard.tsx src/components/GoalGroupFilter.tsx
git commit -m "feat: integrate goal groups on Home page with filter and selector"
```

---

## Task 8: Integrate group filter on Board page

**Files:**
- Modify: `src/components/kanban/KanbanBoard.tsx`
- Modify: `src/components/kanban/KanbanFilters.tsx`

### Step 1: Add group filter state and apply to viewData

In KanbanBoard:
- Add `selectedGroupId` state
- Filter `goals` by `groupId` before computing `viewData`
- Pass group filter props to KanbanFilters

In KanbanFilters:
- Add GoalGroupFilter chips inline (or as separate row above filters)

### Step 2: Verify build

Run: `npx tsc --noEmit`

### Step 3: Commit

```bash
git add src/components/kanban/KanbanBoard.tsx src/components/kanban/KanbanFilters.tsx
git commit -m "feat: integrate goal groups filter on Board page"
```

---

## Task 9: Run full test suite and lint

### Step 1: Run tests

Run: `npx vitest run`
Expected: All tests pass

### Step 2: Run lint

Run: `npm run lint`

### Step 3: Commit fixes if needed

```bash
git add -A && git commit -m "chore: fix lint issues from goal groups feature"
```
