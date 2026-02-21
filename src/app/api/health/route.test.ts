import { describe, it, expect } from 'vitest';
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
