import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  active?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'secondary',
  size = 'md',
  active,
  ...props
}) => {
  const variants = {
    primary: 'bg-accent text-white hover:bg-accent/90 shadow-lg shadow-accent/20',
    accent: 'bg-purple-600 text-white hover:bg-purple-500 shadow-lg shadow-purple-500/20',
    secondary: 'bg-surface text-text hover:bg-surface2 border border-border',
    outline: 'bg-transparent border border-border hover:border-accent hover:text-accent',
    ghost: 'bg-transparent hover:bg-white/5 text-textSec hover:text-text',
    danger: 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20',
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-6 py-3 text-base',
    icon: 'p-1.5',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-px6 font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        active && 'border-accent text-accent bg-accent/10',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};
