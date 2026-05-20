import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import LoadingSpinner from '@components/common/LoadingSpinner';
import ErrorMessage from '@components/common/ErrorMessage';

/**
 * ログイン画面（プレースホルダー）
 * Step4 で完全実装予定
 */
const LoginPage: React.FC = () => {
  const { login, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    await login(email, password);
    navigate('/');
  };

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
  };

  const cardStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '400px',
    padding: '40px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box',
    marginTop: '6px',
  };

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    backgroundColor: '#1e40af',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: isLoading ? 'not-allowed' : 'pointer',
    marginTop: '20px',
    opacity: isLoading ? 0.7 : 1,
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={{ textAlign: 'center', color: '#1e40af', marginBottom: '8px' }}>
          🎙️ IT English Trainee
        </h1>
        <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '28px', fontSize: '14px' }}>
          ITエンジニア向け英会話トレーニング
        </p>

        {error && (
          <div style={{ marginBottom: '16px' }}>
            <ErrorMessage message={error} onDismiss={clearError} />
          </div>
        )}

        <form onSubmit={(e) => void handleSubmit(e)}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>
              メールアドレス
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                placeholder="example@company.com"
                required
              />
            </label>
          </div>
          <div>
            <label style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>
              パスワード
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
                placeholder="••••••••"
                required
              />
            </label>
          </div>
          <button type="submit" style={buttonStyle} disabled={isLoading}>
            {isLoading ? <LoadingSpinner size="sm" /> : 'ログイン'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
