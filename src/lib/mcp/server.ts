/**
 * MCP Server - Manages tool and skill registration
 */

import { ToolDefinition, SkillDefinition, AsyncToolExecutor } from '@/types/agent';
import { tools, toolExecutors } from './tools';
import { skills } from './skills';

class MCPServer {
  private tools: Map<string, ToolDefinition> = new Map();
  private skills: Map<string, SkillDefinition> = new Map();
  private executors: Map<string, AsyncToolExecutor> = new Map();

  constructor() {
    this.registerTools();
    this.registerSkills();
  }

  /**
   * Register all tools
   */
  private registerTools(): void {
    tools.forEach((tool) => {
      this.tools.set(tool.name, tool);
      const executor = toolExecutors[tool.name]?.executor;
      if (executor) {
        this.executors.set(tool.name, executor);
      }
    });
  }

  /**
   * Register all skills
   */
  private registerSkills(): void {
    skills.forEach((skill) => {
      this.skills.set(skill.name, skill);
      this.executors.set(skill.name, skill.execute);
    });
  }

  /**
   * Get all tool definitions
   */
  getTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get all skill definitions as tool definitions
   */
  getSkills(): SkillDefinition[] {
    return Array.from(this.skills.values());
  }

  /**
   * Get all tools and skills combined
   */
  getAllTools(): ToolDefinition[] {
    const allTools = this.getTools();

    // Convert skills to tool definitions
    const skillsAsTools: ToolDefinition[] = this.getSkills().map((skill) => ({
      name: skill.name,
      description: skill.description,
      input_schema: {
        type: 'object',
        properties: {},
      },
    }));

    return [...allTools, ...skillsAsTools];
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
    return this.tools.has(name) || this.skills.has(name);
  }
}

// Singleton instance
let serverInstance: MCPServer | null = null;

/**
 * Get the MCP server instance (singleton)
 */
export function getMCPServer(): MCPServer {
  if (!serverInstance) {
    serverInstance = new MCPServer();
  }
  return serverInstance;
}

/**
 * Reset the MCP server instance (for testing)
 */
export function resetMCPServer(): void {
  serverInstance = null;
}
