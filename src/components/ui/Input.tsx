"use client";

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col w-full">
        <label className="text-sm font-semibold text-gray-500 mb-2">
          {label}
        </label>
        <input
          ref={ref}
          className={`w-full p-4 bg-white rounded-xl border transition-colors outline-none focus:ring-1 focus:ring-gold focus:border-gold
            ${error ? 'border-red-500' : 'border-gray-200 hover:border-gold/50'} 
            ${className}
          `}
          {...props}
        />
        {error && (
          <span className="text-xs font-semibold text-red-500 mt-1.5">{error}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';