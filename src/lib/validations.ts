import { z } from "zod";

/**
 * Shared validation schemas for API request validation
 */

// ==========================================
// Common Schemas
// ==========================================

const isoDateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be ISO date format (YYYY-MM-DD)");
const isoDateTimeString = z.string().datetime({ message: "Must be ISO datetime format" });

// ==========================================
// Goal Schemas
// ==========================================

const SubstepSchema = z.object({
  id: z.string().optional(), // Optional for creation, server generates if missing
  title: z.string().min(1, "Substep title is required").max(200, "Title too long"),
  description: z.string().max(1000, "Description too long").optional(),
  completed: z.boolean().default(false),
  completedAt: isoDateTimeString.optional(),
  cost: z.number().min(0, "Cost cannot be negative").optional(),
  estimatedCost: z.number().min(0, "Estimated cost cannot be negative").optional(),
  dueDate: isoDateString.optional(),
  notes: z.string().max(2000, "Notes too long").optional(),
  order: z.number().int().min(0, "Order must be non-negative"),
});

const TaskSchema = z.object({
  id: z.string().optional(), // Optional for creation
  title: z.string().min(1, "Task title is required").max(200, "Title too long"),
  description: z.string().max(1000, "Description too long").optional(),
  completed: z.boolean().default(false),
  completedAt: isoDateTimeString.optional(),
  order: z.number().int().min(0, "Order must be non-negative"),
  phase: z.string().max(100).optional(),
  stepNumber: z.string().max(50).optional(),
  documentsNeeded: z.string().max(500).optional(),
  cost: z.string().max(50).optional(), // Display string
  actualCost: z.number().min(0, "Actual cost cannot be negative").optional(),
  estimatedCost: z.number().min(0, "Estimated cost cannot be negative").optional(),
  dueDate: isoDateString.optional(),
  startDate: isoDateString.optional(),
  notes: z.string().max(2000, "Notes too long").optional(),
  substeps: z.array(SubstepSchema).optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  tags: z.array(z.string().max(50)).max(20, "Too many tags").optional(),
});

export const CreateGoalSchema = z.object({
  title: z.string().min(1, "Goal title is required").max(200, "Title too long"),
  description: z.string().max(2000, "Description too long").optional(),
  icon: z.string().max(10, "Icon too long").optional(),
  tasks: z.array(TaskSchema).default([]),
  startDate: isoDateString.optional(),
  targetDate: isoDateString.optional(),
  isPublic: z.boolean().default(true),
  // Complex nested fields (JSON) - accept any valid JSON structure
  phases: z.any().optional(),
  budget: z.any().optional(),
  timeline: z.any().optional(),
  documents: z.any().optional(),
  resources: z.any().optional(),
});

export const UpdateGoalSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  icon: z.string().max(10).optional(),
  tasks: z.array(TaskSchema).optional(),
  startDate: isoDateString.nullable().optional(),
  targetDate: isoDateString.nullable().optional(),
  isPublic: z.boolean().optional(),
  phases: z.any().optional(),
  budget: z.any().optional(),
  timeline: z.any().optional(),
  documents: z.any().optional(),
  resources: z.any().optional(),
});

// ==========================================
// Task Update Schema (PATCH task within goal)
// ==========================================

// Whitelist of allowed fields to prevent 'id' override attacks
export const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  completed: z.boolean().optional(),
  completedAt: isoDateTimeString.nullable().optional(),
  order: z.number().int().min(0).optional(),
  phase: z.string().max(100).optional(),
  stepNumber: z.string().max(50).optional(),
  documentsNeeded: z.string().max(500).optional(),
  cost: z.string().max(50).optional(),
  actualCost: z.number().min(0).nullable().optional(),
  estimatedCost: z.number().min(0).nullable().optional(),
  dueDate: isoDateString.nullable().optional(),
  startDate: isoDateString.nullable().optional(),
  notes: z.string().max(2000).optional(),
  substeps: z.array(SubstepSchema).optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
}).strict(); // Reject any extra fields (prevents 'id' injection)

// ==========================================
// Profile Schemas
// ==========================================

export const UpdateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long").optional(),
  email: z.string().email("Invalid email format").max(255).optional(),
  bio: z.string().max(500, "Bio too long").optional(),
  location: z.string().max(100, "Location too long").optional(),
  timezone: z.string().max(50, "Timezone too long").optional(),
  profileImage: z.string().optional(), // Base64 or URL - validated separately for size
});

export const ProfileImageSchema = z.object({
  image: z.string()
    .min(1, "Image data is required")
    .refine(
      (val) => {
        // Check if it's a data URL
        if (!val.startsWith("data:image/")) return false;
        // Estimate size: base64 is ~4/3 the original size
        // 2MB limit = ~2.7MB base64
        const base64Length = val.split(",")[1]?.length || 0;
        const estimatedBytes = (base64Length * 3) / 4;
        return estimatedBytes <= 2 * 1024 * 1024; // 2MB
      },
      { message: "Image must be a valid data URL and less than 2MB" }
    ),
});

// ==========================================
// Friends & Invitations Schemas
// ==========================================

export const AddFriendSchema = z.object({
  code: z.string().min(1, "Invitation code is required").max(20, "Code too long"),
});

// ==========================================
// Activity Log Schema
// ==========================================

export const CreateActivityLogSchema = z.object({
  type: z.enum([
    "task_completed",
    "task_uncompleted",
    "task_started",
    "substep_completed",
    "substep_uncompleted",
    "cost_added",
    "note_added",
    "goal_created",
  ]),
  description: z.string().min(1, "Description is required").max(500, "Description too long"),
  goalId: z.string().min(1, "Goal ID is required"),
  taskId: z.string().optional(),
  substepId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// ==========================================
// Pagination Schema
// ==========================================

export const PaginationSchema = z.object({
  limit: z.coerce.number().int().min(1, "Limit must be at least 1").max(100, "Limit cannot exceed 100").default(50),
  offset: z.coerce.number().int().min(0, "Offset must be non-negative").default(0),
});

// ==========================================
// Migration Schema
// ==========================================

export const MigrateDataSchema = z.object({
  goals: z.array(z.any()).optional(), // Validated per-item during migration
  profile: z.object({
    name: z.string().optional(),
    bio: z.string().max(500).optional(),
    location: z.string().max(100).optional(),
    timezone: z.string().max(50).optional(),
    profileImage: z.string().optional(),
  }).optional(),
  streak: z.object({
    currentStreak: z.number().int().min(0).optional(),
    longestStreak: z.number().int().min(0).optional(),
    lastActivityDate: z.string().optional(),
    streakHistory: z.array(z.string()).optional(),
  }).optional(),
  activityLog: z.array(z.any()).optional(), // Validated per-item during migration
});

// ==========================================
// Helper: Validate and return parsed result or error response
// ==========================================

export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    // Format validation errors into readable message
    const errors = result.error.issues.map((err: z.ZodIssue) => `${err.path.join(".")}: ${err.message}`);
    return {
      success: false,
      error: errors.join("; "),
    };
  }
  
  return {
    success: true,
    data: result.data,
  };
}
