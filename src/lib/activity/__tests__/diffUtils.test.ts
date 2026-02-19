import { describe, it, expect } from 'vitest';
import { diffFields, formatDiffAction } from '../diffUtils';

describe('diffFields', () => {
  it('returns empty array when no fields changed', () => {
    const old = { title: 'Buy materials', priority: 'high' };
    const next = { title: 'Buy materials', priority: 'high' };
    expect(diffFields(old, next, ['title', 'priority'])).toEqual([]);
  });

  it('detects a single changed field', () => {
    const old = { title: 'Buy materials', priority: 'high' };
    const next = { title: 'Purchase building materials', priority: 'high' };
    const diffs = diffFields(old, next, ['title', 'priority']);
    expect(diffs).toHaveLength(1);
    expect(diffs[0]).toEqual({
      field: 'title',
      oldValue: 'Buy materials',
      newValue: 'Purchase building materials',
    });
  });

  it('detects multiple changed fields', () => {
    const old = { title: 'Task A', priority: 'low', notes: 'old note' };
    const next = { title: 'Task B', priority: 'high', notes: 'old note' };
    const diffs = diffFields(old, next, ['title', 'priority', 'notes']);
    expect(diffs).toHaveLength(2);
    expect(diffs.map((d) => d.field)).toEqual(['title', 'priority']);
  });

  it('handles undefined old value (new field added)', () => {
    const old: Record<string, unknown> = { title: 'Task' };
    const next = { title: 'Task', notes: 'new note' };
    const diffs = diffFields(old, next, ['title', 'notes']);
    expect(diffs).toHaveLength(1);
    expect(diffs[0]).toEqual({ field: 'notes', oldValue: undefined, newValue: 'new note' });
  });

  it('handles null → value change', () => {
    const old = { dueDate: null };
    const next = { dueDate: '2026-03-01' };
    const diffs = diffFields(
      old as Record<string, unknown>,
      next as Record<string, unknown>,
      ['dueDate']
    );
    expect(diffs).toHaveLength(1);
    expect(diffs[0].oldValue).toBeNull();
    expect(diffs[0].newValue).toBe('2026-03-01');
  });

  it('only compares fields in the provided list', () => {
    const old = { title: 'A', description: 'old desc', priority: 'low' };
    const next = { title: 'A', description: 'new desc', priority: 'high' };
    // Only watching 'title'
    const diffs = diffFields(old, next, ['title']);
    expect(diffs).toHaveLength(0);
  });

  it('handles object field changes via deep JSON comparison', () => {
    const old = { tags: ['a', 'b'] };
    const next = { tags: ['a', 'c'] };
    const diffs = diffFields(
      old as Record<string, unknown>,
      next as Record<string, unknown>,
      ['tags']
    );
    expect(diffs).toHaveLength(1);
  });
});

describe('formatDiffAction', () => {
  it('returns "Updated X" when no diffs', () => {
    expect(formatDiffAction('task', 'Buy materials', [])).toBe(
      'Updated task "Buy materials"'
    );
  });

  it('formats a single diff with old/new values', () => {
    const diffs = [{ field: 'title', oldValue: 'Buy materials', newValue: 'Purchase materials' }];
    expect(formatDiffAction('task', 'Purchase materials', diffs)).toBe(
      'Changed task "Purchase materials" title from "Buy materials" to "Purchase materials"'
    );
  });

  it('formats a single diff with null old value', () => {
    const diffs = [{ field: 'notes', oldValue: null, newValue: 'Added notes' }];
    expect(formatDiffAction('task', 'My Task', diffs)).toBe(
      'Changed task "My Task" notes from "(empty)" to "Added notes"'
    );
  });

  it('formats multiple diffs as a field list', () => {
    const diffs = [
      { field: 'title', oldValue: 'A', newValue: 'B' },
      { field: 'priority', oldValue: 'low', newValue: 'high' },
    ];
    expect(formatDiffAction('task', 'B', diffs)).toBe(
      'Updated 2 fields on task "B": title, priority'
    );
  });
});
