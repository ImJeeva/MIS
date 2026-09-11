import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, NotebookPen, Plus } from 'lucide-react';
import { api, apiError } from '../../lib/api.js';
import { usePatientDetail, useInvalidate } from '../../lib/queries.js';
import { Skeleton, EmptyState } from '../../components/ui/misc.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Avatar } from '../../components/ui/Avatar.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { Field, Input, Select, Textarea } from '../../components/ui/Field.jsx';
import { StudyCard } from '../../components/StudyCard.jsx';
import { fmtDate, fmtDateTime } from '../../lib/format.js';

export default function PatientDetail() {
  const { id } = useParams();
  const { data, isLoading } = usePatientDetail(id);
  const invalidate = useInvalidate();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState({ title: '', body: '', studyId: '' });

  if (isLoading) return <Skeleton className="h-96" />;
  if (!data) return <EmptyState title="Patient not found" />;

  const { patient, studies = [], notes = [] } = data;

  const saveNote = async () => {
    if (!note.title.trim() || !note.body.trim()) return toast.error('Title and body are required');
    setSaving(true);
    try {
      await api.post('/notes', {
        patientId: id,
        title: note.title,
        body: note.body,
        studyId: note.studyId || null,
      });
      toast.success('Note added');
      setOpen(false);
      setNote({ title: '', body: '', studyId: '' });
      invalidate(['patient', id], 'notes', 'notifications');
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Link to="/app/patients" className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> All patients
      </Link>

      <div className="card mb-6 flex flex-wrap items-center gap-4 p-5">
        <Avatar name={patient.fullName} src={patient.avatarUrl} size="lg" />
        <div className="min-w-0">
          <h1 className="text-lg font-bold">{patient.fullName}</h1>
          <p className="text-sm text-slate-400">
            {patient.email} · {patient.phone || 'no phone'} · {patient.gender || '—'}
          </p>
        </div>
        <Button className="ml-auto" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Add note
        </Button>
      </div>

      <h2 className="mb-3 text-sm font-semibold">Shared studies</h2>
      {studies.length === 0 ? (
        <EmptyState title="No studies shared" description="This patient hasn’t shared any studies with you yet." className="mb-8" />
      ) : (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {studies.map((s) => (
            <StudyCard key={s.id} study={s} />
          ))}
        </div>
      )}

      <h2 className="mb-3 text-sm font-semibold">Appointment notes</h2>
      {notes.length === 0 ? (
        <EmptyState icon={NotebookPen} title="No notes yet" description="Notes you write for this patient appear here and are visible to them." />
      ) : (
        <div className="space-y-3">
          {notes.map((n) => (
            <div key={n.id} className="card p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{n.title}</p>
                <span className="text-xs text-slate-400">{fmtDateTime(n.createdAt)}</span>
              </div>
              {n.study && <p className="mt-0.5 text-xs text-brand-600">re: {n.study.title}</p>}
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{n.body}</p>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New appointment note"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveNote} loading={saving}>
              Save note
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Title">
            <Input value={note.title} onChange={(e) => setNote((n) => ({ ...n, title: e.target.value }))} placeholder="Follow-up plan" />
          </Field>
          <Field label="Link to a study (optional)">
            <Select value={note.studyId} onChange={(e) => setNote((n) => ({ ...n, studyId: e.target.value }))}>
              <option value="">— none —</option>
              {studies.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Note">
            <Textarea rows={5} value={note.body} onChange={(e) => setNote((n) => ({ ...n, body: e.target.value }))} placeholder="Clinical impression, plan, next steps…" />
          </Field>
          <p className="text-xs text-slate-400">This note is visible to the patient.</p>
        </div>
      </Modal>
    </div>
  );
}
