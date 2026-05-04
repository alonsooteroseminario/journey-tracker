import { describe, it, expect } from 'vitest';
import { mergeChunks } from './mergeChunks';
import type { PromptChunk } from '@/types';

function chunk(id: string, content: string, order = 0): PromptChunk {
  return {
    id,
    groupId: 'g1',
    title: id,
    content,
    order,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };
}

describe('mergeChunks', () => {
  it('returns empty string for empty array', () => {
    expect(mergeChunks([])).toBe('');
  });

  it('returns chunk content for single chunk', () => {
    expect(mergeChunks([chunk('c1', 'hello')])).toBe('hello');
  });

  it('joins two chunks with double newline', () => {
    expect(mergeChunks([chunk('c1', 'hello'), chunk('c2', 'world')])).toBe('hello\n\nworld');
  });

  it('preserves the order of the input array', () => {
    const result = mergeChunks([chunk('c1', 'first'), chunk('c2', 'second'), chunk('c3', 'third')]);
    expect(result).toBe('first\n\nsecond\n\nthird');
  });

  it('ignores extra fields and only uses content', () => {
    const c = { ...chunk('c1', 'content only'), lockLevel: 'hard' as const };
    expect(mergeChunks([c])).toBe('content only');
  });

  it('handles chunks with multi-line content', () => {
    const result = mergeChunks([chunk('c1', 'line1\nline2'), chunk('c2', 'line3')]);
    expect(result).toBe('line1\nline2\n\nline3');
  });
});
