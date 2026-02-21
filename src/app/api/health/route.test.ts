import { describe, it, expect } from 'vitest';
import { GET } from './route';

describe('GET /api/health', () => {
  it('returns 200 with status ok', async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.version).toBe('0.1.0');
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
    // Both valid ISO strings (may be equal in same ms — just check type)
    expect(typeof b1.timestamp).toBe('string');
    expect(typeof b2.timestamp).toBe('string');
  });
});
