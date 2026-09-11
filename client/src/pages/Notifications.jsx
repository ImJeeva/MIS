import { Link } from 'react-router-dom';
import {
  Bell,
  Share2,
  ScanLine,
  NotebookPen,
  UserPlus,
  CheckCheck,
  BadgeCheck,
} from 'lucide-react';
import { api } from '../lib/api.js';
import { useNotifications, useInvalidate } from '../lib/queries.js';
import { PageHeader, EmptyState, Skeleton } from '../components/ui/misc.jsx';
import { Button } from '../components/ui/Button.jsx';
import { cn } from '../lib/cn.js';
import { fromNow } from '../lib/format.js';

const iconFor = {
  STUDY_SHARED: Share2,
  AI_RESULT: ScanLine,
  NOTE_ADDED: NotebookPen,
  LINK_REQUEST: UserPlus,
  LINK_UPDATE: BadgeCheck,
  DOCTOR_VERIFIED: BadgeCheck,
};

export default function Notifications() {
  const { data, isLoading } = useNotifications();
  const invalidate = useInvalidate();
  const items = data?.notifications || [];

  const markAll = async () => {
    await api.post('/notifications/read-all');
    invalidate('notifications');
  };

  const open = async (n) => {
    if (!n.isRead) {
      await api.patch(`/notifications/${n.id}/read`);
      invalidate('notifications');
    }
  };

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Screenings, shares, notes and connection updates."
        actions={
          items.some((n) => !n.isRead) && (
            <Button variant="secondary" size="sm" onClick={markAll}>
              <CheckCheck className="h-4 w-4" /> Mark all read
            </Button>
          )
        }
      />

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={Bell} title="You’re all caught up" description="No notifications yet." />
      ) : (
        <div className="card divide-y overflow-hidden">
          {items.map((n) => {
            const Icon = iconFor[n.type] || Bell;
            const body = (
              <div
                className={cn(
                  'flex gap-3 px-5 py-4 transition',
                  !n.isRead && 'bg-brand-50/40 dark:bg-brand-950/20'
                )}
              >
                <span
                  className={cn(
                    'grid h-9 w-9 shrink-0 place-items-center rounded-xl',
                    n.isRead
                      ? 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                      : 'bg-brand-100 text-brand-600 dark:bg-brand-950 dark:text-brand-300'
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{n.title}</p>
                    <span className="shrink-0 text-xs text-slate-400">{fromNow(n.createdAt)}</span>
                  </div>
                  {n.body && <p className="mt-0.5 text-sm text-slate-500">{n.body}</p>}
                </div>
                {!n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
              </div>
            );
            return n.linkTo ? (
              <Link key={n.id} to={n.linkTo} onClick={() => open(n)} className="block hover:bg-slate-50 dark:hover:bg-slate-800/40">
                {body}
              </Link>
            ) : (
              <button key={n.id} onClick={() => open(n)} className="block w-full text-left hover:bg-slate-50 dark:hover:bg-slate-800/40">
                {body}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
