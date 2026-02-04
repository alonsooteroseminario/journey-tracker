/**
 * MCP Server initialization
 */

import { getMCPServer } from './server';

let initialized = false;

/**
 * Initialize the MCP server (idempotent)
 */
export function initializeMCPServer(): void {
  if (initialized) {
    return;
  }

  // Initialize server (triggers tool/skill registration)
  getMCPServer();

  initialized = true;
}

/**
 * Get initialized server
 * Throws if server not initialized
 */
export function getInitializedServer() {
  if (!initialized) {
    throw new Error('MCP Server not initialized. Call initializeMCPServer() first.');
  }

  return getMCPServer();
}

/**
 * Check if server is initialized
 */
export function isServerInitialized(): boolean {
  return initialized;
}
