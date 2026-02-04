import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CreateGoalModal } from './CreateGoalModal';

// Mock the sampleData module
vi.mock('@/lib/sampleData', () => ({
  createBCPNPtoPRChecklist: vi.fn(() => ({
    id: 'bcpnp-goal',
    title: 'BC PNP to Permanent Residence',
    description: 'Complete checklist',
    tasks: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  })),
}));

describe('CreateGoalModal', () => {
  const mockOnClose = vi.fn();
  const mockOnCreateGoal = vi.fn();
  const mockOnAddGoalWithTasks = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(
        <CreateGoalModal
          isOpen={false}
          onClose={mockOnClose}
          onCreateGoal={mockOnCreateGoal}
          onAddGoalWithTasks={mockOnAddGoalWithTasks}
        />
      );

      expect(screen.queryByText('Create New Goal')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      render(
        <CreateGoalModal
          isOpen={true}
          onClose={mockOnClose}
          onCreateGoal={mockOnCreateGoal}
          onAddGoalWithTasks={mockOnAddGoalWithTasks}
        />
      );

      expect(screen.getByText('Create New Goal')).toBeInTheDocument();
    });

    it('should display the template option', () => {
      render(
        <CreateGoalModal
          isOpen={true}
          onClose={mockOnClose}
          onCreateGoal={mockOnCreateGoal}
          onAddGoalWithTasks={mockOnAddGoalWithTasks}
        />
      );

      expect(screen.getByText('BC PNP to Permanent Residence')).toBeInTheDocument();
      expect(screen.getByText(/Complete end-to-end checklist/)).toBeInTheDocument();
    });

    it('should display custom goal form fields', () => {
      render(
        <CreateGoalModal
          isOpen={true}
          onClose={mockOnClose}
          onCreateGoal={mockOnCreateGoal}
          onAddGoalWithTasks={mockOnAddGoalWithTasks}
        />
      );

      expect(screen.getByLabelText('Goal Title *')).toBeInTheDocument();
      expect(screen.getByLabelText('Description (optional)')).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('should update title input when typing', () => {
      render(
        <CreateGoalModal
          isOpen={true}
          onClose={mockOnClose}
          onCreateGoal={mockOnCreateGoal}
          onAddGoalWithTasks={mockOnAddGoalWithTasks}
        />
      );

      const titleInput = screen.getByLabelText('Goal Title *') as HTMLInputElement;
      fireEvent.change(titleInput, { target: { value: 'Learn React' } });

      expect(titleInput.value).toBe('Learn React');
    });

    it('should update description input when typing', () => {
      render(
        <CreateGoalModal
          isOpen={true}
          onClose={mockOnClose}
          onCreateGoal={mockOnCreateGoal}
          onAddGoalWithTasks={mockOnAddGoalWithTasks}
        />
      );

      const descInput = screen.getByLabelText('Description (optional)') as HTMLTextAreaElement;
      fireEvent.change(descInput, { target: { value: 'Master React hooks' } });

      expect(descInput.value).toBe('Master React hooks');
    });

    it('should disable submit button when title is empty', () => {
      render(
        <CreateGoalModal
          isOpen={true}
          onClose={mockOnClose}
          onCreateGoal={mockOnCreateGoal}
          onAddGoalWithTasks={mockOnAddGoalWithTasks}
        />
      );

      const submitButton = screen.getByText('Create Goal');
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when title is filled', () => {
      render(
        <CreateGoalModal
          isOpen={true}
          onClose={mockOnClose}
          onCreateGoal={mockOnCreateGoal}
          onAddGoalWithTasks={mockOnAddGoalWithTasks}
        />
      );

      const titleInput = screen.getByLabelText('Goal Title *');
      fireEvent.change(titleInput, { target: { value: 'Learn React' } });

      const submitButton = screen.getByText('Create Goal');
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Form Submission', () => {
    it('should call onCreateGoal with title when submitting', () => {
      render(
        <CreateGoalModal
          isOpen={true}
          onClose={mockOnClose}
          onCreateGoal={mockOnCreateGoal}
          onAddGoalWithTasks={mockOnAddGoalWithTasks}
        />
      );

      const titleInput = screen.getByLabelText('Goal Title *');
      fireEvent.change(titleInput, { target: { value: 'Learn React' } });

      const submitButton = screen.getByText('Create Goal');
      fireEvent.click(submitButton);

      expect(mockOnCreateGoal).toHaveBeenCalledWith('Learn React', undefined, undefined);
    });

    it('should call onCreateGoal with title and description when both filled', () => {
      render(
        <CreateGoalModal
          isOpen={true}
          onClose={mockOnClose}
          onCreateGoal={mockOnCreateGoal}
          onAddGoalWithTasks={mockOnAddGoalWithTasks}
        />
      );

      const titleInput = screen.getByLabelText('Goal Title *');
      const descInput = screen.getByLabelText('Description (optional)');

      fireEvent.change(titleInput, { target: { value: 'Learn React' } });
      fireEvent.change(descInput, { target: { value: 'Master hooks' } });

      const submitButton = screen.getByText('Create Goal');
      fireEvent.click(submitButton);

      expect(mockOnCreateGoal).toHaveBeenCalledWith('Learn React', 'Master hooks', undefined);
    });

    it('should close modal after submitting', () => {
      render(
        <CreateGoalModal
          isOpen={true}
          onClose={mockOnClose}
          onCreateGoal={mockOnCreateGoal}
          onAddGoalWithTasks={mockOnAddGoalWithTasks}
        />
      );

      const titleInput = screen.getByLabelText('Goal Title *');
      fireEvent.change(titleInput, { target: { value: 'Learn React' } });

      const submitButton = screen.getByText('Create Goal');
      fireEvent.click(submitButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should trim whitespace from title and description', () => {
      render(
        <CreateGoalModal
          isOpen={true}
          onClose={mockOnClose}
          onCreateGoal={mockOnCreateGoal}
          onAddGoalWithTasks={mockOnAddGoalWithTasks}
        />
      );

      const titleInput = screen.getByLabelText('Goal Title *');
      const descInput = screen.getByLabelText('Description (optional)');

      fireEvent.change(titleInput, { target: { value: '  Learn React  ' } });
      fireEvent.change(descInput, { target: { value: '  Master hooks  ' } });

      const submitButton = screen.getByText('Create Goal');
      fireEvent.click(submitButton);

      expect(mockOnCreateGoal).toHaveBeenCalledWith('Learn React', 'Master hooks', undefined);
    });

    it('should not submit when title is only whitespace', () => {
      render(
        <CreateGoalModal
          isOpen={true}
          onClose={mockOnClose}
          onCreateGoal={mockOnCreateGoal}
          onAddGoalWithTasks={mockOnAddGoalWithTasks}
        />
      );

      const titleInput = screen.getByLabelText('Goal Title *');
      fireEvent.change(titleInput, { target: { value: '   ' } });

      const form = screen.getByText('Create Goal').closest('form')!;
      fireEvent.submit(form);

      expect(mockOnCreateGoal).not.toHaveBeenCalled();
    });
  });

  describe('Template Loading', () => {
    it('should call onAddGoalWithTasks when loading template', () => {
      render(
        <CreateGoalModal
          isOpen={true}
          onClose={mockOnClose}
          onCreateGoal={mockOnCreateGoal}
          onAddGoalWithTasks={mockOnAddGoalWithTasks}
        />
      );

      const templateButton = screen.getByText('BC PNP to Permanent Residence').closest('button')!;
      fireEvent.click(templateButton);

      expect(mockOnAddGoalWithTasks).toHaveBeenCalled();
      const callArg = mockOnAddGoalWithTasks.mock.calls[0][0];
      expect(callArg).toHaveProperty('id');
      expect(callArg).toHaveProperty('title');
    });

    it('should close modal after loading template', () => {
      render(
        <CreateGoalModal
          isOpen={true}
          onClose={mockOnClose}
          onCreateGoal={mockOnCreateGoal}
          onAddGoalWithTasks={mockOnAddGoalWithTasks}
        />
      );

      const templateButton = screen.getByText('BC PNP to Permanent Residence').closest('button')!;
      fireEvent.click(templateButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Modal Controls', () => {
    it('should close modal when clicking X button', () => {
      render(
        <CreateGoalModal
          isOpen={true}
          onClose={mockOnClose}
          onCreateGoal={mockOnCreateGoal}
          onAddGoalWithTasks={mockOnAddGoalWithTasks}
        />
      );

      const closeButton = screen.getByRole('button', { name: 'Close modal' });
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should close modal when clicking Cancel button', () => {
      render(
        <CreateGoalModal
          isOpen={true}
          onClose={mockOnClose}
          onCreateGoal={mockOnCreateGoal}
          onAddGoalWithTasks={mockOnAddGoalWithTasks}
        />
      );

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
