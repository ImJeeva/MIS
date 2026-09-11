import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, ImageIcon } from 'lucide-react';
import { fetchStudyBlob } from '../lib/api.js';
import { fmtDate } from '../lib/format.js';
import { AiBadge } from './common.jsx';
import { Badge } from './ui/Badge.jsx';

function Thumb({ study }) {
  const [url, setUrl] = useState(null);
  const [state, setState] = useState('loading'); // loading | ok | error

  useEffect(() => {
    if (!study.fileMime?.startsWith('image/')) {
      setState('error');
      return;
    }
    let revoked;
    let cancelled = false;

    const load = (attempt = 0) => {
      fetchStudyBlob(study.id)
        .then((b) => {
          if (cancelled) return;
          const u = URL.createObjectURL(b);
          revoked = u;
          setUrl(u);
          setState('ok');
        })
        .catch(() => {
          if (cancelled) return;
          if (attempt < 1) setTimeout(() => load(attempt + 1), 400);
          else setState('error');
        });
    };
    load();

    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [study.id, study.fileMime]);

  return (
    <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
      {state === 'ok' && url ? (
        <img src={url} alt={study.title} className="h-full w-full object-cover" />
      ) : (
        <div className="grid h-full place-items-center text-slate-400">
          {state === 'loading' ? (
            <div className="h-6 w-6 animate-pulse rounded-full bg-slate-300 dark:bg-slate-600" />
          ) : study.type === 'REPORT' ? (
            <FileText className="h-8 w-8" />
          ) : (
            <ImageIcon className="h-8 w-8" />
          )}
        </div>
      )}
    </div>
  );
}

export function StudyCard({ study, to }) {
  return (
    <Link
      to={to || `/app/studies/${study.id}`}
      className="card group overflow-hidden p-3 transition hover:shadow-card-lg"
    >
      <Thumb study={study} />
      <div className="px-1 pb-1 pt-3">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-slate-800 group-hover:text-brand-600 dark:text-slate-100">
            {study.title}
          </p>
          <Badge tone="slate">{study.type === 'REPORT' ? 'Report' : 'X-ray'}</Badge>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-slate-400">{fmtDate(study.createdAt)}</span>
          {study.type === 'XRAY' && <AiBadge ai={study.aiResult} />}
        </div>
      </div>
    </Link>
  );
}
