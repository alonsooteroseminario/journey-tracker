import { describe, it, expect } from 'vitest';
import { mergeChunks } from './mergeChunks';
import type { PromptChunk } from '@/types';

function chunk(id: string, content: string, order = 0, title?: string): PromptChunk {
  return {
    id,
    groupId: 'g1',
    title: title ?? id,
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

  it('formats single chunk as "title\\ncontent" with no # prefix', () => {
    expect(mergeChunks([chunk('c1', 'hello', 0, 'My Chunk')])).toBe('My Chunk\nhello');
  });

  it('joins two chunks with double newline separator', () => {
    const result = mergeChunks([
      chunk('c1', 'first content', 0, 'Chunk A'),
      chunk('c2', 'second content', 1, 'Chunk B'),
    ]);
    expect(result).toBe('Chunk A\nfirst content\n\nChunk B\nsecond content');
  });

  it('preserves the order of the input array', () => {
    const result = mergeChunks([
      chunk('c1', 'one', 0, 'First'),
      chunk('c2', 'two', 1, 'Second'),
      chunk('c3', 'three', 2, 'Third'),
    ]);
    expect(result).toBe('First\none\n\nSecond\ntwo\n\nThird\nthree');
  });

  it('renders title-only chunk when content is empty', () => {
    expect(mergeChunks([chunk('c1', '', 0, 'Empty')])).toBe('Empty');
  });

  it('handles chunks with multi-line content', () => {
    const result = mergeChunks([
      chunk('c1', 'line1\nline2', 0, 'Block'),
      chunk('c2', 'line3', 1, 'Next'),
    ]);
    expect(result).toBe('Block\nline1\nline2\n\nNext\nline3');
  });

  it('ignores extra fields and only uses title + content', () => {
    const c = { ...chunk('c1', 'body', 0, 'Title'), lockLevel: 'hard' as const };
    expect(mergeChunks([c])).toBe('Title\nbody');
  });
});
