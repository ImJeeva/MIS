import { useState } from 'react';
import { ScrollText } from 'lucide-react';
import { useAdminAudit } from '../../lib/queries.js';
import { PageHeader, Skeleton, EmptyState } from '../../components/ui/misc.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { fmtDateTime } from '../../lib/format.js';

export default function AdminAudit() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminAudit({ page, pageSize: 40 });
  const logs = data?.logs || [];
  const pages = data ? Math.ceil(data.total / data.pageSize) : 1;

  return (
    <div>
      <PageHeader title="Audit log" description="A chronological record of key actions." />

      {isLoading ? (
        <Skeleton className="h-96" />
      ) : logs.length === 0 ? (
        <EmptyState icon={ScrollText} title="No entries yet" />
      ) : (
        <div className="card divide-y overflow-hidden">
          {logs.map((l) => (
            <div key={l.id} className="flex items-center gap-4 px-5 py-3 text-sm">
              <Badge tone="slate" className="font-mono">
                {l.action}
              </Badge>
              <div className="min-w-0 flex-1">
                <p className="truncate">
                  <span className="font-medium">{l.actor?.fullName || 'system'}</span>
                  {l.targetType && (
                    <span className="text-slate-400">
                      {' '}
                      · {l.targetType} {l.targetId?.slice(0, 8)}
                    </span>
                  )}
                </p>
              </div>
              <span className="shrink-0 text-xs text-slate-400">{fmtDateTime(l.createdAt)}</span>
            </div>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-slate-400">
            Page {page} of {pages}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button size="sm" variant="secondary" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
