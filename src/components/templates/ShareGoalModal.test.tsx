import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShareGoalModal } from './ShareGoalModal';

const mockCreateTemplate = vi.fn().mockReturnValue({ unwrap: vi.fn().mockResolvedValue({}) });

vi.mock('@/store/slices/templatesSlice', () => ({
  useCreateTemplateMutation: () => [mockCreateTemplate, { isLoading: false }],
}));

describe('ShareGoalModal', () => {
  const defaultProps = {
    goalId: 'goal-1',
    goalTitle: 'Learn Spanish',
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateTemplate.mockReturnValue({ unwrap: vi.fn().mockResolvedValue({}) });
  });

  it('renders the Share as Template heading', () => {
    render(<ShareGoalModal {...defaultProps} />);
    expect(screen.getByText('Share as Template')).toBeInTheDocument();
  });

  it('shows the goal title', () => {
    render(<ShareGoalModal {...defaultProps} />);
    expect(screen.getByText('Learn Spanish')).toBeInTheDocument();
  });

  it('calls onClose when Cancel button is clicked', () => {
    const onClose = vi.fn();
    render(<ShareGoalModal {...defaultProps} onClose={onClose} />);
    // There are two cancel buttons (× icon and Cancel text)
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when × close button is clicked', () => {
    const onClose = vi.fn();
    render(<ShareGoalModal {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByText('×'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('renders all form fields', () => {
    render(<ShareGoalModal {...defaultProps} />);
    expect(screen.getByPlaceholderText(/What did you learn/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Tips for others/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e.g., 3 months/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e.g., Career/)).toBeInTheDocument();
  });

  it('renders difficulty select with Intermediate as default', () => {
    render(<ShareGoalModal {...defaultProps} />);
    const select = screen.getByDisplayValue('Intermediate') as HTMLSelectElement;
    expect(select.value).toBe('intermediate');
  });

  it('can change difficulty to Beginner', () => {
    render(<ShareGoalModal {...defaultProps} />);
    const select = screen.getByDisplayValue('Intermediate') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'beginner' } });
    expect(screen.getByDisplayValue('Beginner')).toBeInTheDocument();
  });

  it('shows Friends only visibility selected by default', () => {
    render(<ShareGoalModal {...defaultProps} />);
    const friendsRadio = screen.getByDisplayValue('friends') as HTMLInputElement;
    expect(friendsRadio.checked).toBe(true);
  });

  it('shows Publish to Marketplace checkbox when public visibility is selected', () => {
    render(<ShareGoalModal {...defaultProps} />);
    const publicRadio = screen.getByDisplayValue('public');
    fireEvent.click(publicRadio);
    expect(screen.getByText('Publish to Marketplace')).toBeInTheDocument();
  });

  it('does not show Publish to Marketplace when friends visibility selected', () => {
    render(<ShareGoalModal {...defaultProps} />);
    expect(screen.queryByText('Publish to Marketplace')).not.toBeInTheDocument();
  });

  it('can add a tag by clicking Add button', () => {
    render(<ShareGoalModal {...defaultProps} />);
    const tagInput = screen.getByPlaceholderText('Add a tag');
    fireEvent.change(tagInput, { target: { value: 'immigration' } });
    fireEvent.click(screen.getByText('Add'));
    expect(screen.getByText('immigration')).toBeInTheDocument();
  });

  it('clears tag input after adding', () => {
    render(<ShareGoalModal {...defaultProps} />);
    const tagInput = screen.getByPlaceholderText('Add a tag') as HTMLInputElement;
    fireEvent.change(tagInput, { target: { value: 'career' } });
    fireEvent.click(screen.getByText('Add'));
    expect(tagInput.value).toBe('');
  });

  it('does not add duplicate tags', () => {
    render(<ShareGoalModal {...defaultProps} />);
    const tagInput = screen.getByPlaceholderText('Add a tag');
    fireEvent.change(tagInput, { target: { value: 'health' } });
    fireEvent.click(screen.getByText('Add'));
    fireEvent.change(tagInput, { target: { value: 'health' } });
    fireEvent.click(screen.getByText('Add'));
    // Only one 'health' text should appear (as tag pill)
    const healthTags = screen.getAllByText('health');
    expect(healthTags).toHaveLength(1);
  });

  it('can remove a tag', () => {
    render(<ShareGoalModal {...defaultProps} />);
    const tagInput = screen.getByPlaceholderText('Add a tag');
    fireEvent.change(tagInput, { target: { value: 'visa' } });
    fireEvent.click(screen.getByText('Add'));
    expect(screen.getByText('visa')).toBeInTheDocument();
    // The × button inside the tag pill
    const removeButtons = screen.getAllByText('×');
    fireEvent.click(removeButtons[removeButtons.length - 1]);
    expect(screen.queryByText('visa')).not.toBeInTheDocument();
  });

  it('submits the form and calls createTemplate', async () => {
    render(<ShareGoalModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Share Template'));
    expect(mockCreateTemplate).toHaveBeenCalledWith(
      expect.objectContaining({ goalId: 'goal-1' })
    );
  });

  it('shows "Share Template" button in non-loading state', () => {
    render(<ShareGoalModal {...defaultProps} />);
    expect(screen.getByText('Share Template')).toBeInTheDocument();
  });
});
