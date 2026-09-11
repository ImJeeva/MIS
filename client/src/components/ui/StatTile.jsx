import { cn } from '../../lib/cn.js';

export function StatTile({ label, value, icon: Icon, tone = 'brand', hint, className }) {
  const tones = {
    brand: 'text-brand-600 bg-brand-50 dark:bg-brand-950 dark:text-brand-300',
    green: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300',
    amber: 'text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-300',
    teal: 'text-teal-600 bg-teal-50 dark:bg-teal-950 dark:text-teal-300',
    slate: 'text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300',
  };
  return (
    <div className={cn('card p-5', className)}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </p>
        {Icon && (
          <span className={cn('rounded-xl p-2', tones[tone])}>
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
