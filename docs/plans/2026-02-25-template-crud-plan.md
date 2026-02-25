# Template & Marketplace Full CRUD Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable full structural editing of templates — add/edit/remove tasks, phases, substeps, and resources within templates.

**Architecture:** Extend the existing `PATCH /api/templates/[templateId]` to accept action-based structural mutations. Create a `TemplateEditor` component with inline editing for tasks, substeps, phases, and resources. RTK Query already has `useUpdateTemplateMutation` — extend payload to support structural changes.

**Tech Stack:** Next.js API routes, Prisma + MongoDB, RTK Query, React, Tailwind CSS

---

## Task 1: Extend template PATCH API to accept structural changes

**Files:**
- Modify: `src/app/api/templates/[templateId]/route.ts:77-132`

### Step 1: Extend the PATCH handler validation

In the PATCH handler, currently only metadata fields are accepted (lines 77-132). Extend the Zod schema and handler to accept an `action` field with structural mutations.

Add to the Zod schema (around line 6):

```typescript
const updateTemplateSchema = z.object({
  // Existing metadata fields
  lessonsLearned: z.string().optional(),
  tips: z.string().optional(),
  estimatedDuration: z.string().optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  visibility: z.enum(["friends", "public"]).optional(),
  isPublished: z.boolean().optional(),
  // New: structural mutations
  action: z.enum([
    "addTask", "updateTask", "removeTask",
    "addPhase", "updatePhase", "removePhase",
    "addSubstep", "updateSubstep", "removeSubstep",
    "addResource", "updateResource", "removeResource",
  ]).optional(),
  payload: z.record(z.any()).optional(),
}).refine((data) => {
  if (data.action && !data.payload) return false;
  return true;
}, { message: "payload required when action is provided" });
```

### Step 2: Add action handler logic in the PATCH route

After the existing metadata update logic, add action processing:

```typescript
if (action && payload) {
  const tasks = (template.tasks as any[]) || [];
  const phases = (template.phases as any[]) || [];
  const resources = (template.resources as any[]) || [];

  let updatedData: Record<string, unknown> = {};

  switch (action) {
    case "addTask": {
      const newTask = {
        id: crypto.randomUUID(),
        title: payload.title || "New Task",
        description: payload.description || "",
        status: "not_started",
        substeps: [],
        ...payload,
      };
      updatedData.tasks = [...tasks, newTask];
      break;
    }
    case "updateTask": {
      updatedData.tasks = tasks.map((t: any) =>
        t.id === payload.taskId ? { ...t, ...payload.updates } : t
      );
      break;
    }
    case "removeTask": {
      updatedData.tasks = tasks.filter((t: any) => t.id !== payload.taskId);
      break;
    }
    case "addSubstep": {
      updatedData.tasks = tasks.map((t: any) => {
        if (t.id !== payload.taskId) return t;
        const substeps = t.substeps || [];
        return {
          ...t,
          substeps: [...substeps, {
            id: crypto.randomUUID(),
            title: payload.title || "New Substep",
            description: payload.description || "",
            status: "not_started",
            ...payload.substepData,
          }],
        };
      });
      break;
    }
    case "updateSubstep": {
      updatedData.tasks = tasks.map((t: any) => {
        if (t.id !== payload.taskId) return t;
        return {
          ...t,
          substeps: (t.substeps || []).map((s: any) =>
            s.id === payload.substepId ? { ...s, ...payload.updates } : s
          ),
        };
      });
      break;
    }
    case "removeSubstep": {
      updatedData.tasks = tasks.map((t: any) => {
        if (t.id !== payload.taskId) return t;
        return {
          ...t,
          substeps: (t.substeps || []).filter((s: any) => s.id !== payload.substepId),
        };
      });
      break;
    }
    case "addPhase": {
      updatedData.phases = [...phases, {
        id: crypto.randomUUID(),
        name: payload.name || "New Phase",
        description: payload.description || "",
        taskIds: [],
        ...payload,
      }];
      break;
    }
    case "updatePhase": {
      updatedData.phases = phases.map((p: any) =>
        p.id === payload.phaseId ? { ...p, ...payload.updates } : p
      );
      break;
    }
    case "removePhase": {
      updatedData.phases = phases.filter((p: any) => p.id !== payload.phaseId);
      break;
    }
    case "addResource": {
      updatedData.resources = [...resources, {
        category: payload.category || "General",
        items: [{ name: payload.name, url: payload.url }],
      }];
      break;
    }
    case "updateResource": {
      updatedData.resources = resources.map((r: any, i: number) =>
        i === payload.index ? { ...r, ...payload.updates } : r
      );
      break;
    }
    case "removeResource": {
      updatedData.resources = resources.filter((_: any, i: number) => i !== payload.index);
      break;
    }
  }

  if (Object.keys(updatedData).length > 0) {
    await prisma.goalTemplate.update({
      where: { id: templateId },
      data: updatedData,
    });
  }
}
```

### Step 3: Verify build

Run: `npx tsc --noEmit`

### Step 4: Commit

```bash
git add src/app/api/templates/[templateId]/route.ts
git commit -m "feat: extend template PATCH API to support structural CRUD actions"
```

---

## Task 2: Create TemplateEditor component

**Files:**
- Create: `src/components/templates/TemplateEditor.tsx`

### Step 1: Create the main template editor

Create `src/components/templates/TemplateEditor.tsx`:

A full editor interface that displays:
- Template metadata (title, description) at the top
- **Tasks section**: List of tasks, each with:
  - Inline editable title (click to edit)
  - Inline editable description
  - Priority selector
  - Delete button (with confirmation)
  - "Add Substep" button
  - Substep list with inline editing + delete
- **Phases section**: List of phases with:
  - Inline editable name + description
  - Delete button
  - "Add Phase" button
- **Resources section**: Resource categories with items
  - Add/remove resource items
- "Add Task" button at bottom of tasks section

Uses `useUpdateTemplateMutation` for all mutations. Each action sends:
```typescript
updateTemplate({ id: templateId, updates: { action: "addTask", payload: { title: "..." } } })
```

### Step 2: Verify build

Run: `npx tsc --noEmit`

### Step 3: Commit

```bash
git add src/components/templates/TemplateEditor.tsx
git commit -m "feat: add TemplateEditor component with full task/substep/phase CRUD"
```

---

## Task 3: Integrate TemplateEditor into TemplateDetailModal

**Files:**
- Modify: `src/components/templates/TemplateDetailModal.tsx`

### Step 1: Add edit mode toggle

In TemplateDetailModal, add:
- `isEditing` state (boolean, default false)
- "Edit" button visible only when the current user is the template author
- When `isEditing === true`, render `<TemplateEditor>` instead of the read-only task list
- "Done Editing" button to exit edit mode

### Step 2: Pass author check

The modal receives `template` prop which has `authorId`. Compare with current user ID to show/hide edit button.

### Step 3: Verify build

Run: `npx tsc --noEmit`

### Step 4: Commit

```bash
git add src/components/templates/TemplateDetailModal.tsx
git commit -m "feat: integrate TemplateEditor in TemplateDetailModal with edit toggle"
```

---

## Task 4: Add TemplateEditor to MarketplaceView for authors

**Files:**
- Modify: `src/components/views/MarketplaceView.tsx` (or marketplace detail page)

### Step 1: Add edit capability for template authors in marketplace view

When viewing their own published template, authors should see an "Edit Template" button that opens the editor.

### Step 2: Verify build

Run: `npx tsc --noEmit`

### Step 3: Commit

```bash
git add src/components/views/MarketplaceView.tsx
git commit -m "feat: enable template editing from marketplace view for authors"
```

---

## Task 5: Run full test suite and lint

### Step 1: Run tests

Run: `npx vitest run`
Expected: All existing tests pass

### Step 2: Run lint

Run: `npm run lint`

### Step 3: Commit fixes if needed

```bash
git add -A && git commit -m "chore: fix lint from template CRUD feature"
```
