import { motion } from 'framer-motion';

/**
 * Radial gauge showing model confidence. Colour follows the prediction:
 * amber for ABNORMAL (a screening flag, not an alarm), emerald for NORMAL.
 */
export function ConfidenceGauge({ value = 0, prediction = 'NORMAL', size = 168 }) {
  const pct = Math.round(value * 100);
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - value);
  const color = prediction === 'ABNORMAL' ? '#d97706' : '#059669';
  const track = prediction === 'ABNORMAL' ? '#fef3c7' : '#d1fae5';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} className="dark:opacity-20" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <motion.span
          className="text-3xl font-bold tabular-nums text-slate-900 dark:text-white"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {pct}%
        </motion.span>
        <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
          confidence
        </span>
      </div>
    </div>
  );
}
