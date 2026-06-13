'use client';

import React, { useState } from 'react';

interface ButtonProps {
  title: string;
  onPress: () => void | Promise<void>;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
}

const variantClasses: Record<string, string> = {
  primary: 'bg-accent hover:bg-accent-light text-white',
  secondary: 'bg-surface hover:bg-surface-light text-text-primary border border-border',
  outline: 'bg-transparent border border-accent text-accent hover:bg-accent/10',
  ghost: 'bg-transparent text-text-secondary hover:text-text-primary',
};

const sizeClasses: Record<string, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  icon,
  type = 'button',
}: ButtonProps) {
  const [internalLoading, setInternalLoading] = useState(false);
  const blocked = disabled || loading || internalLoading;

  const handleClick = async () => {
    if (blocked || type === 'submit') return;
    try {
      setInternalLoading(true);
      await Promise.resolve(onPress?.());
    } finally {
      setTimeout(() => setInternalLoading(false), 500);
    }
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={blocked}
      className={[
        'flex items-center justify-center gap-2 rounded-lg font-medium transition-colors',
        variantClasses[variant],
        sizeClasses[size],
        blocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
        className,
      ].join(' ')}
    >
      {loading || internalLoading ? (
        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        <>
          {icon}
          {title}
        </>
      )}
    </button>
  );
}
