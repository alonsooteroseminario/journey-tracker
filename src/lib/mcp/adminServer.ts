/**
 * Admin MCP Server - Singleton server for admin-only tools
 * Separate from user MCP server to prevent accidental exposure of admin tools
 */

import { ToolDefinition, AsyncToolExecutor } from "@/types/agent";

// Import admin-only tools
import {
  toolDefinition as createCampaignDefinition,
  executeCreateCampaign,
} from "./tools/createCampaign";
import {
  toolDefinition as getCampaignsDefinition,
  executeGetCampaigns,
} from "./tools/getCampaigns";
import {
  toolDefinition as generatePostContentDefinition,
  executeGeneratePostContent,
} from "./tools/generatePostContent";

// Admin-only tool definitions
const adminTools: ToolDefinition[] = [
  createCampaignDefinition,
  getCampaignsDefinition,
  generatePostContentDefinition,
];

// Admin-only tool executors (userId is required for admin tools)
const adminToolExecutors = new Map([
  ["create-campaign", executeCreateCampaign as AsyncToolExecutor],
  ["get-campaigns", executeGetCampaigns as AsyncToolExecutor],
  ["generate-post-content", executeGeneratePostContent as AsyncToolExecutor],
]);

/**
 * Admin MCP Server class
 */
class AdminMCPServer {
  private tools: Map<string, ToolDefinition> = new Map();
  private executors: Map<string, AsyncToolExecutor> = new Map();

  constructor() {
    // Register tools
    adminTools.forEach((tool) => {
      this.tools.set(tool.name, tool);
    });

    // Register executors
    adminToolExecutors.forEach((executor, name) => {
      this.executors.set(name, executor);
    });
  }

  /**
   * Get all tool definitions
   */
  getAllTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tool executor by name
   */
  getToolExecutor(name: string): AsyncToolExecutor | undefined {
    return this.executors.get(name);
  }

  /**
   * Check if tool exists
   */
  hasTool(name: string): boolean {
    return this.tools.has(name);
  }
}

let adminServerInstance: AdminMCPServer | null = null;

/**
 * Get or create the singleton admin MCP server instance
 */
export function getAdminMCPServer(): AdminMCPServer {
  if (!adminServerInstance) {
    adminServerInstance = new AdminMCPServer();
  }
  return adminServerInstance;
}

/**
 * Get all admin tool definitions
 */
export function getAdminTools(): ToolDefinition[] {
  return adminTools;
}

/**
 * Check if a tool is an admin-only tool
 */
export function isAdminTool(toolName: string): boolean {
  return adminToolExecutors.has(toolName);
}
