import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PhaseProgress } from './PhaseProgress';

const makePhase = (id: string, name: string, taskIds: string[]) => ({
  id,
  name,
  description: `${name} description`,
  taskIds,
});

const makeTask = (id: string, status: 'not_started' | 'in_progress' | 'completed', substeps?: any[]) => ({
  id,
  title: `Task ${id}`,
  status,
  order: 0,
  substeps: substeps || [],
});

describe('PhaseProgress', () => {
  it('renders empty state when no phases', () => {
    const { container } = render(<PhaseProgress phases={[]} tasks={[]} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders phase names', () => {
    const phases = [
      makePhase('phase1', 'Language Testing', ['task-1']),
      makePhase('phase2', 'Application', ['task-2']),
    ];
    const tasks = [
      makeTask('task-1', 'completed'),
      makeTask('task-2', 'not_started'),
    ];
    render(<PhaseProgress phases={phases} tasks={tasks} />);

    expect(screen.getByText('Language Testing')).toBeInTheDocument();
    expect(screen.getByText('Application')).toBeInTheDocument();
  });

  it('shows 100% for a completed phase', () => {
    const phases = [makePhase('phase1', 'Done Phase', ['task-1'])];
    const tasks = [makeTask('task-1', 'completed')];
    render(<PhaseProgress phases={phases} tasks={tasks} />);

    const matches = screen.getAllByText('100%');
    expect(matches.length).toBeGreaterThan(0);
  });

  it('shows 0% for a not-started phase', () => {
    const phases = [makePhase('phase1', 'Future Phase', ['task-1'])];
    const tasks = [makeTask('task-1', 'not_started')];
    render(<PhaseProgress phases={phases} tasks={tasks} />);

    // 0% shown in the phase stat
    const texts = screen.getAllByText('0%');
    expect(texts.length).toBeGreaterThan(0);
  });

  it('calculates progress using substeps when present', () => {
    const phases = [makePhase('phase1', 'Substep Phase', ['task-1'])];
    const tasks = [
      makeTask('task-1', 'in_progress', [
        { id: 's1', title: 'Substep 1', status: 'completed' },
        { id: 's2', title: 'Substep 2', status: 'not_started' },
      ]),
    ];
    render(<PhaseProgress phases={phases} tasks={tasks} />);

    // 1/2 substeps = 50%
    const matches = screen.getAllByText('50%');
    expect(matches.length).toBeGreaterThan(0);
  });

  it('calls onPhaseClick when phase is clicked', () => {
    const onPhaseClick = vi.fn();
    const phases = [makePhase('phase1', 'Clickable Phase', [])];
    render(<PhaseProgress phases={phases} tasks={[]} onPhaseClick={onPhaseClick} />);

    fireEvent.click(screen.getByText('Clickable Phase'));
    expect(onPhaseClick).toHaveBeenCalledWith('phase1');
  });

  it('shows Add Phase button when onAddPhase provided', () => {
    const onAddPhase = vi.fn();
    render(<PhaseProgress phases={[]} tasks={[]} onAddPhase={onAddPhase} />);

    expect(screen.getByText('Add Phase')).toBeInTheDocument();
  });

  it('calls onAddPhase when Add Phase button clicked', () => {
    const onAddPhase = vi.fn();
    render(<PhaseProgress phases={[]} tasks={[]} onAddPhase={onAddPhase} />);

    fireEvent.click(screen.getByText('Add Phase'));
    expect(onAddPhase).toHaveBeenCalledOnce();
  });

  it('does not show Add Phase button when onAddPhase not provided', () => {
    render(<PhaseProgress phases={[]} tasks={[]} />);
    expect(screen.queryByText('Add Phase')).not.toBeInTheDocument();
  });

  it('shows stats as completed/total', () => {
    const phases = [makePhase('phase1', 'Stats Phase', ['t1', 't2'])];
    const tasks = [
      makeTask('t1', 'completed'),
      makeTask('t2', 'not_started'),
    ];
    render(<PhaseProgress phases={phases} tasks={tasks} />);

    expect(screen.getByText('1/2')).toBeInTheDocument();
  });
});
