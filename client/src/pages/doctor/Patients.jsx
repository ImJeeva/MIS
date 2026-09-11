import { Link } from 'react-router-dom';
import { Users, ArrowRight } from 'lucide-react';
import { usePatients } from '../../lib/queries.js';
import { PageHeader, EmptyState, Skeleton } from '../../components/ui/misc.jsx';
import { Avatar } from '../../components/ui/Avatar.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { fmtDate } from '../../lib/format.js';

export default function Patients() {
  const { data, isLoading } = usePatients();
  const patients = data?.patients || [];

  return (
    <div>
      <PageHeader title="My patients" description="Patients connected to you." />

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : patients.length === 0 ? (
        <EmptyState icon={Users} title="No patients yet" description="Accept a connection request to see patients here." />
      ) : (
        <div className="card divide-y overflow-hidden">
          {patients.map((p) => (
            <Link
              key={p.id}
              to={`/app/patients/${p.id}`}
              className="flex items-center gap-4 px-5 py-4 transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
              <Avatar name={p.fullName} src={p.avatarUrl} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{p.fullName}</p>
                <p className="truncate text-xs text-slate-400">
                  {p.gender || '—'} · connected {fmtDate(p.connectedSince)}
                </p>
              </div>
              <Badge tone="brand">{p.sharedStudies} shared</Badge>
              <ArrowRight className="h-4 w-4 text-slate-300" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
