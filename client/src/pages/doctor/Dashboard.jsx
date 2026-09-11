import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Users, Images, AlertTriangle, Check, X, ArrowRight, Inbox } from 'lucide-react';
import { api, apiError } from '../../lib/api.js';
import { useAuth } from '../../lib/auth.jsx';
import { useLinks, useStudies, useInvalidate } from '../../lib/queries.js';
import { PageHeader, EmptyState, Skeleton } from '../../components/ui/misc.jsx';
import { StatTile } from '../../components/ui/StatTile.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Avatar } from '../../components/ui/Avatar.jsx';
import { StudyCard } from '../../components/StudyCard.jsx';
import { fromNow } from '../../lib/format.js';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const links = useLinks();
  const studies = useStudies();
  const invalidate = useInvalidate();

  const pending = (links.data?.links || []).filter((l) => l.status === 'PENDING');
  const patients = (links.data?.links || []).filter((l) => l.status === 'ACCEPTED');
  const shared = studies.data?.studies || [];
  const flagged = shared.filter((s) => s.aiResult?.prediction === 'ABNORMAL');

  const respond = async (id, status) => {
    try {
      await api.patch(`/links/${id}`, { status });
      toast.success(status === 'ACCEPTED' ? 'Connection accepted' : 'Request declined');
      invalidate('links', 'patients', 'notifications');
    } catch (e) {
      toast.error(apiError(e));
    }
  };

  return (
    <div>
      <PageHeader title={`Dr. ${user.fullName}`} description="Requests, patients and shared studies." />

      {!user.isVerified && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
          Your account is awaiting admin verification. Patients can’t find you until it’s approved.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Patients" value={patients.length} icon={Users} />
        <StatTile label="Shared studies" value={shared.length} icon={Images} tone="teal" />
        <StatTile label="Flagged studies" value={flagged.length} icon={AlertTriangle} tone="amber" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-4">
          <h2 className="text-sm font-semibold">Connection requests</h2>
          {links.isLoading ? (
            <Skeleton className="h-24" />
          ) : pending.length === 0 ? (
            <EmptyState icon={Inbox} title="No pending requests" className="py-10" />
          ) : (
            pending.map((l) => (
              <div key={l.id} className="card p-4">
                <div className="flex items-center gap-3">
                  <Avatar name={l.patient.fullName} src={l.patient.avatarUrl} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{l.patient.fullName}</p>
                    <p className="text-xs text-slate-400">{fromNow(l.createdAt)}</p>
                  </div>
                </div>
                {l.message && <p className="mt-2 text-xs text-slate-500">“{l.message}”</p>}
                <div className="mt-3 flex gap-2">
                  <Button size="sm" className="flex-1" onClick={() => respond(l.id, 'ACCEPTED')}>
                    <Check className="h-3.5 w-3.5" /> Accept
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => respond(l.id, 'REJECTED')}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recently shared with you</h2>
            <Link to="/app/studies" className="flex items-center gap-1 text-xs font-medium text-brand-600">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {studies.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[0, 1].map((i) => (
                <Skeleton key={i} className="h-56" />
              ))}
            </div>
          ) : shared.length === 0 ? (
            <EmptyState icon={Images} title="Nothing shared yet" description="Studies your patients share will show up here." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {shared.slice(0, 4).map((s) => (
                <StudyCard key={s.id} study={s} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
