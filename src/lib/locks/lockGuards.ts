export type LockLevel = 'none' | 'soft' | 'hard';

interface Lockable {
  lockLevel?: LockLevel;
}

export const getLockLevel = (item: Lockable): LockLevel => item.lockLevel ?? 'none';

export const canDelete = (item: Lockable): boolean => getLockLevel(item) === 'none';

export const canEdit = (item: Lockable): boolean => getLockLevel(item) !== 'hard';

export const canAddChild = (item: Lockable): boolean => getLockLevel(item) !== 'hard';

export const canReorder = (item: Lockable): boolean => getLockLevel(item) !== 'hard';

export const cycleLock = (current: LockLevel): LockLevel =>
  current === 'none' ? 'soft' : current === 'soft' ? 'hard' : 'none';
