import { Link } from 'react-router-dom';
import { NotebookPen } from 'lucide-react';
import { useNotes } from '../lib/queries.js';
import { useAuth } from '../lib/auth.jsx';
import { PageHeader, EmptyState, Skeleton } from '../components/ui/misc.jsx';
import { Avatar } from '../components/ui/Avatar.jsx';
import { fmtDateTime } from '../lib/format.js';

export default function Notes() {
  const { user } = useAuth();
  const isDoctor = user.role === 'DOCTOR';
  const { data, isLoading } = useNotes();
  const notes = data?.notes || [];

  return (
    <div>
      <PageHeader
        title={isDoctor ? 'My notes' : 'Appointment notes'}
        description={
          isDoctor
            ? 'Notes you have written for your patients.'
            : 'Notes your doctors have written about your studies.'
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <EmptyState
          icon={NotebookPen}
          title="No notes yet"
          description={isDoctor ? 'Open a patient and add a note.' : 'Your doctors haven’t added any notes yet.'}
        />
      ) : (
        <div className="space-y-3">
          {notes.map((n) => {
            const person = isDoctor ? n.patient : n.doctor;
            return (
              <div key={n.id} className="card p-5">
                <div className="flex items-start gap-3">
                  <Avatar name={person.fullName} src={person.avatarUrl} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{n.title}</p>
                      <span className="shrink-0 text-xs text-slate-400">{fmtDateTime(n.createdAt)}</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {isDoctor ? 'For' : 'By'} {isDoctor ? person.fullName : `Dr. ${person.fullName}`}
                      {n.study && (
                        <>
                          {' · '}
                          <Link to={`/app/studies/${n.study.id}`} className="text-brand-600">
                            {n.study.title}
                          </Link>
                        </>
                      )}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{n.body}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
