import type { LockLevel } from '@/lib/locks/lockGuards';

const DESCRIPTION_MAX = 2000;
const ICON_MAX = 64;

export function validateWalletTitle(value: unknown): string | null {
  if (value === undefined || value === null) {
    return 'Title is required';
  }
  if (typeof value !== 'string') {
    return 'Title must be a string';
  }
  const t = value.trim();
  if (t.length === 0) {
    return 'Title is required';
  }
  return null;
}

export function validateOptionalDescription(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value !== 'string') {
    return 'Description must be a string';
  }
  if (value.length > DESCRIPTION_MAX) {
    return `Description must be at most ${DESCRIPTION_MAX} characters`;
  }
  return null;
}

export function validateOptionalIcon(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value !== 'string') {
    return 'Icon must be a string';
  }
  if (value.length > ICON_MAX) {
    return `Icon must be at most ${ICON_MAX} characters`;
  }
  return null;
}

/** Accepts client lock values; maps `none` / missing to DB `null`. */
export function lockLevelToDb(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  if (value === 'none') {
    return null;
  }
  if (value === 'soft' || value === 'hard') {
    return value;
  }
  throw new Error('INVALID_LOCK');
}

export function serializePromptChunk(c: {
  id: string;
  groupId: string;
  title: string;
  content: string;
  order: number;
  lockLevel: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: c.id,
    groupId: c.groupId,
    title: c.title,
    content: c.content,
    order: c.order,
    ...(c.lockLevel != null && c.lockLevel !== ''
      ? { lockLevel: c.lockLevel as LockLevel }
      : {}),
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

export function serializePromptGroup(g: {
  id: string;
  walletId: string;
  title: string;
  description: string | null;
  order: number;
  lockLevel: string | null;
  createdAt: Date;
  updatedAt: Date;
  chunks: Array<Parameters<typeof serializePromptChunk>[0]>;
}) {
  return {
    id: g.id,
    walletId: g.walletId,
    title: g.title,
    ...(g.description != null && g.description !== '' ? { description: g.description } : {}),
    order: g.order,
    ...(g.lockLevel != null && g.lockLevel !== ''
      ? { lockLevel: g.lockLevel as LockLevel }
      : {}),
    chunks: g.chunks.map(serializePromptChunk),
    createdAt: g.createdAt.toISOString(),
    updatedAt: g.updatedAt.toISOString(),
  };
}

export function serializePromptWallet(w: {
  id: string;
  userId: string;
  title: string;
  icon: string | null;
  description: string | null;
  order: number;
  lockLevel: string | null;
  shareToken?: string | null;
  sharedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  groups: Array<Parameters<typeof serializePromptGroup>[0]>;
}) {
  return {
    id: w.id,
    userId: w.userId,
    title: w.title,
    ...(w.icon != null && w.icon !== '' ? { icon: w.icon } : {}),
    ...(w.description != null && w.description !== '' ? { description: w.description } : {}),
    order: w.order,
    ...(w.lockLevel != null && w.lockLevel !== ''
      ? { lockLevel: w.lockLevel as LockLevel }
      : {}),
    // Share state is owner-only surface: these are never returned by the public
    // shared-wallet route, which strips them explicitly.
    shareToken: w.shareToken ?? null,
    sharedAt: w.sharedAt ? w.sharedAt.toISOString() : null,
    groups: w.groups.map(serializePromptGroup),
    createdAt: w.createdAt.toISOString(),
    updatedAt: w.updatedAt.toISOString(),
  };
}
