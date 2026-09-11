import { useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { getTheme, setTheme } from '../lib/theme.js';
import { cn } from '../lib/cn.js';

const options = [
  { key: 'light', icon: Sun },
  { key: 'system', icon: Monitor },
  { key: 'dark', icon: Moon },
];

export function ThemeToggle() {
  const [theme, set] = useState(getTheme());
  useEffect(() => setTheme(theme), [theme]);

  return (
    <div className="inline-flex rounded-lg border bg-white p-0.5 dark:bg-slate-900">
      {options.map(({ key, icon: Icon }) => (
        <button
          key={key}
          onClick={() => set(key)}
          className={cn(
            'rounded-md p-1.5 transition',
            theme === key
              ? 'bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          )}
          aria-label={`${key} theme`}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}
