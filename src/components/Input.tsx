'use client';

import React, { useState } from 'react';
import { IoEyeOutline, IoEyeOffOutline } from 'react-icons/io5';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel';
  autoComplete?: string;
  multiline?: boolean;
  rows?: number;
  error?: string;
  className?: string;
  disabled?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  autoComplete,
  multiline = false,
  rows = 3,
  error,
  className = '',
  disabled = false,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const baseInputClass = [
    'w-full bg-surface text-text-primary placeholder-text-muted px-4 py-3 rounded-lg outline-none transition-colors',
    isFocused ? 'ring-2 ring-accent border-accent' : 'border border-border',
    error ? 'border-error ring-1 ring-error' : '',
    disabled ? 'opacity-50 cursor-not-allowed' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="flex flex-col gap-1 mb-4">
      {label && <label className="text-text-secondary text-sm font-medium">{label}</label>}
      <div className="relative">
        {multiline ? (
          <textarea
            className={baseInputClass + ' resize-none'}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={rows}
            disabled={disabled}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        ) : (
          <input
            className={baseInputClass + (type === 'password' ? ' pr-12' : '')}
            type={type === 'password' && showPassword ? 'text' : type}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            autoComplete={autoComplete}
            disabled={disabled}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        )}
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
          >
            {showPassword ? <IoEyeOffOutline size={20} /> : <IoEyeOutline size={20} />}
          </button>
        )}
      </div>
      {error && <p className="text-error text-xs">{error}</p>}
    </div>
  );
};
