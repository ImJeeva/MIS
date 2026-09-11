import { cn } from '../../lib/cn.js';
import { Loader2 } from 'lucide-react';

export function Spinner({ className }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin text-brand-500', className)} />;
}

export function Skeleton({ className }) {
  return <div className={cn('skeleton rounded-lg', className)} />;
}

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-14 text-center',
        className
      )}
    >
      {Icon && (
        <div className="mb-3 rounded-2xl bg-slate-100 p-3 text-slate-400 dark:bg-slate-800">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function PageHeader({ title, description, actions, children }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
        )}
        {children}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Divider({ className }) {
  return <div className={cn('h-px w-full bg-slate-200 dark:bg-slate-800', className)} />;
}
