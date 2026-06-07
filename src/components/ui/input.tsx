import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, helperText, ...props }, ref) => {
    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="block text-sm font-semibold text-slate-900 text-left">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            'flex h-14 w-full rounded-xl border-2 bg-white px-5 py-4 text-base font-medium text-slate-900 text-left placeholder:text-slate-400 placeholder:text-left transition-all duration-200',
            'focus:outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50',
            'file:border-0 file:bg-transparent file:text-sm file:font-medium',
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
              : 'border-slate-200 hover:border-slate-300',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-sm font-medium text-red-600 flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="text-sm text-slate-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
