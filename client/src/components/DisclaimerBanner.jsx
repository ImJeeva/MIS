import { ShieldAlert } from 'lucide-react';
import { cn } from '../lib/cn.js';

export function DisclaimerBanner({ className, compact }) {
  return (
    <div
      className={cn(
        'flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-amber-800',
        'dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200',
        className
      )}
    >
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
      <p className={cn('text-amber-800 dark:text-amber-200', compact ? 'text-xs' : 'text-[13px] leading-relaxed')}>
        {compact ? (
          <>Automated first-look screening — not a diagnosis. A doctor reviews every image.</>
        ) : (
          <>
            This result is an <strong>automated first-look screening</strong>, not a medical
            diagnosis. It highlights images that may need closer attention. A qualified doctor
            reviews every X-ray and makes the final clinical decision.
          </>
        )}
      </p>
    </div>
  );
}
