import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';
import { NextRequest } from 'next/server';

vi.mock('@clerk/nextjs/server');
vi.mock('@/lib/mcp/server');
vi.mock('@/lib/agent/security');
vi.mock('@anthropic-ai/sdk');
vi.mock('@/lib/agent/getUserAgentKey', () => ({
  getUserAgentKey: vi.fn().mockResolvedValue('sk-ant-test-key'),
}));

describe('Agent Chat API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/agent/chat', () => {
    it('should return agent status when authenticated', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      const { getMCPServer } = await import('@/lib/mcp/server');

      vi.mocked(auth).mockResolvedValue({ userId: 'clerk-123' } as any);
      vi.mocked(getMCPServer).mockReturnValue({
        getAllTools: vi.fn().mockReturnValue([
          { name: 'tool-1', description: 'Tool 1' },
          { name: 'tool-2', description: 'Tool 2' },
        ]),
      } as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('online');
      expect(data.toolCount).toBe(2);
      expect(data.tools).toEqual(['tool-1', 'tool-2']);
    });

    it('should return 401 when not authenticated', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      vi.mocked(auth).mockResolvedValue({ userId: null } as any);

      const response = await GET();

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/agent/chat', () => {
    it('should return 401 when not authenticated', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      vi.mocked(auth).mockResolvedValue({ userId: null } as any);

      const request = new NextRequest('http://localhost/api/agent/chat', {
        method: 'POST',
        body: JSON.stringify({ messages: [] }),
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('should return 429 when rate limited', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      const { securityGuard } = await import('@/lib/agent/security');

      vi.mocked(auth).mockResolvedValue({ userId: 'clerk-123' } as any);
      vi.mocked(securityGuard.checkRateLimit).mockReturnValue(false);

      const request = new NextRequest('http://localhost/api/agent/chat', {
        method: 'POST',
        body: JSON.stringify({ messages: [{ role: 'user', content: 'test' }] }),
      });

      const response = await POST(request);

      expect(response.status).toBe(429);
    });

    it('should return 400 when messages array is empty', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      const { securityGuard } = await import('@/lib/agent/security');

      vi.mocked(auth).mockResolvedValue({ userId: 'clerk-123' } as any);
      vi.mocked(securityGuard.checkRateLimit).mockReturnValue(true);

      const request = new NextRequest('http://localhost/api/agent/chat', {
        method: 'POST',
        body: JSON.stringify({ messages: [] }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should handle successful chat request', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      const { securityGuard } = await import('@/lib/agent/security');
      const { getMCPServer } = await import('@/lib/mcp/server');
      const Anthropic = (await import('@anthropic-ai/sdk')).default;

      vi.mocked(auth).mockResolvedValue({ userId: 'clerk-123' } as any);
      vi.mocked(securityGuard.checkRateLimit).mockReturnValue(true);
      vi.mocked(getMCPServer).mockReturnValue({
        getAllTools: vi.fn().mockReturnValue([
          { name: 'test-tool', description: 'Test', input_schema: { type: 'object', properties: {} } },
        ]),
        getToolExecutor: vi.fn().mockReturnValue(async () => ({
          success: true,
          data: 'result',
        })),
      } as any);

      // Mock Anthropic as a constructor (vitest v4 requires function/class, not arrow)
      vi.mocked(Anthropic).mockImplementation(function () {
        return {
          messages: {
            create: vi.fn().mockResolvedValue({
              stop_reason: 'end_turn',
              content: [{ type: 'text', text: 'Hello! How can I help?' }],
            }),
          },
        };
      } as any);

      const request = new NextRequest('http://localhost/api/agent/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
          stream: false,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.role).toBe('assistant');
      expect(data.content).toBe('Hello! How can I help?');
    });

    it('should handle tool execution in chat', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      const { securityGuard } = await import('@/lib/agent/security');
      const { getMCPServer } = await import('@/lib/mcp/server');
      const Anthropic = (await import('@anthropic-ai/sdk')).default;

      vi.mocked(auth).mockResolvedValue({ userId: 'clerk-123' } as any);
      vi.mocked(securityGuard.checkRateLimit).mockReturnValue(true);

      const mockExecutor = vi.fn().mockResolvedValue({
        success: true,
        data: [{ id: 'goal-1', title: 'Test Goal' }],
      });

      vi.mocked(getMCPServer).mockReturnValue({
        getAllTools: vi.fn().mockReturnValue([
          { name: 'get-goals', description: 'Get goals', input_schema: { type: 'object', properties: {} } },
        ]),
        getToolExecutor: vi.fn().mockReturnValue(mockExecutor),
      } as any);

      // Mock Anthropic to return tool_use first, then end_turn
      const mockCreate = vi
        .fn()
        .mockResolvedValueOnce({
          stop_reason: 'tool_use',
          content: [
            {
              type: 'tool_use',
              id: 'tool-call-1',
              name: 'get-goals',
              input: {},
            },
          ],
        })
        .mockResolvedValueOnce({
          stop_reason: 'end_turn',
          content: [{ type: 'text', text: 'You have 1 goal.' }],
        });

      vi.mocked(Anthropic).mockImplementation(function () {
        return {
          messages: {
            create: mockCreate,
          },
        };
      } as any);

      const request = new NextRequest('http://localhost/api/agent/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Show my goals' }],
          stream: false,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockExecutor).toHaveBeenCalledWith({}, 'clerk-123');
      expect(data.content).toBe('You have 1 goal.');
    });
  });
});
