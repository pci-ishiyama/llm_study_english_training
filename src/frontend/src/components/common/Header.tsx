import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';

const Header: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = (): void => {
    void logout().then(() => {
      navigate('/login');
    });
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    height: '60px',
    backgroundColor: '#1e40af',
    color: '#fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  };

  const logoStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 700,
    color: '#fff',
    textDecoration: 'none',
  };

  const navStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  };

  const navLinkStyle: React.CSSProperties = {
    color: '#bfdbfe',
    textDecoration: 'none',
    fontSize: '14px',
  };

  const logoutButtonStyle: React.CSSProperties = {
    padding: '6px 14px',
    backgroundColor: 'transparent',
    border: '1px solid #bfdbfe',
    borderRadius: '6px',
    color: '#bfdbfe',
    fontSize: '13px',
    cursor: 'pointer',
  };

  return (
    <header style={headerStyle}>
      <Link to="/" style={logoStyle}>
        IT English Trainee
      </Link>

      {isAuthenticated && (
        <nav style={navStyle}>
          <Link to="/" style={navLinkStyle}>Home</Link>
          <Link to="/history" style={navLinkStyle}>History</Link>
          <Link to="/settings" style={navLinkStyle}>Settings</Link>
          <span style={{ fontSize: '13px', color: '#bfdbfe' }}>
            {user?.email}
          </span>
          <button onClick={handleLogout} style={logoutButtonStyle}>
            Logout
          </button>
        </nav>
      )}
    </header>
  );
};

export default Header;