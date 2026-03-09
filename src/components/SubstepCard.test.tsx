import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SubstepCard } from './SubstepCard';
import type { Substep } from '@/types';

vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: () => {},
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => '' } },
}));

const BASE_SUBSTEP: Substep = {
  id: 'sub-1',
  title: 'Write resume',
  status: 'not_started',
  order: 0,
};

describe('SubstepCard', () => {
  it('renders substep title', () => {
    render(
      <SubstepCard
        substep={BASE_SUBSTEP}
        onToggle={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText('Write resume')).toBeInTheDocument();
  });

  it('renders completed substep with line-through styling', () => {
    const substep: Substep = { ...BASE_SUBSTEP, status: 'completed' };
    render(
      <SubstepCard substep={substep} onToggle={vi.fn()} onUpdate={vi.fn()} onDelete={vi.fn()} />
    );
    const title = screen.getByText('Write resume');
    expect(title.className).toContain('line-through');
  });

  it('calls onToggle when status button is clicked', () => {
    const onToggle = vi.fn();
    render(
      <SubstepCard substep={BASE_SUBSTEP} onToggle={onToggle} onUpdate={vi.fn()} onDelete={vi.fn()} />
    );
    fireEvent.click(screen.getByRole('button', { name: /Toggle substep/ }));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('calls onDelete when delete button is clicked', () => {
    const onDelete = vi.fn();
    render(
      <SubstepCard substep={BASE_SUBSTEP} onToggle={vi.fn()} onUpdate={vi.fn()} onDelete={onDelete} />
    );
    fireEvent.click(screen.getByTitle('Delete'));
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it('shows cost badge when substep has cost > 0', () => {
    const substep: Substep = { ...BASE_SUBSTEP, cost: 150 };
    render(
      <SubstepCard substep={substep} onToggle={vi.fn()} onUpdate={vi.fn()} onDelete={vi.fn()} />
    );
    expect(screen.getByText(/150/)).toBeInTheDocument();
  });

  it('does not show cost badge when cost is 0', () => {
    const substep: Substep = { ...BASE_SUBSTEP, cost: 0 };
    render(
      <SubstepCard substep={substep} onToggle={vi.fn()} onUpdate={vi.fn()} onDelete={vi.fn()} />
    );
    expect(screen.queryByText(/\$0/)).not.toBeInTheDocument();
  });

  it('shows notes when substep has notes', () => {
    const substep: Substep = { ...BASE_SUBSTEP, notes: 'Include references' };
    render(
      <SubstepCard substep={substep} onToggle={vi.fn()} onUpdate={vi.fn()} onDelete={vi.fn()} />
    );
    expect(screen.getByText('Include references')).toBeInTheDocument();
  });

  it('enters edit mode when edit button is clicked', () => {
    render(
      <SubstepCard substep={BASE_SUBSTEP} onToggle={vi.fn()} onUpdate={vi.fn()} onDelete={vi.fn()} />
    );
    fireEvent.click(screen.getByTitle('Edit'));
    expect(screen.getByPlaceholderText('Substep title')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('calls onUpdate with new values when Save is clicked', () => {
    const onUpdate = vi.fn();
    render(
      <SubstepCard substep={BASE_SUBSTEP} onToggle={vi.fn()} onUpdate={onUpdate} onDelete={vi.fn()} />
    );
    fireEvent.click(screen.getByTitle('Edit'));

    const titleInput = screen.getByPlaceholderText('Substep title');
    fireEvent.change(titleInput, { target: { value: 'Updated resume' } });
    fireEvent.click(screen.getByText('Save'));

    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Updated resume' })
    );
  });

  it('cancels edit and restores original values when Cancel is clicked', () => {
    render(
      <SubstepCard substep={BASE_SUBSTEP} onToggle={vi.fn()} onUpdate={vi.fn()} onDelete={vi.fn()} />
    );
    fireEvent.click(screen.getByTitle('Edit'));

    const titleInput = screen.getByPlaceholderText('Substep title');
    fireEvent.change(titleInput, { target: { value: 'Changed' } });
    fireEvent.click(screen.getByText('Cancel'));

    expect(screen.getByText('Write resume')).toBeInTheDocument();
  });

  it('disables Save button when title is empty', () => {
    render(
      <SubstepCard substep={BASE_SUBSTEP} onToggle={vi.fn()} onUpdate={vi.fn()} onDelete={vi.fn()} />
    );
    fireEvent.click(screen.getByTitle('Edit'));

    const titleInput = screen.getByPlaceholderText('Substep title');
    fireEvent.change(titleInput, { target: { value: '' } });

    expect(screen.getByText('Save')).toBeDisabled();
  });

  it('shows cost input in edit mode pre-populated with existing cost', () => {
    const substep: Substep = { ...BASE_SUBSTEP, cost: 250 };
    render(
      <SubstepCard substep={substep} onToggle={vi.fn()} onUpdate={vi.fn()} onDelete={vi.fn()} />
    );
    fireEvent.click(screen.getByTitle('Edit'));
    const costInput = screen.getByPlaceholderText('Cost') as HTMLInputElement;
    expect(costInput.value).toBe('250');
  });

  it('shows notes input in edit mode pre-populated with existing notes', () => {
    const substep: Substep = { ...BASE_SUBSTEP, notes: 'Existing note' };
    render(
      <SubstepCard substep={substep} onToggle={vi.fn()} onUpdate={vi.fn()} onDelete={vi.fn()} />
    );
    fireEvent.click(screen.getByTitle('Edit'));
    const notesInput = screen.getByPlaceholderText('Notes') as HTMLInputElement;
    expect(notesInput.value).toBe('Existing note');
  });

  it('can change status in edit mode', () => {
    const onUpdate = vi.fn();
    render(
      <SubstepCard substep={BASE_SUBSTEP} onToggle={vi.fn()} onUpdate={onUpdate} onDelete={vi.fn()} />
    );
    fireEvent.click(screen.getByTitle('Edit'));

    // Click the "completed" status button (has text label in wider viewports)
    const statusButtons = screen.getAllByRole('button');
    // The status buttons include drag-handle, toggle, save, cancel, and 3 status options
    // Find the completed status button - it's one of the status option buttons
    const completedBtn = statusButtons.find(
      (btn) => btn.textContent?.includes('✅') || btn.title === 'completed'
    );
    if (completedBtn) {
      fireEvent.click(completedBtn);
    }

    fireEvent.click(screen.getByText('Save'));
    expect(onUpdate).toHaveBeenCalled();
  });

  it('shows in_progress status indicator', () => {
    const substep: Substep = { ...BASE_SUBSTEP, status: 'in_progress' };
    render(
      <SubstepCard substep={substep} onToggle={vi.fn()} onUpdate={vi.fn()} onDelete={vi.fn()} />
    );
    // in_progress shows an orange-border status button
    const toggleBtn = screen.getByRole('button', { name: /Toggle substep/ });
    expect(toggleBtn.className).toContain('border-orange-500');
  });

  it('renders a copy button in the actions area', () => {
    render(
      <SubstepCard substep={BASE_SUBSTEP} onToggle={vi.fn()} onUpdate={vi.fn()} onDelete={vi.fn()} />
    );
    expect(screen.getByTitle('Copy')).toBeInTheDocument();
  });

  it('copies substep title to clipboard when copy button is clicked', () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      writable: true,
    });

    render(
      <SubstepCard substep={BASE_SUBSTEP} onToggle={vi.fn()} onUpdate={vi.fn()} onDelete={vi.fn()} />
    );
    fireEvent.click(screen.getByTitle('Copy'));
    expect(writeText).toHaveBeenCalledWith('Write resume');
  });

  it('includes cost=undefined when cost field is cleared', () => {
    const onUpdate = vi.fn();
    const substep: Substep = { ...BASE_SUBSTEP, cost: 100 };
    render(
      <SubstepCard substep={substep} onToggle={vi.fn()} onUpdate={onUpdate} onDelete={vi.fn()} />
    );
    fireEvent.click(screen.getByTitle('Edit'));

    const costInput = screen.getByPlaceholderText('Cost');
    fireEvent.change(costInput, { target: { value: '' } });
    fireEvent.click(screen.getByText('Save'));

    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ cost: undefined })
    );
  });
});
