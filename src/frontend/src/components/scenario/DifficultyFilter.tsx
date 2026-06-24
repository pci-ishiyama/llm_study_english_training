import React from 'react';
import type { DifficultyFilter as DifficultyFilterType } from '@appTypes/index';

interface DifficultyFilterProps {
  value: DifficultyFilterType;
  onChange: (value: DifficultyFilterType) => void;
}

const FILTER_OPTIONS: { value: DifficultyFilterType; label: string }[] = [
  { value: 'all', label: 'すべて' },
  { value: 'Beginner', label: '初級' },
  { value: 'Intermediate', label: '中級' },
  { value: 'Advanced', label: '上級' },
];

const DifficultyFilter: React.FC<DifficultyFilterProps> = ({ value, onChange }) => {
  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      {FILTER_OPTIONS.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => { onChange(option.value); }}
            style={{
              padding: '8px 20px',
              borderRadius: '20px',
              border: isActive ? '2px solid #2563eb' : '2px solid #d1d5db',
              backgroundColor: isActive ? '#2563eb' : '#f3f4f6',
              color: isActive ? '#ffffff' : '#374151',
              fontWeight: isActive ? 700 : 400,
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.15s',
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

export default DifficultyFilter;
