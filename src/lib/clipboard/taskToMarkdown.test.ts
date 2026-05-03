import { describe, it, expect } from 'vitest';
import { taskToMarkdown } from './taskToMarkdown';
import type { Task, Substep } from '@/types';

const makeSubstep = (overrides: Partial<Substep>): Substep => ({
  id: 'sub-1',
  title: 'Substep',
  status: 'not_started',
  order: 1,
  ...overrides,
});

const makeTask = (overrides: Partial<Task>): Task => ({
  id: 'task-1',
  title: 'Task Title',
  status: 'not_started',
  order: 1,
  ...overrides,
});

describe('taskToMarkdown', () => {
  it('renders just the heading for a task with title only', () => {
    const result = taskToMarkdown(makeTask({ title: 'Apply for visa' }));
    expect(result).toBe('## Apply for visa');
  });

  it('renders heading and description separated by blank line', () => {
    const result = taskToMarkdown(makeTask({
      title: 'Apply for visa',
      description: 'Submit all forms online',
    }));
    expect(result).toBe('## Apply for visa\n\nSubmit all forms online');
  });

  it('renders completed substep with [x]', () => {
    const result = taskToMarkdown(makeTask({
      title: 'Task',
      substeps: [makeSubstep({ title: 'Done step', status: 'completed', order: 1 })],
    }));
    expect(result).toContain('- [x] Done step');
  });

  it('renders not_started substep with [ ]', () => {
    const result = taskToMarkdown(makeTask({
      title: 'Task',
      substeps: [makeSubstep({ title: 'Pending step', status: 'not_started', order: 1 })],
    }));
    expect(result).toContain('- [ ] Pending step');
  });

  it('renders in_progress substep with [ ]', () => {
    const result = taskToMarkdown(makeTask({
      title: 'Task',
      substeps: [makeSubstep({ title: 'WIP step', status: 'in_progress', order: 1 })],
    }));
    expect(result).toContain('- [ ] WIP step');
  });

  it('renders substep notes as indented child line', () => {
    const result = taskToMarkdown(makeTask({
      title: 'Task',
      substeps: [makeSubstep({ title: 'Step', notes: 'Remember to sign', order: 1 })],
    }));
    expect(result).toContain('- [ ] Step\n  ↳ Remember to sign');
  });

  it('does not render a notes line when notes is absent', () => {
    const result = taskToMarkdown(makeTask({
      title: 'Task',
      substeps: [makeSubstep({ title: 'Step', notes: undefined, order: 1 })],
    }));
    expect(result).not.toContain('↳');
  });

  it('renders only heading when substeps array is empty', () => {
    const result = taskToMarkdown(makeTask({ title: 'Task', substeps: [] }));
    expect(result).toBe('## Task');
  });

  it('renders only heading when substeps is undefined', () => {
    const result = taskToMarkdown(makeTask({ title: 'Task', substeps: undefined }));
    expect(result).toBe('## Task');
  });

  it('sorts substeps by order field', () => {
    const result = taskToMarkdown(makeTask({
      title: 'Task',
      substeps: [
        makeSubstep({ id: 'b', title: 'Second', order: 2 }),
        makeSubstep({ id: 'a', title: 'First', order: 1 }),
      ],
    }));
    const firstIdx = result.indexOf('First');
    const secondIdx = result.indexOf('Second');
    expect(firstIdx).toBeLessThan(secondIdx);
  });

  it('renders full task with description and mixed substeps', () => {
    const result = taskToMarkdown(makeTask({
      title: 'Apply for visa',
      description: 'Submit all forms',
      substeps: [
        makeSubstep({ id: '1', title: 'Fill form', status: 'completed', order: 1 }),
        makeSubstep({ id: '2', title: 'Pay fee', status: 'not_started', order: 2, notes: '$185' }),
        makeSubstep({ id: '3', title: 'Schedule', status: 'in_progress', order: 3 }),
      ],
    }));
    expect(result).toBe(
      '## Apply for visa\n\nSubmit all forms\n\n- [x] Fill form\n- [ ] Pay fee\n  ↳ $185\n- [ ] Schedule'
    );
  });
});
