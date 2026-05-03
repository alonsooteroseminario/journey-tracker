import { describe, it, expect } from 'vitest';
import {
  getLockLevel,
  canDelete,
  canEdit,
  canAddChild,
  canReorder,
  cycleLock,
} from './lockGuards';

describe('getLockLevel', () => {
  it('returns none when lockLevel is undefined', () => {
    expect(getLockLevel({})).toBe('none');
  });

  it('returns none when lockLevel is none', () => {
    expect(getLockLevel({ lockLevel: 'none' })).toBe('none');
  });

  it('returns soft when lockLevel is soft', () => {
    expect(getLockLevel({ lockLevel: 'soft' })).toBe('soft');
  });

  it('returns hard when lockLevel is hard', () => {
    expect(getLockLevel({ lockLevel: 'hard' })).toBe('hard');
  });
});

describe('canDelete', () => {
  it('is true when lockLevel is undefined', () => {
    expect(canDelete({})).toBe(true);
  });

  it('is true when lockLevel is none', () => {
    expect(canDelete({ lockLevel: 'none' })).toBe(true);
  });

  it('is false when lockLevel is soft', () => {
    expect(canDelete({ lockLevel: 'soft' })).toBe(false);
  });

  it('is false when lockLevel is hard', () => {
    expect(canDelete({ lockLevel: 'hard' })).toBe(false);
  });
});

describe('canEdit', () => {
  it('is true when lockLevel is undefined', () => {
    expect(canEdit({})).toBe(true);
  });

  it('is true when lockLevel is none', () => {
    expect(canEdit({ lockLevel: 'none' })).toBe(true);
  });

  it('is true when lockLevel is soft', () => {
    expect(canEdit({ lockLevel: 'soft' })).toBe(true);
  });

  it('is false when lockLevel is hard', () => {
    expect(canEdit({ lockLevel: 'hard' })).toBe(false);
  });
});

describe('canAddChild', () => {
  it('is true when lockLevel is undefined', () => {
    expect(canAddChild({})).toBe(true);
  });

  it('is true when lockLevel is none', () => {
    expect(canAddChild({ lockLevel: 'none' })).toBe(true);
  });

  it('is true when lockLevel is soft', () => {
    expect(canAddChild({ lockLevel: 'soft' })).toBe(true);
  });

  it('is false when lockLevel is hard', () => {
    expect(canAddChild({ lockLevel: 'hard' })).toBe(false);
  });
});

describe('canReorder', () => {
  it('is true when lockLevel is undefined', () => {
    expect(canReorder({})).toBe(true);
  });

  it('is true when lockLevel is none', () => {
    expect(canReorder({ lockLevel: 'none' })).toBe(true);
  });

  it('is true when lockLevel is soft', () => {
    expect(canReorder({ lockLevel: 'soft' })).toBe(true);
  });

  it('is false when lockLevel is hard', () => {
    expect(canReorder({ lockLevel: 'hard' })).toBe(false);
  });
});

describe('cycleLock', () => {
  it('cycles none → soft', () => {
    expect(cycleLock('none')).toBe('soft');
  });

  it('cycles soft → hard', () => {
    expect(cycleLock('soft')).toBe('hard');
  });

  it('cycles hard → none', () => {
    expect(cycleLock('hard')).toBe('none');
  });
});
