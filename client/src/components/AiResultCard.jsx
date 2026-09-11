import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Clock, XCircle, RefreshCw, Cpu } from 'lucide-react';
import { ConfidenceGauge } from './ConfidenceGauge.jsx';
import { DisclaimerBanner } from './DisclaimerBanner.jsx';
import { Button } from './ui/Button.jsx';
import { Badge } from './ui/Badge.jsx';
import { fmtDateTime } from '../lib/format.js';

export function AiResultCard({ ai, onRerun, rerunning, canRerun }) {
  if (!ai || ai.status === 'PENDING') {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-3 text-slate-500">
          <Clock className="h-5 w-5 animate-pulse" />
          <p className="text-sm">Screening in progress…</p>
        </div>
      </div>
    );
  }

  if (ai.status === 'FAILED') {
    return (
      <div className="card p-6">
        <div className="flex items-start gap-3">
          <XCircle className="mt-0.5 h-5 w-5 text-slate-400" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Screening unavailable
            </p>
            <p className="mt-1 text-sm text-slate-500">
              The screening service could not analyse this image. The X-ray is still saved and
              your doctor can review it directly.
            </p>
            {canRerun && (
              <Button size="sm" variant="secondary" className="mt-3" onClick={onRerun} loading={rerunning}>
                <RefreshCw className="h-3.5 w-3.5" /> Try again
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const abnormal = ai.prediction === 'ABNORMAL';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="card overflow-hidden"
    >
      <div
        className={
          abnormal
            ? 'border-b border-amber-200 bg-amber-50 px-6 py-4 dark:border-amber-900/50 dark:bg-amber-950/40'
            : 'border-b border-emerald-200 bg-emerald-50 px-6 py-4 dark:border-emerald-900/50 dark:bg-emerald-950/40'
        }
      >
        <div className="flex items-center gap-2.5">
          {abnormal ? (
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          )}
          <span
            className={
              abnormal
                ? 'text-sm font-semibold text-amber-800 dark:text-amber-200'
                : 'text-sm font-semibold text-emerald-800 dark:text-emerald-200'
            }
          >
            {ai.label}
          </span>
        </div>
      </div>

      <div className="space-y-5 p-6">
        <div className="flex justify-center">
          <ConfidenceGauge value={ai.confidence ?? 0} prediction={ai.prediction} />
        </div>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <Badge tone="slate">
              <Cpu className="h-3 w-3" /> {ai.modelName}
            </Badge>
            <Badge tone={ai.modelVersion === 'uncalibrated' ? 'amber' : 'brand'}>
              {ai.modelVersion === 'uncalibrated' ? 'demo model' : `v${ai.modelVersion}`}
            </Badge>
            {ai.inferenceMs != null && <span>· {ai.inferenceMs} ms</span>}
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {abnormal
              ? 'The model flagged patterns that can be associated with lung abnormalities such as pneumonia. This does not confirm any condition.'
              : 'The model did not detect patterns commonly associated with lung abnormalities in this image.'}
          </p>
          <p className="text-xs text-slate-400">Screened {fmtDateTime(ai.updatedAt || ai.createdAt)}</p>
          {canRerun && (
            <Button size="sm" variant="secondary" onClick={onRerun} loading={rerunning}>
              <RefreshCw className="h-3.5 w-3.5" /> Re-run screening
            </Button>
          )}
        </div>
      </div>

      <div className="px-6 pb-6">
        <DisclaimerBanner />
      </div>
    </motion.div>
  );
}
