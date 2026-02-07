/**
 * Type definitions for the MCP agent system
 */

// ==========================================
// Message Types
// ==========================================

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  toolUsed?: string;
  toolResult?: ToolResult;
}

export interface ChatRequest {
  messages: Message[];
  userId?: string;
  stream?: boolean;
}

export interface ChatResponse {
  role: 'assistant';
  content: string;
  toolUsed?: string;
  toolResult?: ToolResult;
}

// ==========================================
// Tool Types
// ==========================================

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

export type ToolExecutor = (args: any, userId?: string) => Promise<ToolResult>;

export type AsyncToolExecutor = (
  args: any,
  userId?: string
) => Promise<ToolResult>;

export type ToolRegistry = Record<string, {
  definition: ToolDefinition;
  executor: AsyncToolExecutor;
}>;

// ==========================================
// Skill Types
// ==========================================

export interface SkillDefinition {
  name: string;
  description: string;
  execute: (args: any, userId?: string) => Promise<ToolResult>;
}

// ==========================================
// MCP Server Config
// ==========================================

export interface MCPServerConfig {
  port: number;
  host: string;
  tools: ToolDefinition[];
  skills?: SkillDefinition[];
}

// ==========================================
// Agent Config
// ==========================================

export interface AgentConfig {
  model: string;
  maxTokens: number;
  temperature: number;
  tools: ToolDefinition[];
}

// ==========================================
// Error Classes
// ==========================================

export class AgentError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AgentError';
  }
}

export class ToolExecutionError extends Error {
  constructor(
    message: string,
    public toolName: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ToolExecutionError';
  }
}

// ==========================================
// Goal Tool Input Types (journey-tracker specific)
// ==========================================

export interface CreateGoalInput {
  title: string;
  description?: string;
  tasks?: Array<{
    title: string;
    description?: string;
    order: number;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    dueDate?: string;
    substeps?: Array<{ title: string; order: number }>;
  }>;
  startDate?: string;
  targetDate?: string;
  isPublic?: boolean;
}

export interface UpdateGoalInput {
  goalId: string;
  title?: string;
  description?: string;
  tasks?: any[];
  startDate?: string;
  targetDate?: string;
}

export interface UpdateTaskInput {
  goalId: string;
  taskId: string;
  completed?: boolean;
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  notes?: string;
  dueDate?: string;
}

export interface AddSubstepInput {
  goalId: string;
  taskId: string;
  title: string;
  description?: string;
}

export interface CompleteSubstepInput {
  goalId: string;
  taskId: string;
  substepId: string;
  completed: boolean;
}

// ==========================================
// Conversation Context Types
// ==========================================

export interface ConversationContext {
  userId: string;
  lastGoalId?: string;
  lastTaskId?: string;
  recentGoals: string[];
  sessionStart: Date;
  messageCount: number;
}

// ==========================================
// Error Handler Types
// ==========================================

export enum ErrorType {
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  API_ERROR = 'API_ERROR',
  TOOL_EXECUTION = 'TOOL_EXECUTION',
  RATE_LIMIT = 'RATE_LIMIT',
  NETWORK = 'NETWORK',
  UNKNOWN = 'UNKNOWN',
}

export interface AgentErrorInfo {
  type: ErrorType;
  message: string;
  userMessage: string;
  recoverable: boolean;
  retryable: boolean;
  details?: any;
}

// ==========================================
// Audit Log Types
// ==========================================

export enum AuditAction {
  GOAL_CREATED = 'GOAL_CREATED',
  GOAL_UPDATED = 'GOAL_UPDATED',
  GOAL_DELETED = 'GOAL_DELETED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  TASK_UPDATED = 'TASK_UPDATED',
  SUBSTEP_COMPLETED = 'SUBSTEP_COMPLETED',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  PROFILE_UPDATED = 'PROFILE_UPDATED',
  FRIEND_REMOVED = 'FRIEND_REMOVED',
}

export interface AuditEntry {
  action: AuditAction;
  userId: string;
  resourceId?: string;
  timestamp: Date;
  details?: Record<string, any>;
}
