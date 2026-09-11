import { forwardRef } from 'react';
import { cn } from '../../lib/cn.js';

export function Label({ children, htmlFor, className }) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn('mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300', className)}
    >
      {children}
    </label>
  );
}

export function FieldError({ children }) {
  if (!children) return null;
  return <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{children}</p>;
}

export const Input = forwardRef(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn('input-base', className)} {...props} />;
});

export const Textarea = forwardRef(function Textarea({ className, rows = 4, ...props }, ref) {
  return <textarea ref={ref} rows={rows} className={cn('input-base resize-y', className)} {...props} />;
});

export const Select = forwardRef(function Select({ className, children, ...props }, ref) {
  return (
    <select ref={ref} className={cn('input-base pr-9', className)} {...props}>
      {children}
    </select>
  );
});

export function Field({ label, error, children, hint }) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      <FieldError>{error}</FieldError>
    </div>
  );
}
