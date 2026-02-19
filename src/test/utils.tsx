import { render, RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { ReactElement, ReactNode } from 'react';
import { store } from '@/store';
import type { Goal, Task, Substep, UserProfile, Friend, Invitation, StreakData, ActivityLogEntry } from '@/types';

/**
 * Use the actual store for tests (isolated by mocking fetch/prisma)
 */
export function createTestStore() {
  return store;
}

/**
 * Render with Redux Provider
 */
export function renderWithProviders(
  ui: ReactElement,
  renderOptions?: Omit<RenderOptions, 'wrapper'>
) {
  const testStore = createTestStore();
  
  function Wrapper({ children }: { children: ReactNode }) {
    return <Provider store={testStore}>{children}</Provider>;
  }

  return { store: testStore, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

// ==========================================
// Test Data Factories
// ==========================================

let idCounter = 0;
function generateTestId() {
  return `test-id-${++idCounter}`;
}

export function createMockSubstep(overrides?: Partial<Substep>): Substep {
  return {
    id: generateTestId(),
    title: 'Test Substep',
    description: 'Test substep description',
    status: 'not_started' as const,
    order: 0,
    cost: 0,
    estimatedCost: 0,
    ...overrides,
  };
}

export function createMockTask(overrides?: Partial<Task>): Task {
  return {
    id: generateTestId(),
    title: 'Test Task',
    description: 'Test task description',
    status: 'not_started' as const,
    order: 0,
    priority: 'medium',
    substeps: [],
    tags: [],
    ...overrides,
  };
}

export function createMockGoal(overrides?: Partial<Goal>): Goal {
  return {
    id: generateTestId(),
    title: 'Test Goal',
    description: 'Test goal description',
    tasks: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    startDate: new Date().toISOString().split('T')[0],
    ...overrides,
  };
}

export function createMockUser(overrides?: Partial<UserProfile>): UserProfile {
  return {
    id: generateTestId(),
    name: 'Test User',
    email: 'test@example.com',
    joinedDate: new Date().toISOString().split('T')[0],
    ...overrides,
  };
}

export function createMockFriend(overrides?: Partial<Friend>): Friend {
  return {
    id: generateTestId(),
    profileId: 'test-profile-id',
    name: 'Test Friend',
    currentStreak: 5,
    longestStreak: 10,
    totalGoals: 3,
    completedGoals: 1,
    addedDate: new Date().toISOString().split('T')[0],
    ...overrides,
  };
}

export function createMockInvitation(overrides?: Partial<Invitation>): Invitation {
  return {
    id: generateTestId(),
    code: 'TEST1234',
    createdDate: new Date().toISOString(),
    expiresDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    used: false,
    ...overrides,
  };
}

export function createMockStreakData(overrides?: Partial<StreakData>): StreakData {
  return {
    currentStreak: 5,
    longestStreak: 10,
    lastActivityDate: new Date().toISOString().split('T')[0],
    streakHistory: [],
    ...overrides,
  };
}

export function createMockActivityLog(overrides?: Partial<ActivityLogEntry>): ActivityLogEntry {
  return {
    id: generateTestId(),
    date: new Date().toISOString(),
    type: 'task_completed',
    goalId: generateTestId(),
    description: 'Completed task',
    ...overrides,
  };
}

// ==========================================
// Mock API Responses
// ==========================================

export function mockSuccessResponse<T>(data: T, status = 200) {
  return Promise.resolve({
    ok: true,
    status,
    json: async () => data,
  } as Response);
}

export function mockErrorResponse(message: string, status = 500) {
  return Promise.resolve({
    ok: false,
    status,
    json: async () => ({ error: message }),
  } as Response);
}

// ==========================================
// Helper Functions
// ==========================================

/**
 * Wait for async state updates
 */
export function waitFor(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Reset test ID counter between tests
 */
export function resetTestIds() {
  idCounter = 0;
}
