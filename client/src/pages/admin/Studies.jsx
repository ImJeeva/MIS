import { useState } from 'react';
import { useAdminStudies } from '../../lib/queries.js';
import { PageHeader, Skeleton, EmptyState } from '../../components/ui/misc.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { AiBadge } from '../../components/common.jsx';
import { fmtDateTime, fmtBytes } from '../../lib/format.js';

export default function AdminStudies() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminStudies({ page, pageSize: 20 });
  const studies = data?.studies || [];
  const pages = data ? Math.ceil(data.total / data.pageSize) : 1;

  return (
    <div>
      <PageHeader title="Studies" description="Every study uploaded to the platform." />

      {isLoading ? (
        <Skeleton className="h-96" />
      ) : studies.length === 0 ? (
        <EmptyState title="No studies" />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-slate-50 text-left text-xs uppercase text-slate-400 dark:bg-slate-950">
                <tr>
                  <th className="px-5 py-3 font-medium">Study</th>
                  <th className="px-5 py-3 font-medium">Owner</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Screening</th>
                  <th className="px-5 py-3 font-medium">Uploaded</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {studies.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3">
                      <p className="font-medium">{s.title}</p>
                      <p className="text-xs text-slate-400">{fmtBytes(s.fileSizeBytes)}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium">{s.owner.fullName}</p>
                      <p className="text-xs text-slate-400">{s.owner.email}</p>
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone="slate">{s.type === 'REPORT' ? 'Report' : 'X-ray'}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      {s.type === 'XRAY' ? (
                        <div className="flex items-center gap-2">
                          <AiBadge ai={s.aiResult} />
                          {s.aiResult?.confidence != null && (
                            <span className="text-xs text-slate-400">
                              {Math.round(s.aiResult.confidence * 100)}%
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-400">{fmtDateTime(s.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
