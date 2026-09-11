import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Share2, Trash2, Users, Ban } from 'lucide-react';
import { api, apiError } from '../lib/api.js';
import { useStudy, useLinks, useInvalidate } from '../lib/queries.js';
import { useAuth } from '../lib/auth.jsx';
import { Skeleton, EmptyState, PageHeader } from '../components/ui/misc.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Avatar } from '../components/ui/Avatar.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { Field, Select, Textarea } from '../components/ui/Field.jsx';
import { ImageViewer } from '../components/ImageViewer.jsx';
import { AiResultCard } from '../components/AiResultCard.jsx';
import { fmtBytes, fmtDateTime } from '../lib/format.js';

export default function StudyDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const invalidate = useInvalidate();
  const { data, isLoading } = useStudy(id);
  const links = useLinks();

  const [shareOpen, setShareOpen] = useState(false);
  const [shareForm, setShareForm] = useState({ doctorId: '', message: '' });
  const [busy, setBusy] = useState(false);
  const [rerunning, setRerunning] = useState(false);

  if (isLoading) return <Skeleton className="h-[60vh]" />;
  if (!data?.study) return <EmptyState title="Study not found" />;

  const study = data.study;
  const myRole = data.myRole; // OWNER | DOCTOR | ADMIN
  const isOwner = myRole === 'OWNER';
  const acceptedDoctors = (links.data?.links || []).filter((l) => l.status === 'ACCEPTED');
  const activeShares = (study.shares || []).filter((s) => !s.revokedAt);
  const myShare = study.shares?.find((s) => s.sharedWithDoctorId === user.id);
  const canDownload = isOwner || myRole === 'ADMIN' || myShare?.canDownload !== false;

  const rerun = async () => {
    setRerunning(true);
    try {
      await api.post(`/studies/${id}/analyze`);
      toast.success('Screening re-run');
      invalidate(['study', id]);
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setRerunning(false);
    }
  };

  const doShare = async () => {
    if (!shareForm.doctorId) return toast.error('Choose a doctor');
    setBusy(true);
    try {
      await api.post('/shares', { studyId: id, doctorId: shareForm.doctorId, message: shareForm.message });
      toast.success('Study shared');
      setShareOpen(false);
      setShareForm({ doctorId: '', message: '' });
      invalidate(['study', id], 'shares', 'notifications');
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (shareId) => {
    try {
      await api.delete(`/shares/${shareId}`);
      toast.success('Access revoked');
      invalidate(['study', id], 'shares');
    } catch (e) {
      toast.error(apiError(e));
    }
  };

  const remove = async () => {
    if (!confirm('Delete this study permanently?')) return;
    try {
      await api.delete(`/studies/${id}`);
      toast.success('Study deleted');
      invalidate('studies', ['admin', 'stats']);
      nav('/app/studies');
    } catch (e) {
      toast.error(apiError(e));
    }
  };

  return (
    <div>
      <Link to="/app/studies" className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Back to studies
      </Link>

      <PageHeader
        title={study.title}
        description={`${study.bodyPart} · ${study.type === 'REPORT' ? 'Report' : 'X-ray'} · ${fmtBytes(study.fileSizeBytes)}`}
        actions={
          isOwner && (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setShareOpen(true)}>
                <Share2 className="h-4 w-4" /> Share
              </Button>
              <Button variant="ghost" onClick={remove}>
                <Trash2 className="h-4 w-4 text-rose-500" />
              </Button>
            </div>
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ImageViewer study={study} canDownload={canDownload} />
          {study.notes && (
            <div className="card mt-4 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Patient notes</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{study.notes}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {study.type === 'XRAY' && (
            <AiResultCard
              ai={study.aiResult}
              onRerun={rerun}
              rerunning={rerunning}
              canRerun={isOwner || myRole === 'ADMIN'}
            />
          )}

          <div className="card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Owner</p>
            <div className="mt-2 flex items-center gap-3">
              <Avatar name={study.owner.fullName} src={study.owner.avatarUrl} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{study.owner.fullName}</p>
                <p className="truncate text-xs text-slate-400">Uploaded {fmtDateTime(study.createdAt)}</p>
              </div>
            </div>
          </div>

          {(isOwner || myRole === 'ADMIN') && (
            <div className="card p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Shared with</p>
                <Users className="h-4 w-4 text-slate-300" />
              </div>
              {activeShares.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">Not shared with anyone.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {activeShares.map((s) => (
                    <li key={s.id} className="flex items-center gap-2.5">
                      <Avatar name={s.sharedWithDoctor.fullName} src={s.sharedWithDoctor.avatarUrl} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">Dr. {s.sharedWithDoctor.fullName}</p>
                        <p className="truncate text-xs text-slate-400">{s.sharedWithDoctor.specialization || 'Doctor'}</p>
                      </div>
                      {isOwner && (
                        <button
                          onClick={() => revoke(s.id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/40"
                          title="Revoke access"
                        >
                          <Ban className="h-4 w-4" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {myRole === 'DOCTOR' && (
            <div className="card p-5 text-sm text-slate-500">
              Shared with you by {study.owner.fullName}.
              {myShare?.message && <p className="mt-2 text-slate-600 dark:text-slate-300">“{myShare.message}”</p>}
              {myShare?.canDownload === false && (
                <Badge tone="amber" className="mt-2">
                  Download disabled
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      <Modal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title="Share this study"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShareOpen(false)}>
              Cancel
            </Button>
            <Button onClick={doShare} loading={busy}>
              Share
            </Button>
          </>
        }
      >
        {acceptedDoctors.length === 0 ? (
          <p className="text-sm text-slate-500">
            You need to connect with a doctor first.{' '}
            <Link to="/app/doctors" className="link">
              Find a doctor
            </Link>
          </p>
        ) : (
          <div className="space-y-4">
            <Field label="Doctor">
              <Select
                value={shareForm.doctorId}
                onChange={(e) => setShareForm((f) => ({ ...f, doctorId: e.target.value }))}
              >
                <option value="">— choose —</option>
                {acceptedDoctors.map((l) => (
                  <option key={l.doctor.id} value={l.doctor.id}>
                    Dr. {l.doctor.fullName} ({l.doctor.specialization || 'Doctor'})
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Message (optional)">
              <Textarea
                rows={3}
                value={shareForm.message}
                onChange={(e) => setShareForm((f) => ({ ...f, message: e.target.value }))}
                placeholder="Please take a look when you can…"
              />
            </Field>
          </div>
        )}
      </Modal>
    </div>
  );
}
