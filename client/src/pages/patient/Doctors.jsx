import { useState } from 'react';
import toast from 'react-hot-toast';
import { Search, Stethoscope, Check, Clock, X } from 'lucide-react';
import { api, apiError } from '../../lib/api.js';
import { useDoctors, useLinks, useInvalidate } from '../../lib/queries.js';
import { PageHeader, EmptyState, Skeleton } from '../../components/ui/misc.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Field.jsx';
import { Avatar } from '../../components/ui/Avatar.jsx';
import { Badge } from '../../components/ui/Badge.jsx';

export default function Doctors() {
  const [q, setQ] = useState('');
  const { data, isLoading } = useDoctors(q);
  const links = useLinks();
  const invalidate = useInvalidate();
  const [busyId, setBusyId] = useState(null);

  const accepted = (links.data?.links || []).filter((l) => l.status === 'ACCEPTED');

  const connect = async (doctorId) => {
    setBusyId(doctorId);
    try {
      await api.post('/links', { doctorId });
      toast.success('Request sent');
      invalidate('doctors', 'links');
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setBusyId(null);
    }
  };

  const statusBadge = (s) => {
    if (s === 'ACCEPTED') return <Badge tone="green" dot>Connected</Badge>;
    if (s === 'PENDING') return <Badge tone="amber" dot>Requested</Badge>;
    if (s === 'REJECTED') return <Badge tone="slate">Declined</Badge>;
    return null;
  };

  return (
    <div>
      <PageHeader title="My doctors" description="Connect with a verified doctor, then share studies with them." />

      {accepted.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-sm font-semibold">Connected</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {accepted.map((l) => (
              <div key={l.id} className="card flex items-center gap-3 p-4">
                <Avatar name={l.doctor.fullName} src={l.doctor.avatarUrl} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">Dr. {l.doctor.fullName}</p>
                  <p className="truncate text-xs text-slate-400">{l.doctor.specialization || 'Doctor'}</p>
                </div>
                <Check className="ml-auto h-4 w-4 text-emerald-500" />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input className="pl-9" placeholder="Search by name or specialization" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (data?.doctors || []).length === 0 ? (
        <EmptyState icon={Stethoscope} title="No doctors found" description="Try a different search term." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.doctors.map((d) => (
            <div key={d.id} className="card p-4">
              <div className="flex items-center gap-3">
                <Avatar name={d.fullName} src={d.avatarUrl} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">Dr. {d.fullName}</p>
                  <p className="truncate text-xs text-slate-400">{d.specialization || 'Doctor'}</p>
                </div>
              </div>
              {d.bio && <p className="mt-3 line-clamp-2 text-xs text-slate-500">{d.bio}</p>}
              <div className="mt-3 flex items-center justify-between">
                {d.linkStatus ? (
                  statusBadge(d.linkStatus)
                ) : (
                  <span className="text-xs text-slate-400">Not connected</span>
                )}
                {(!d.linkStatus || d.linkStatus === 'REJECTED') && (
                  <Button size="sm" loading={busyId === d.id} onClick={() => connect(d.id)}>
                    Connect
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
