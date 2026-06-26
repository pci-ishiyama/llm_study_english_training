import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import LoadingSpinner from '@components/common/LoadingSpinner';
import ErrorMessage from '@components/common/ErrorMessage';
import Header from '@components/common/Header';
import PrivateRoute from '@components/common/PrivateRoute';
import MicButton from '@components/chat/MicButton';
import InputArea from '@components/chat/InputArea';

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
    fireEvent.click(screen.getByText('\u518d\u8a66\u884c'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders dismiss button when onDismiss provided', () => {
    const onDismiss = vi.fn();
    render(<ErrorMessage message="Error" onDismiss={onDismiss} />);
    fireEvent.click(screen.getByText('\u9589\u3058\u308b'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('renders both buttons when both handlers provided', () => {
    render(<ErrorMessage message="Error" onRetry={vi.fn()} onDismiss={vi.fn()} />);
    expect(screen.getByText('\u518d\u8a66\u884c')).toBeTruthy();
    expect(screen.getByText('\u9589\u3058\u308b')).toBeTruthy();
  });

  it('renders no buttons when no handlers provided', () => {
    render(<ErrorMessage message="Error" />);
    expect(screen.queryByText('\u518d\u8a66\u884c')).toBeNull();
    expect(screen.queryByText('\u9589\u3058\u308b')).toBeNull();
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

describe('MicButton', () => {
  const defaultProps = {
    isRecording: false,
    isTranscribing: false,
    disabled: false,
    onMouseDown: vi.fn(),
    onMouseUp: vi.fn(),
    onTouchStart: vi.fn(),
    onTouchEnd: vi.fn(),
  };

  it('renders with default state (待機中)', () => {
    render(<MicButton {...defaultProps} />);
    expect(screen.getByRole('button', { name: '音声入力' })).toBeTruthy();
  });

  it('renders recording state', () => {
    render(<MicButton {...defaultProps} isRecording={true} />);
    expect(screen.getByRole('button', { name: '録音中（離すと送信）' })).toBeTruthy();
  });

  it('renders transcribing state', () => {
    render(<MicButton {...defaultProps} isTranscribing={true} />);
    expect(screen.getByRole('button', { name: '変換中...' })).toBeTruthy();
  });

  it('renders disabled state', () => {
    render(<MicButton {...defaultProps} disabled={true} />);
    const btn = screen.getByRole('button', { name: '音声入力' });
    expect(btn).toBeTruthy();
  });

  it('calls onMouseDown when pressed', () => {
    const onMouseDown = vi.fn();
    render(<MicButton {...defaultProps} onMouseDown={onMouseDown} />);
    fireEvent.mouseDown(screen.getByRole('button', { name: '音声入力' }));
    expect(onMouseDown).toHaveBeenCalledTimes(1);
  });

  it('calls onMouseUp when released', () => {
    const onMouseUp = vi.fn();
    render(<MicButton {...defaultProps} onMouseUp={onMouseUp} />);
    fireEvent.mouseUp(screen.getByRole('button', { name: '音声入力' }));
    expect(onMouseUp).toHaveBeenCalledTimes(1);
  });

  it('calls onMouseUp on mouse leave', () => {
    const onMouseUp = vi.fn();
    render(<MicButton {...defaultProps} onMouseUp={onMouseUp} />);
    fireEvent.mouseLeave(screen.getByRole('button', { name: '音声入力' }));
    expect(onMouseUp).toHaveBeenCalledTimes(1);
  });
});

const mockUseAudioRecorder = vi.fn();

vi.mock('@hooks/useAudioRecorder', () => ({
  useAudioRecorder: (...args: unknown[]): unknown => mockUseAudioRecorder(...args),
}));

describe('InputArea', () => {
  beforeEach(() => {
    mockUseAudioRecorder.mockReturnValue({
      isRecording: false,
      isTranscribing: false,
      transcribeError: null,
      startRecording: vi.fn().mockResolvedValue(undefined),
      stopRecording: vi.fn(),
    });
  });

  it('renders textarea and send button', () => {
    render(<InputArea onSend={vi.fn()} />);
    expect(screen.getByRole('textbox', { name: 'メッセージ入力' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '送信' })).toBeTruthy();
  });

  it('calls onSend when send button is clicked with text', () => {
    const onSend = vi.fn();
    render(<InputArea onSend={onSend} />);
    const textarea = screen.getByRole('textbox', { name: 'メッセージ入力' });
    fireEvent.change(textarea, { target: { value: 'Hello' } });
    fireEvent.click(screen.getByRole('button', { name: '送信' }));
    expect(onSend).toHaveBeenCalledWith('Hello');
  });

  it('does not call onSend when disabled', () => {
    const onSend = vi.fn();
    render(<InputArea onSend={onSend} disabled={true} />);
    const textarea = screen.getByRole('textbox', { name: 'メッセージ入力' });
    fireEvent.change(textarea, { target: { value: 'Hello' } });
    fireEvent.click(screen.getByRole('button', { name: '送信' }));
    expect(onSend).not.toHaveBeenCalled();
  });

  it('sends message on Enter key', () => {
    const onSend = vi.fn();
    render(<InputArea onSend={onSend} />);
    const textarea = screen.getByRole('textbox', { name: 'メッセージ入力' });
    fireEvent.change(textarea, { target: { value: 'Test message' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
    expect(onSend).toHaveBeenCalledWith('Test message');
  });

  it('does not send on Shift+Enter', () => {
    const onSend = vi.fn();
    render(<InputArea onSend={onSend} />);
    const textarea = screen.getByRole('textbox', { name: 'メッセージ入力' });
    fireEvent.change(textarea, { target: { value: 'Test' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });
    expect(onSend).not.toHaveBeenCalled();
  });

  it('shows transcribeError when present', () => {
    mockUseAudioRecorder.mockReturnValue({
      isRecording: false,
      isTranscribing: false,
      transcribeError: '録音エラーが発生しました',
      startRecording: vi.fn().mockResolvedValue(undefined),
      stopRecording: vi.fn(),
    });
    render(<InputArea onSend={vi.fn()} />);
    expect(screen.getByText('録音エラーが発生しました')).toBeTruthy();
  });

  it('shows recording placeholder when isRecording', () => {
    mockUseAudioRecorder.mockReturnValue({
      isRecording: true,
      isTranscribing: false,
      transcribeError: null,
      startRecording: vi.fn().mockResolvedValue(undefined),
      stopRecording: vi.fn(),
    });
    render(<InputArea onSend={vi.fn()} />);
    const textarea = screen.getByRole('textbox', { name: 'メッセージ入力' });
    expect(textarea.getAttribute('placeholder')).toBe('録音中...');
  });

  it('shows transcribing placeholder when isTranscribing', () => {
    mockUseAudioRecorder.mockReturnValue({
      isRecording: false,
      isTranscribing: true,
      transcribeError: null,
      startRecording: vi.fn().mockResolvedValue(undefined),
      stopRecording: vi.fn(),
    });
    render(<InputArea onSend={vi.fn()} />);
    const textarea = screen.getByRole('textbox', { name: 'メッセージ入力' });
    expect(textarea.getAttribute('placeholder')).toBe('変換中...');
  });
});