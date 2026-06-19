import React from 'react';

interface HomeSectionProps {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

const HomeSection: React.FC<HomeSectionProps> = ({ title, children, action }) => {
  const sectionStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
    border: '1px solid #e5e7eb',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
    gap: '16px',
  };

  return (
    <section style={sectionStyle}>
      <div style={headerStyle}>
        <h2 style={{ margin: 0, fontSize: '20px', color: '#111827' }}>{title}</h2>
        {action ?? null}
      </div>
      {children}
    </section>
  );
};

export default HomeSection;
