import { Link } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { cn } from '../lib/cn.js';
import { Badge } from './ui/Badge.jsx';

export function Logo({ className, textClassName, to = '/' }) {
  return (
    <Link to={to} className={cn('flex items-center gap-2', className)}>
      <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand-600 text-white shadow-sm">
        <Activity className="h-4 w-4" strokeWidth={2.5} />
      </span>
      <span className={cn('text-base font-bold tracking-tight text-slate-900 dark:text-white', textClassName)}>
        MIS<span className="text-brand-600">.</span>
      </span>
    </Link>
  );
}

export function RoleBadge({ role }) {
  const map = {
    PATIENT: { tone: 'brand', label: 'Patient' },
    DOCTOR: { tone: 'teal', label: 'Doctor' },
    ADMIN: { tone: 'slate', label: 'Admin' },
  };
  const r = map[role] || map.PATIENT;
  return <Badge tone={r.tone}>{r.label}</Badge>;
}

export function AiBadge({ ai }) {
  if (!ai || ai.status === 'PENDING') return <Badge tone="slate" dot>Screening…</Badge>;
  if (ai.status === 'FAILED') return <Badge tone="slate">No screening</Badge>;
  return ai.prediction === 'ABNORMAL' ? (
    <Badge tone="amber" dot>Flagged</Badge>
  ) : (
    <Badge tone="green" dot>Clear</Badge>
  );
}
