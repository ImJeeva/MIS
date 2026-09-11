import { Link } from 'react-router-dom';
import { Images, ScanLine, Share2, Stethoscope, Upload, ArrowRight, AlertTriangle } from 'lucide-react';
import { useStudies, useShares, useLinks } from '../../lib/queries.js';
import { useAuth } from '../../lib/auth.jsx';
import { PageHeader, EmptyState, Skeleton } from '../../components/ui/misc.jsx';
import { StatTile } from '../../components/ui/StatTile.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { StudyCard } from '../../components/StudyCard.jsx';
import { DisclaimerBanner } from '../../components/DisclaimerBanner.jsx';
import { fmtDate } from '../../lib/format.js';

export default function PatientDashboard() {
  const { user } = useAuth();
  const studies = useStudies();
  const shares = useShares();
  const links = useLinks();

  const list = studies.data?.studies || [];
  const xrays = list.filter((s) => s.type === 'XRAY');
  const flagged = xrays.filter((s) => s.aiResult?.prediction === 'ABNORMAL');
  const acceptedDoctors = (links.data?.links || []).filter((l) => l.status === 'ACCEPTED');

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user.fullName.split(' ')[0]}`}
        description="Your X-rays, screenings and shared reports at a glance."
        actions={
          <Link to="/app/upload">
            <Button>
              <Upload className="h-4 w-4" /> Upload X-ray
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Total uploads" value={list.length} icon={Images} />
        <StatTile label="X-rays screened" value={xrays.filter((s) => s.aiResult?.status === 'DONE').length} icon={ScanLine} tone="teal" />
        <StatTile label="Flagged for review" value={flagged.length} icon={AlertTriangle} tone="amber" />
        <StatTile label="Connected doctors" value={acceptedDoctors.length} icon={Stethoscope} tone="green" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent studies</h2>
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
          ) : list.length === 0 ? (
            <EmptyState
              icon={Images}
              title="No studies yet"
              description="Upload your first chest X-ray to get an automated screening."
              action={
                <Link to="/app/upload">
                  <Button size="sm">Upload X-ray</Button>
                </Link>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {list.slice(0, 4).map((s) => (
                <StudyCard key={s.id} study={s} />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="text-sm font-semibold">Shared with doctors</h2>
            {shares.isLoading ? (
              <Skeleton className="mt-3 h-20" />
            ) : (shares.data?.shares || []).length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">You haven’t shared any studies yet.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {shares.data.shares.slice(0, 5).map((s) => (
                  <li key={s.id} className="flex items-center gap-3 text-sm">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950">
                      <Share2 className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{s.study.title}</p>
                      <p className="text-xs text-slate-400">
                        Dr. {s.sharedWithDoctor.fullName} · {fmtDate(s.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <DisclaimerBanner compact />
        </div>
      </div>
    </div>
  );
}
