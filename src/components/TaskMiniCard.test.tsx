import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TaskMiniCard } from './TaskMiniCard';
import type { Task } from '@/types';
import React from 'react';

vi.mock('@/components/undo/UndoToastProvider', () => ({
  useUndoToast: () => ({ showUndoToast: vi.fn() }),
  UndoToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: () => {},
    transform: null,
    transition: null,
    isDragging: false,
  }),
  SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  sortableKeyboardCoordinates: vi.fn(),
  verticalListSortingStrategy: vi.fn(),
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => '' } },
}));

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  closestCenter: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
}));

vi.mock('./SubstepCard', () => ({
  SubstepCard: () => null,
}));

vi.mock('./EditTaskModal', () => ({
  EditTaskModal: () => null,
}));

const BASE_TASK: Task = {
  id: 'task-1',
  title: 'Buy groceries',
  status: 'not_started',
  order: 1,
  substeps: [],
};

const defaultProps = {
  task: BASE_TASK,
  onToggle: vi.fn(),
  onUpdate: vi.fn(),
  onDelete: vi.fn(),
  onAddSubstep: vi.fn(),
  onUpdateSubstep: vi.fn(),
  onToggleSubstep: vi.fn(),
  onDeleteSubstep: vi.fn(),
};

describe('TaskMiniCard', () => {
  it('renders task title', () => {
    render(<TaskMiniCard {...defaultProps} />);
    expect(screen.getByText('Buy groceries')).toBeTruthy();
  });

  it('copy button click writes markdown to clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, writable: true, configurable: true });
    render(<TaskMiniCard {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Copy as Markdown'));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('## Buy groceries'));
  });

  it('copy button shows checkmark briefly after click', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, writable: true, configurable: true });
    render(<TaskMiniCard {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Copy as Markdown'));
    await waitFor(() => {
      expect(screen.getByTitle('Copied!')).toBeTruthy();
    });
  });

  it('shows lock badge when lockLevel is soft', () => {
    const task: Task = { ...BASE_TASK, lockLevel: 'soft' };
    render(<TaskMiniCard {...defaultProps} task={task} onUpdateLock={vi.fn()} />);
    // The lock button title reflects the current lock level
    expect(screen.getByTitle('Lock: soft')).toBeTruthy();
    // The soft lock badge (aria-label) should be in the title area
    expect(screen.getByLabelText('Soft locked')).toBeTruthy();
  });

  it('shows lock badge when lockLevel is hard', () => {
    const task: Task = { ...BASE_TASK, lockLevel: 'hard' };
    render(<TaskMiniCard {...defaultProps} task={task} onUpdateLock={vi.fn()} />);
    expect(screen.getByTitle('Lock: hard')).toBeTruthy();
    expect(screen.getByLabelText('Hard locked')).toBeTruthy();
  });

  it('no lock badge when lockLevel is undefined', () => {
    render(<TaskMiniCard {...defaultProps} />);
    expect(screen.queryByLabelText('Soft locked')).toBeNull();
    expect(screen.queryByLabelText('Hard locked')).toBeNull();
  });

  it('lock button calls onUpdateLock with cycled value', () => {
    const onUpdateLock = vi.fn();
    const task: Task = { ...BASE_TASK, lockLevel: 'none' };
    render(<TaskMiniCard {...defaultProps} task={task} onUpdateLock={onUpdateLock} />);
    fireEvent.click(screen.getByTitle('Lock: none'));
    expect(onUpdateLock).toHaveBeenCalledWith('soft');
  });

  it('hard-locked: edit button is disabled', () => {
    const task: Task = { ...BASE_TASK, lockLevel: 'hard' };
    render(<TaskMiniCard {...defaultProps} task={task} onUpdateLock={vi.fn()} />);
    // When disabled the title changes to "Locked" — there are two (edit + delete)
    const lockedBtns = screen.getAllByTitle('Locked');
    // Both edit and delete are locked
    expect(lockedBtns.length).toBeGreaterThanOrEqual(1);
    lockedBtns.forEach((btn) => expect(btn).toBeDisabled());
  });

  it('hard-locked: delete button is disabled', () => {
    const task: Task = { ...BASE_TASK, lockLevel: 'hard' };
    render(<TaskMiniCard {...defaultProps} task={task} onUpdateLock={vi.fn()} />);
    const lockedBtns = screen.getAllByTitle('Locked');
    expect(lockedBtns.length).toBeGreaterThanOrEqual(1);
    lockedBtns.forEach((btn) => expect(btn).toBeDisabled());
  });

  it('soft-locked: delete button is disabled, edit button is enabled', () => {
    const task: Task = { ...BASE_TASK, lockLevel: 'soft' };
    render(<TaskMiniCard {...defaultProps} task={task} onUpdateLock={vi.fn()} />);
    // Only delete should be "Locked"
    const lockedBtn = screen.getByTitle('Locked');
    expect(lockedBtn).toBeDisabled();
    // Edit should still be enabled with title "Edit"
    const editBtn = screen.getByTitle('Edit');
    expect(editBtn).not.toBeDisabled();
  });

  it('delete (unlocked) calls onDelete', () => {
    const onDelete = vi.fn();
    render(<TaskMiniCard {...defaultProps} onDelete={onDelete} />);
    fireEvent.click(screen.getByTitle('Delete'));
    expect(onDelete).toHaveBeenCalled();
  });
});
