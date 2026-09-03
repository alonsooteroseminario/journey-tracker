import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AccessProvider } from '@/components/AccessProvider';
import ProfilePage from './page';

vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    user: {
      fullName: 'Test User',
      primaryEmailAddress: { emailAddress: 'test@example.com' },
      imageUrl: null,
    },
    isLoaded: true,
  }),
}));

vi.mock('@/hooks/useProfileData', () => ({
  useProfileData: () => ({
    profile: { name: 'Test User', email: 'test@example.com', bio: '', location: '', timezone: '' },
    profileLoading: false,
    updateProfile: vi.fn(),
  }),
}));

// The page calls useGoals() unconditionally (hook order cannot vary), so it
// must be mocked even on the free path where its data goes unused.
vi.mock('@/hooks/useGoals', () => ({
  useGoals: () => ({
    profile: { name: 'Test User', email: 'test@example.com', bio: '', location: '', timezone: '' },
    streak: { currentStreak: 0, longestStreak: 0, streakHistory: [] },
    goals: [],
    isLoaded: true,
    updateProfile: vi.fn(),
    activityLog: [],
  }),
}));

vi.mock('@/store/slices/streaksSlice', () => ({
  useGetGoalStreaksQuery: () => ({ data: [] }),
}));

// Counts are deliberately distinct (2 / 3 / 5) so getByText cannot match
// two different stat tiles.
vi.mock('@/store/slices/promptsSlice', () => ({
  useListWalletsQuery: () => ({
    data: [
      {
        id: 'w1',
        groups: [
          { id: 'g1', chunks: [{ id: 'c1' }, { id: 'c2' }, { id: 'c3' }] },
          { id: 'g2', chunks: [{ id: 'c4' }] },
        ],
      },
      { id: 'w2', groups: [{ id: 'g3', chunks: [{ id: 'c5' }] }] },
    ],
  }),
}));

vi.mock('@/components/EmailPreferencesPanel', () => ({
  EmailPreferencesPanel: ({ accountOnly }: { accountOnly?: boolean }) => (
    <div>email-prefs:{String(accountOnly)}</div>
  ),
}));
vi.mock('@/components/FeedPreferencesPanel', () => ({
  FeedPreferencesPanel: () => <div>feed-prefs</div>,
}));
vi.mock('@/components/Calendar', () => ({ Calendar: () => null }));
vi.mock('@/components/ShareStreakButton', () => ({ ShareStreakButton: () => null }));

describe('ProfilePage — free user', () => {
  const renderFree = () =>
    render(<AccessProvider value={false}><ProfilePage /></AccessProvider>);

  it('shows wallet counts', () => {
    renderFree();
    expect(screen.getByText('Wallets')).toBeTruthy();
    expect(screen.getByText('Groups')).toBeTruthy();
    expect(screen.getByText('Chunks')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();   // wallets
    expect(screen.getByText('3')).toBeTruthy();   // groups
    expect(screen.getByText('5')).toBeTruthy();   // chunks
  });

  it('hides goal, streak and feed sections', () => {
    renderFree();
    expect(screen.queryByText('Activity Calendar')).toBeNull();
    expect(screen.queryByText('Share your streak card')).toBeNull();
    expect(screen.queryByText('Task Display')).toBeNull();
    expect(screen.queryByText('feed-prefs')).toBeNull();
  });

  it('hides the Share Your Progress gradient panel', () => {
    renderFree();
    expect(screen.queryByText('Share Your Progress 🚀')).toBeNull();
  });

  it('passes accountOnly=true to EmailPreferencesPanel', () => {
    renderFree();
    expect(screen.getByText('email-prefs:true')).toBeTruthy();
  });

  it('keeps identity fields', () => {
    renderFree();
    expect(screen.getByText('Test User')).toBeTruthy();
  });
});

describe('ProfilePage — full-access user', () => {
  // No AccessProvider wrapper: AccessContext defaults to true, so this
  // exercises the real full-access path (goalsProfile/goalsLoaded/goalsUpdate).
  const renderFullAccess = () => render(<ProfilePage />);

  it('shows goal sections and hides wallet counts', () => {
    renderFullAccess();
    expect(screen.getByText('Activity Calendar')).toBeTruthy();
    expect(screen.getByText('Task Display')).toBeTruthy();
    expect(screen.queryByText('Wallets')).toBeNull();
    expect(screen.queryByText('Groups')).toBeNull();
    expect(screen.queryByText('Chunks')).toBeNull();
  });

  it('shows the Share Your Progress gradient panel and feed prefs', () => {
    renderFullAccess();
    expect(screen.getByText('Share Your Progress 🚀')).toBeTruthy();
    expect(screen.getByText('feed-prefs')).toBeTruthy();
  });

  it('passes accountOnly=false to EmailPreferencesPanel', () => {
    renderFullAccess();
    expect(screen.getByText('email-prefs:false')).toBeTruthy();
  });
});
