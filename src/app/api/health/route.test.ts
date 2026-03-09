import { describe, it, expect, vi } from 'vitest';
import { version } from '../../../../package.json';
import { GET } from './route';

describe('GET /api/health', () => {
  it('returns 200 with status ok', async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.version).toBe(version);
    expect(typeof body.timestamp).toBe('string');
    // Timestamp should be a valid ISO string
    expect(() => new Date(body.timestamp)).not.toThrow();
  });

  it('returns 500 when an error occurs', async () => {
    const origDate = global.Date;
    // Force the Date constructor to throw after one call
    let calls = 0;
    vi.spyOn(global, 'Date').mockImplementation((...args) => {
      calls++;
      if (calls > 1) throw new Error('forced error');
      // @ts-expect-error spread args
      return new origDate(...args);
    });

    const response = await GET();
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe('Internal server error');
    vi.restoreAllMocks();
  });

  it('returns a fresh timestamp on each call', async () => {
    const r1 = await GET();
    await new Promise((resolve) => setTimeout(resolve, 5));
    const r2 = await GET();

    const b1 = await r1.json();
    const b2 = await r2.json();
    // b2 timestamp must be >= b1 timestamp
    expect(new Date(b2.timestamp).getTime()).toBeGreaterThanOrEqual(
      new Date(b1.timestamp).getTime()
    );
  });
});
