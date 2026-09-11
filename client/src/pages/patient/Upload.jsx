import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { ScanLine, ArrowRight, Loader2 } from 'lucide-react';
import { api, apiError } from '../../lib/api.js';
import { useInvalidate } from '../../lib/queries.js';
import { PageHeader } from '../../components/ui/misc.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Field, Input, Select, Textarea } from '../../components/ui/Field.jsx';
import { FileDropzone } from '../../components/FileDropzone.jsx';
import { AiResultCard } from '../../components/AiResultCard.jsx';
import { DisclaimerBanner } from '../../components/DisclaimerBanner.jsx';

export default function Upload() {
  const nav = useNavigate();
  const invalidate = useInvalidate();
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({ title: '', type: 'XRAY', bodyPart: 'Chest', notes: '' });
  const [phase, setPhase] = useState('form'); // form | uploading | result
  const [result, setResult] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Choose a file first');
    if (!form.title.trim()) return toast.error('Give this study a title');

    setPhase('uploading');
    const fd = new FormData();
    fd.append('file', file);
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));

    try {
      const { data } = await api.post('/studies', fd);
      setResult(data);
      setPhase('result');
      invalidate('studies', 'notifications', ['admin', 'stats']);
    } catch (err) {
      toast.error(apiError(err, 'Upload failed'));
      setPhase('form');
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Upload an X-ray or report" description="Chest X-rays are screened automatically after upload." />

      <AnimatePresence mode="wait">
        {phase !== 'result' ? (
          <motion.form
            key="form"
            onSubmit={submit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-5"
          >
            <FileDropzone file={file} onFile={setFile} />

            <div className="card space-y-4 p-5">
              <Field label="Title">
                <Input placeholder="Chest X-ray — 3 Sep" value={form.title} onChange={set('title')} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Type">
                  <Select value={form.type} onChange={set('type')}>
                    <option value="XRAY">Chest X-ray</option>
                    <option value="REPORT">Report / document</option>
                  </Select>
                </Field>
                <Field label="Body part">
                  <Input value={form.bodyPart} onChange={set('bodyPart')} />
                </Field>
              </div>
              <Field label="Notes (optional)">
                <Textarea
                  rows={3}
                  placeholder="Anything your doctor should know about this image…"
                  value={form.notes}
                  onChange={set('notes')}
                />
              </Field>
            </div>

            {form.type === 'XRAY' && (
              <div className="flex items-center gap-2 rounded-xl bg-brand-50 px-3.5 py-3 text-sm text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                <ScanLine className="h-4 w-4 shrink-0" />
                This X-ray will be screened by the AI model right after upload.
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" loading={phase === 'uploading'}>
              {phase === 'uploading' ? 'Uploading & screening…' : 'Upload'}
            </Button>
          </motion.form>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            {result?.aiResult ? (
              <AiResultCard ai={result.aiResult} />
            ) : (
              <div className="card p-6">
                <p className="text-sm font-semibold">Uploaded</p>
                <p className="mt-1 text-sm text-slate-500">
                  This file was saved. {result?.study?.type === 'REPORT' && 'Reports are not screened.'}
                </p>
              </div>
            )}
            <div className="flex gap-3">
              <Button className="flex-1" onClick={() => nav(`/app/studies/${result.study.id}`)}>
                Open study <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setFile(null);
                  setForm({ title: '', type: 'XRAY', bodyPart: 'Chest', notes: '' });
                  setResult(null);
                  setPhase('form');
                }}
              >
                Upload another
              </Button>
            </div>
            <DisclaimerBanner compact />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
