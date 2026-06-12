import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import LoadingSpinner from '@components/common/LoadingSpinner';
import ErrorMessage from '@components/common/ErrorMessage';
import Header from '@components/common/Header';
import PrivateRoute from '@components/common/PrivateRoute';

const mockUseAuth = vi.fn();
vi.mock('@hooks/useAuth', () => ({
  useAuth: (): unknown => mockUseAuth(),
}));

describe('LoadingSpinner', () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
  });
  it('renders with default props', () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole('status')).toBeTruthy();
  });

  it('renders with message', () => {
    render(<LoadingSpinner message="Loading data..." />);
    expect(screen.getByText('Loading data...')).toBeTruthy();
  });

  it('renders fullScreen variant', () => {
    render(<LoadingSpinner fullScreen />);
    const el = screen.getByRole('status');
    expect(el.style.position).toBe('fixed');
  });

  it('renders small size', () => {
    render(<LoadingSpinner size="sm" />);
    expect(screen.getByRole('status')).toBeTruthy();
  });

  it('renders large size', () => {
    render(<LoadingSpinner size="lg" />);
    expect(screen.getByRole('status')).toBeTruthy();
  });
});

describe('ErrorMessage', () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
  });
  it('renders error message', () => {
    render(<ErrorMessage message="Something went wrong" />);
    expect(screen.getByText('Something went wrong')).toBeTruthy();
  });

  it('renders retry button when onRetry provided', () => {
    const onRetry = vi.fn();
    render(<ErrorMessage message="Error" onRetry={onRetry} />);
    fireEvent.click(screen.getByText('再試行'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders dismiss button when onDismiss provided', () => {
    const onDismiss = vi.fn();
    render(<ErrorMessage message="Error" onDismiss={onDismiss} />);
    fireEvent.click(screen.getByText('閉じる'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('renders both buttons when both handlers provided', () => {
    render(<ErrorMessage message="Error" onRetry={vi.fn()} onDismiss={vi.fn()} />);
    expect(screen.getByText('再試行')).toBeTruthy();
    expect(screen.getByText('閉じる')).toBeTruthy();
  });

  it('renders no buttons when no handlers provided', () => {
    render(<ErrorMessage message="Error" />);
    expect(screen.queryByText('再試行')).toBeNull();
    expect(screen.queryByText('閉じる')).toBeNull();
  });
});

describe('Header', () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
  });
  it('renders logo when authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { email: 'test@example.com' },
      logout: vi.fn().mockResolvedValue(undefined),
    });
    render(<MemoryRouter><Header /></MemoryRouter>);
    expect(screen.getByText(/IT English Trainee/i)).toBeTruthy();
    expect(screen.getByText('test@example.com')).toBeTruthy();
  });

  it('renders logo without nav when not authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, user: null, logout: vi.fn() });
    render(<MemoryRouter><Header /></MemoryRouter>);
    expect(screen.getByText(/IT English Trainee/i)).toBeTruthy();
    expect(screen.queryByText('Logout')).toBeNull();
  });

  it('calls logout on logout click', async () => {
    const mockLogout = vi.fn().mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { email: 'test@example.com' },
      logout: mockLogout,
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<Header />} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('Logout'));

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Login Page')).toBeTruthy();
    });
  });
});

describe('PrivateRoute', () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
  });
  it('shows loading spinner when isLoading', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: true });
    render(<MemoryRouter><PrivateRoute><div>Protected</div></PrivateRoute></MemoryRouter>);
    expect(screen.getByRole('status')).toBeTruthy();
  });

  it('renders children when authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    render(<MemoryRouter><PrivateRoute><div>Protected Content</div></PrivateRoute></MemoryRouter>);
    expect(screen.getByText('Protected Content')).toBeTruthy();
  });

  it('redirects to /login when not authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route
            path="/dashboard"
            element={<PrivateRoute><div>Protected</div></PrivateRoute>}
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.queryByText('Protected')).toBeNull();
    expect(screen.getByText('Login Page')).toBeTruthy();
  });
});