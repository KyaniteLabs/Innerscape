import React from 'react';

export const Button = ({ 
  children, 
  onClick, 
  className = '', 
  type = 'button',
  disabled = false 
}: { 
  children: React.ReactNode, 
  onClick?: () => void, 
  className?: string,
  type?: 'button' | 'submit' | 'reset',
  disabled?: boolean
}) => (
  <button 
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded-lg font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 ${className}`}
  >
    {children}
  </button>
);
