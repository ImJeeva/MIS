import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Images, Upload } from 'lucide-react';
import { useStudies } from '../../lib/queries.js';
import { useAuth } from '../../lib/auth.jsx';
import { PageHeader, EmptyState, Skeleton } from '../../components/ui/misc.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { StudyCard } from '../../components/StudyCard.jsx';
import { cn } from '../../lib/cn.js';

const filters = [
  { key: 'all', label: 'All' },
  { key: 'XRAY', label: 'X-rays' },
  { key: 'REPORT', label: 'Reports' },
];

export default function Studies() {
  const { user } = useAuth();
  const isDoctor = user.role === 'DOCTOR';
  const [filter, setFilter] = useState('all');
  const { data, isLoading } = useStudies(filter === 'all' ? undefined : filter);
  const list = data?.studies || [];

  return (
    <div>
      <PageHeader
        title={isDoctor ? 'Shared studies' : 'My studies'}
        description={
          isDoctor
            ? 'Studies your patients have shared with you.'
            : 'Everything you have uploaded, with its screening result.'
        }
        actions={
          !isDoctor && (
            <Link to="/app/upload">
              <Button>
                <Upload className="h-4 w-4" /> Upload
              </Button>
            </Link>
          )
        }
      />

      <div className="mb-4 inline-flex rounded-xl border bg-white p-0.5 dark:bg-slate-900">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-medium transition',
              filter === f.key
                ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-56" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={Images}
          title="Nothing here yet"
          description={isDoctor ? 'No studies have been shared with you.' : 'Upload a chest X-ray to get started.'}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((s) => (
            <StudyCard key={s.id} study={s} />
          ))}
        </div>
      )}
    </div>
  );
}
