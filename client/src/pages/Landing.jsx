import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ShieldCheck,
  ScanLine,
  Share2,
  Stethoscope,
  Lock,
  Sparkles,
  UploadCloud,
  FileCheck2,
  CheckCircle2,
  Bell,
  Eye,
} from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';
import { ConfidenceGauge } from '../components/ConfidenceGauge.jsx';
import { DisclaimerBanner } from '../components/DisclaimerBanner.jsx';

const fade = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
};

function Reveal({ delay = 0, className, children }) {
  return (
    <motion.div {...fade} transition={{ ...fade.transition, delay }} className={className}>
      {children}
    </motion.div>
  );
}

export default function Landing() {
  return (
    <div className="overflow-hidden">
      {/* ---------------------------------------------------------------- Hero */}
      <section className="relative isolate">
        <AnimatedBackdrop />

        <div className="mx-auto max-w-6xl px-4 pb-20 pt-16 sm:pt-24">
          <Reveal className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200/60 bg-white/70 px-3.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm backdrop-blur dark:border-brand-900/50 dark:bg-slate-900/60 dark:text-slate-300">
              <Sparkles className="h-3.5 w-3.5 text-brand-500" />
              AI-assisted chest X-ray screening
              <span className="ml-1 hidden rounded-full bg-brand-600 px-1.5 py-0.5 text-[10px] font-semibold text-white sm:inline">
                DenseNet-169
              </span>
            </span>

            <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-slate-900 sm:text-6xl dark:text-white">
              Share chest X-rays
              <br className="hidden sm:block" /> with your doctor,{' '}
              <span className="relative whitespace-nowrap">
                <span className="bg-gradient-to-r from-brand-600 via-brand-500 to-teal-500 bg-clip-text text-transparent">
                  privately
                </span>
              </span>{' '}
              and{' '}
              <span className="bg-gradient-to-r from-teal-500 to-brand-600 bg-clip-text text-transparent">
                instantly
              </span>
              .
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">
              A secure space for patients and doctors to exchange X-rays and reports. Every chest
              X-ray also gets an automated first-look screening — flagging images that may need a
              closer look, so nothing sits unreviewed.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full shadow-lg shadow-brand-600/20 sm:w-auto">
                  Create your account <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  Sign in
                </Button>
              </Link>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              One-click demo accounts on the sign-in page — patient, doctor & admin.
            </p>
          </Reveal>

          {/* App preview */}
          <Reveal delay={0.15} className="relative mx-auto mt-16 max-w-4xl">
            <div className="absolute -inset-x-8 -top-8 bottom-0 -z-10 rounded-[2rem] bg-gradient-to-b from-brand-500/10 to-transparent blur-2xl" />
            <BrowserMock />
          </Reveal>

          {/* Trust / stats bar */}
          <Reveal delay={0.25} className="mx-auto mt-14 max-w-4xl">
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-slate-200/70 text-center dark:bg-slate-800/70 sm:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="bg-white px-4 py-5 dark:bg-slate-950">
                  <dt className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {s.value}
                  </dt>
                  <dd className="mt-1 text-xs text-slate-500 dark:text-slate-400">{s.label}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------------ How it works */}
      <section className="border-y bg-white py-20 dark:bg-slate-950">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">From upload to answer in three steps</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300">
              No training, no manual routing. The patient uploads; the doctor reviews.
            </p>
          </Reveal>

          <div className="relative mt-14 grid gap-8 sm:grid-cols-3">
            <div className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-800 sm:block" />
            {steps.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.1} className="relative text-center">
                <span className="relative z-10 mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-600 to-teal-500 text-white shadow-lg shadow-brand-600/25">
                  <s.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-base font-semibold">
                  {i + 1}. {s.title}
                </h3>
                <p className="mx-auto mt-1.5 max-w-xs text-sm text-slate-500 dark:text-slate-400">
                  {s.text}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------- Features */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight">A focused tool, done well</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300">
              Not another bloated portal. MIS handles the exchange of chest imaging between a
              patient and their doctor — and nothing else.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={(i % 3) * 0.06}>
                <div className="group h-full rounded-2xl border bg-white p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-card-lg dark:bg-slate-900">
                  <span className="inline-grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white dark:bg-brand-950 dark:text-brand-300">
                    <f.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
                  <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{f.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- AI explainer */}
      <section className="border-y bg-white py-20 dark:bg-slate-950">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-950 dark:text-brand-300">
              <ScanLine className="h-3.5 w-3.5" /> How the screening works
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight">
              A neural network, as a second pair of eyes
            </h2>
            <p className="mt-4 text-slate-600 dark:text-slate-300">
              An uploaded chest X-ray is passed through a CNN based on the DenseNet-169
              architecture — the approach described in peer-reviewed IEEE research on pneumonia
              detection. It returns one of two flags with a confidence score:
            </p>
            <ul className="mt-5 space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 rounded-md bg-amber-100 p-1 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                  <ScanLine className="h-3.5 w-3.5" />
                </span>
                <span>
                  <strong>Possible abnormality detected</strong> — patterns that can be associated
                  with pneumonia or other lung abnormalities are present.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 rounded-md bg-emerald-100 p-1 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <FileCheck2 className="h-3.5 w-3.5" />
                </span>
                <span>
                  <strong>No abnormality detected</strong> — no such patterns were found in the
                  image.
                </span>
              </li>
            </ul>
            <div className="mt-6">
              <DisclaimerBanner />
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="card overflow-hidden">
              <div className="border-b bg-slate-50 px-5 py-3 text-xs font-medium text-slate-500 dark:bg-slate-950">
                screening pipeline
              </div>
              <div className="space-y-4 p-6">
                {pipeline.map(([step, text], i) => (
                  <div key={step} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-600 text-xs font-semibold text-white">
                        {i + 1}
                      </span>
                      {i < pipeline.length - 1 && (
                        <span className="mt-1 h-full w-px flex-1 bg-slate-200 dark:bg-slate-800" />
                      )}
                    </div>
                    <div className="pb-2">
                      <p className="text-sm font-semibold">{step}</p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* -------------------------------------------------------------------- CTA */}
      <section className="relative isolate overflow-hidden py-24">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-600 via-brand-600 to-teal-600" />
        <div className="absolute inset-0 -z-10 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:22px_22px]" />
        <motion.div {...fade} className="mx-auto max-w-3xl px-4 text-center text-white">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to try it?</h2>
          <p className="mx-auto mt-4 max-w-xl text-brand-50/90">
            Create a patient or doctor account and walk through the full flow — upload, screen,
            connect, share, review — in a couple of minutes.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/register">
              <Button
                size="lg"
                className="!bg-white !text-brand-700 shadow-lg shadow-brand-900/20 hover:!bg-brand-50"
              >
                Get started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button
                size="lg"
                className="!bg-transparent !text-white ring-1 ring-inset ring-white/50 hover:!bg-white/10"
              >
                Explore a demo account
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}

/* --------------------------------------------------------------- decorations */

function AnimatedBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]">
        <div className="absolute inset-0 [background-image:linear-gradient(to_right,rgb(148_163_184/0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgb(148_163_184/0.12)_1px,transparent_1px)] [background-size:44px_44px]" />
      </div>
      <motion.div
        className="absolute -left-24 top-[-6rem] h-[26rem] w-[26rem] rounded-full bg-brand-400/30 blur-3xl dark:bg-brand-700/20"
        animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute right-[-8rem] top-[2rem] h-[24rem] w-[24rem] rounded-full bg-teal-400/25 blur-3xl dark:bg-teal-700/20"
        animate={{ x: [0, -50, 0], y: [0, 40, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

function BrowserMock() {
  return (
    <div className="rounded-2xl border bg-white/80 p-2 shadow-card-lg backdrop-blur dark:bg-slate-900/80">
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <div className="ml-3 flex-1 rounded-md bg-slate-100 px-3 py-1 text-[11px] text-slate-400 dark:bg-slate-800">
          mis.local/app/studies/chest-xray-02-sep
        </div>
      </div>

      <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950 sm:p-6">
        <div className="grid gap-4 md:grid-cols-[1.3fr_1fr]">
          {/* faux X-ray viewer */}
          <div className="relative overflow-hidden rounded-xl border border-white/10 bg-slate-900">
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-[11px] text-slate-400">
              <span>chest_xray_02.png</span>
              <Eye className="h-3.5 w-3.5" />
            </div>
            <div className="relative h-52 sm:h-60">
              <svg viewBox="0 0 200 200" className="h-full w-full opacity-80">
                <defs>
                  <radialGradient id="lg" cx="50%" cy="45%" r="60%">
                    <stop offset="0%" stopColor="#334155" />
                    <stop offset="100%" stopColor="#0f172a" />
                  </radialGradient>
                </defs>
                <rect width="200" height="200" fill="url(#lg)" />
                <g stroke="#94a3b8" strokeWidth="1.4" fill="none" opacity="0.5">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <path key={`l${i}`} d={`M96 ${46 + i * 22} q -40 8 -60 34`} />
                  ))}
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <path key={`r${i}`} d={`M104 ${46 + i * 22} q 40 8 60 34`} />
                  ))}
                  <path d="M100 30 V180" strokeWidth="6" opacity="0.7" />
                </g>
                <circle cx="132" cy="120" r="17" fill="#e2e8f0" opacity="0.22" />
              </svg>
              <motion.div
                className="absolute inset-x-0 h-16 bg-gradient-to-b from-brand-400/0 via-brand-400/30 to-brand-400/0"
                animate={{ y: ['-20%', '260%'] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
          </div>

          {/* AI result card */}
          <div className="flex flex-col gap-3 rounded-xl border bg-white p-4 dark:bg-slate-900">
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-brand-600 text-white">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                AI screening
              </span>
            </div>
            <div className="flex items-center justify-center py-1">
              <ConfidenceGauge value={0.91} prediction="ABNORMAL" size={128} />
            </div>
            <span className="mx-auto inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              <ScanLine className="h-3.5 w-3.5" /> Possible abnormality detected
            </span>
            <div className="mt-1 space-y-1.5 border-t pt-3 text-[11px] text-slate-500 dark:text-slate-400">
              <p className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Shared with Dr. Meera
                Krishnan
              </p>
              <p className="flex items-center gap-1.5">
                <Bell className="h-3.5 w-3.5 text-brand-500" /> Doctor notified · awaiting review
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- data */

const stats = [
  { value: '5,800+', label: 'X-ray images the model learns from' },
  { value: 'DenseNet-169', label: 'CNN architecture (IEEE 2019)' },
  { value: '< 1s', label: 'typical screening time' },
  { value: '3 roles', label: 'patient · doctor · admin' },
];

const steps = [
  { icon: UploadCloud, title: 'Upload', text: 'The patient adds a chest X-ray or report — JPG, PNG or PDF.' },
  { icon: ScanLine, title: 'Screen', text: 'The CNN returns a first-look flag and a confidence score, instantly.' },
  { icon: Stethoscope, title: 'Review', text: 'The connected doctor opens the image and writes back appointment notes.' },
];

const pipeline = [
  ['Pre-process', 'Resize to 224×224 and normalise for the network.'],
  ['Feature extraction', 'DenseNet-169 turns the image into a rich feature vector.'],
  ['Classification', 'A classifier maps features to normal vs. abnormal.'],
  ['Result', 'A flag plus a confidence score is stored with the study.'],
];

const features = [
  { icon: Lock, title: 'Private by default', text: 'A study is visible only to its owner and the doctors they explicitly share it with.' },
  { icon: Share2, title: 'Deliberate sharing', text: 'Connect with a doctor, then share individual studies. Revoke access at any time.' },
  { icon: ScanLine, title: 'AI first-look', text: 'Every chest X-ray is screened automatically so nothing sits unreviewed.' },
  { icon: Stethoscope, title: 'Doctor workspace', text: 'Doctors see shared studies, open a full-screen viewer, and write appointment notes.' },
  { icon: ShieldCheck, title: 'Verified doctors', text: 'Doctor accounts are checked by an administrator before patients can find them.' },
  { icon: FileCheck2, title: 'Full history', text: 'Uploads, screenings, shares and notes are all kept in one timeline.' },
];
