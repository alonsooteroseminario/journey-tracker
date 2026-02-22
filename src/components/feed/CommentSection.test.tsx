import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CommentSection } from './CommentSection';
import type { FeedComment } from '@/types';

const COMMENT: FeedComment = {
  id: 'c-1',
  feedItemId: 'feed-1',
  userId: 'user-2',
  userName: 'Alice',
  userImage: null,
  content: 'Great work!',
  createdAt: new Date('2026-01-10T12:00:00Z'),
};

describe('CommentSection', () => {
  it('returns null when not expanded', () => {
    const { container } = render(
      <CommentSection
        feedItemId="feed-1"
        comments={[]}
        onAddComment={vi.fn()}
        isExpanded={false}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders comment input when expanded', () => {
    render(
      <CommentSection
        feedItemId="feed-1"
        comments={[]}
        onAddComment={vi.fn()}
        isExpanded={true}
      />
    );
    expect(screen.getByPlaceholderText('Add a comment...')).toBeInTheDocument();
    expect(screen.getByText('Post')).toBeInTheDocument();
  });

  it('renders existing comments when expanded', () => {
    render(
      <CommentSection
        feedItemId="feed-1"
        comments={[COMMENT]}
        onAddComment={vi.fn()}
        isExpanded={true}
      />
    );
    expect(screen.getByText('Great work!')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('shows "?" avatar initial for comment with no userName', () => {
    const comment: FeedComment = { ...COMMENT, userName: '' };
    render(
      <CommentSection
        feedItemId="feed-1"
        comments={[comment]}
        onAddComment={vi.fn()}
        isExpanded={true}
      />
    );
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('Post button is disabled when comment is empty', () => {
    render(
      <CommentSection
        feedItemId="feed-1"
        comments={[]}
        onAddComment={vi.fn()}
        isExpanded={true}
      />
    );
    expect(screen.getByText('Post')).toBeDisabled();
  });

  it('Post button becomes enabled when text is entered', () => {
    render(
      <CommentSection
        feedItemId="feed-1"
        comments={[]}
        onAddComment={vi.fn()}
        isExpanded={true}
      />
    );
    const input = screen.getByPlaceholderText('Add a comment...');
    fireEvent.change(input, { target: { value: 'Hello!' } });
    expect(screen.getByText('Post')).not.toBeDisabled();
  });

  it('calls onAddComment with feedItemId and trimmed text on submit', async () => {
    const onAddComment = vi.fn().mockResolvedValue(undefined);
    render(
      <CommentSection
        feedItemId="feed-1"
        comments={[]}
        onAddComment={onAddComment}
        isExpanded={true}
      />
    );
    const input = screen.getByPlaceholderText('Add a comment...');
    fireEvent.change(input, { target: { value: '  Nice!  ' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Post' }).closest('form')!);
    await vi.waitFor(() =>
      expect(onAddComment).toHaveBeenCalledWith('feed-1', 'Nice!')
    );
  });

  it('clears input after successful submit', async () => {
    const onAddComment = vi.fn().mockResolvedValue(undefined);
    render(
      <CommentSection
        feedItemId="feed-1"
        comments={[]}
        onAddComment={onAddComment}
        isExpanded={true}
      />
    );
    const input = screen.getByPlaceholderText('Add a comment...') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Test' } });
    fireEvent.submit(input.closest('form')!);
    await vi.waitFor(() => expect(input.value).toBe(''));
  });

  it('does not call onAddComment when comment is only whitespace', () => {
    const onAddComment = vi.fn();
    render(
      <CommentSection
        feedItemId="feed-1"
        comments={[]}
        onAddComment={onAddComment}
        isExpanded={true}
      />
    );
    const input = screen.getByPlaceholderText('Add a comment...');
    fireEvent.change(input, { target: { value: '   ' } });
    const form = input.closest('form')!;
    fireEvent.submit(form);
    expect(onAddComment).not.toHaveBeenCalled();
  });
});
