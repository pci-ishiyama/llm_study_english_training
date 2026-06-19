import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import HomePage from '@pages/HomePage';

const mockNavigate = vi.fn();
const mockReload = vi.fn<() => Promise<void>>(() => Promise.resolve());

const mockUseAuth = vi.fn();
const mockUseHomePage = vi.fn();

vi.mock('react-router-dom', async () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const actual = await vi.importActual('react-router-dom');
  const actualMod = actual as Record<string, unknown>;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  return Object.assign({}, actualMod, {
    useNavigate: (): typeof mockNavigate => mockNavigate,
  });
});

vi.mock('@hooks/useAuth', () => ({
  useAuth: (): ReturnType<typeof mockUseAuth> => mockUseAuth(),
}));

vi.mock('@hooks/useHomePage', () => ({
  useHomePage: (...args: Parameters<typeof mockUseHomePage>): ReturnType<typeof mockUseHomePage> => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return mockUseHomePage(...args);
  },
}));

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: {
        userId: 'user-123',
        email: 'user@example.com',
      },
    });
    mockUseHomePage.mockReturnValue({
      isLoading: false,
      error: null,
      data: {
        greetingName: 'Taro',
        englishLevel: 'Intermediate',
        learningGoal: '\u4f1a\u8b70\u3067\u81ea\u7136\u306b\u8a71\u305b\u308b\u3088\u3046\u306b\u306a\u308b',
        weeklyCount: 3,
        streakDays: 2,
        averageScore: 87,
        recentScores: [
          { date: '06-15', score: 82 },
          { date: '06-16', score: 85 },
          { date: '06-17', score: 94 },
        ],
        recommendedScenario: {
          scenarioId: 'scenario-3',
          title: '\u969c\u5bb3\u5831\u544a\u30df\u30fc\u30c6\u30a3\u30f3\u30b0',
          description: 'Explain an incident to the team',
          scene: 'Incident meeting',
          difficulty: 'Intermediate',
        },
      },
      reload: mockReload,
    });
  });

  it('shows a loading state first and then renders the home dashboard', async () => {
    mockUseHomePage.mockReturnValueOnce({
      isLoading: true,
      error: null,
      data: null,
      reload: mockReload,
    });

    const { rerender } = render(<HomePage />);

    expect(screen.getByText('\u8aad\u307f\u8fbc\u307f\u4e2d...')).toBeInTheDocument();

    rerender(<HomePage />);

    expect(await screen.findByText('\u4eca\u65e5\u306e\u63a8\u5968\u30b7\u30ca\u30ea\u30aa')).toBeInTheDocument();
  });

  it('renders all documented home sections after data loads', async () => {
    render(<HomePage />);

    expect(await screen.findByText('\u5b66\u7fd2\u30b9\u30c6\u30fc\u30bf\u30b9')).toBeInTheDocument();
    expect(screen.getByText('\u4eca\u65e5\u306e\u63a8\u5968\u30b7\u30ca\u30ea\u30aa')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '\u30c8\u30ec\u30fc\u30cb\u30f3\u30b0\u3092\u958b\u59cb' })).toBeInTheDocument();
    expect(screen.getByText('\u5b66\u7fd2\u306e\u9032\u6357')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '\u30b7\u30ca\u30ea\u30aa\u4e00\u89a7\u3092\u898b\u308b' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '\u5b66\u7fd2\u5c65\u6b74\u3092\u898b\u308b' })).toBeInTheDocument();
  });

  it('shows an error message and retry button when loading fails', async () => {
    mockUseHomePage.mockReturnValue({
      isLoading: false,
      error: '\u30db\u30fc\u30e0\u753b\u9762\u306e\u8aad\u307f\u8fbc\u307f\u306b\u5931\u6557\u3057\u307e\u3057\u305f',
      data: null,
      reload: mockReload,
    });

    const user = userEvent.setup();

    render(<HomePage />);

    expect(screen.getByText('\u30db\u30fc\u30e0\u753b\u9762\u306e\u8aad\u307f\u8fbc\u307f\u306b\u5931\u6557\u3057\u307e\u3057\u305f')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '\u518d\u8aad\u307f\u8fbc\u307f' }));
    expect(mockReload).toHaveBeenCalledTimes(1);
  });

  it('navigates to scenario selection from the quick link', async () => {
    const user = userEvent.setup();

    render(<HomePage />);

    await user.click(await screen.findByRole('button', { name: '\u30b7\u30ca\u30ea\u30aa\u4e00\u89a7\u3092\u898b\u308b' }));
    expect(mockNavigate).toHaveBeenCalledWith('/session/new');
  });

  it('navigates to history from the quick link', async () => {
    const user = userEvent.setup();

    render(<HomePage />);

    await user.click(await screen.findByRole('button', { name: '\u5b66\u7fd2\u5c65\u6b74\u3092\u898b\u308b' }));
    expect(mockNavigate).toHaveBeenCalledWith('/history');
  });

  it('shows a recommended scenario that matches the learner profile when history exists', async () => {
    render(<HomePage />);

    expect(await screen.findByText('\u4eca\u65e5\u306e\u63a8\u5968\u30b7\u30ca\u30ea\u30aa')).toBeInTheDocument();
    expect(screen.getByText('\u969c\u5bb3\u5831\u544a\u30df\u30fc\u30c6\u30a3\u30f3\u30b0')).toBeInTheDocument();
  });
});