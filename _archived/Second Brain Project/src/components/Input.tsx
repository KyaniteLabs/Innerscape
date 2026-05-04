import React from 'react';

export const Input = ({ 
  value, 
  onChange, 
  placeholder, 
  className = '',
  required = false
}: { 
  value: string, 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, 
  placeholder?: string,
  className?: string,
  required?: boolean
}) => (
  <input
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    required={required}
    className={`w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${className}`}
  />
);
