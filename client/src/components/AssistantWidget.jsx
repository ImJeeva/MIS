import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, Send, X, Sparkles } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { cn } from '../lib/cn.js';

/**
 * Static, rule-based help assistant. No backend, no LLM — it keyword-matches the
 * question against a small knowledge base about how to use MIS. Purely a guide;
 * it never gives medical advice.
 */

const KB = [
  {
    tags: ['hi', 'hello', 'hey', 'help', 'start'],
    a: 'Hi! I can explain how MIS works — uploading X-rays, connecting with a doctor, sharing studies, and what the screening result means. What would you like to know?',
  },
  {
    tags: ['upload', 'add', 'x-ray', 'xray', 'image', 'scan'],
    a: 'To upload: go to **Upload X-ray** in the sidebar, drag in a JPG/PNG/WEBP/PDF (up to 15 MB), give it a title, and submit. If it is a chest X-ray, the AI screening runs automatically and the result appears right away.',
  },
  {
    tags: ['share', 'send', 'give access'],
    a: 'To share a study: open it from **My studies**, click **Share**, and pick a doctor you are connected to. You can add a message and revoke access any time from the same screen.',
  },
  {
    tags: ['connect', 'doctor', 'find', 'link', 'request'],
    a: 'Go to **My doctors**, search for a verified doctor, and click **Connect**. Once they accept, you can share studies with them.',
  },
  {
    tags: ['flag', 'flagged', 'abnormal', 'abnormality', 'positive', 'pneumonia'],
    a: '**"Possible abnormality detected"** means the model saw patterns that can be associated with pneumonia or other lung abnormalities. It does **not** confirm any condition — your doctor reviews the image and decides.',
  },
  {
    tags: ['clear', 'normal', 'negative', 'no abnormality'],
    a: '**"No abnormality detected"** means the model did not find those patterns in the image. It is still not a substitute for a doctor’s review.',
  },
  {
    tags: ['confidence', 'percent', 'score', '%', 'accurate', 'accuracy', 'reliable'],
    a: 'The percentage is the model’s confidence in the flag it gave — not a probability of disease. The screening is a first-look aid; a qualified doctor always makes the final call.',
  },
  {
    tags: ['diagnosis', 'diagnose', 'medical advice', 'is it safe', 'trust', 'doctor replace'],
    a: 'MIS does **not** diagnose. The AI is a screening aid that helps make sure no image sits unreviewed. Every X-ray is still read by a doctor, who makes the clinical decision.',
  },
  {
    tags: ['model', 'cnn', 'how does the ai', 'densenet', 'trained', 'algorithm'],
    a: 'The screening uses a convolutional neural network based on the DenseNet-169 architecture, following peer-reviewed IEEE research on pneumonia detection. It classifies a chest X-ray as normal or abnormal and returns a confidence score.',
  },
  {
    tags: ['notification', 'alert', 'bell'],
    a: 'The bell in the top bar shows updates — a new screening result, a study shared with you, a connection request, or a new appointment note. Open **Notifications** to see them all.',
  },
  {
    tags: ['note', 'appointment', 'comment'],
    a: 'Doctors write appointment notes from a patient’s page. Patients see them under **Appointment notes**, linked to the relevant study.',
  },
  {
    tags: ['verify', 'verified', 'pending', 'approve'],
    a: 'New doctor accounts start unverified. An administrator checks them before patients can find or connect with them.',
  },
  {
    tags: ['delete', 'remove'],
    a: 'The owner of a study can delete it from the study’s page. This removes the file and its screening result permanently.',
  },
  {
    tags: ['password', 'account', 'profile', 'photo', 'avatar'],
    a: 'Update your name, photo and details under **My profile**. Password reset is not part of this demo build.',
  },
  {
    tags: ['private', 'privacy', 'who can see', 'secure'],
    a: 'A study is visible only to you, any doctor you have actively shared it with, and administrators. Revoking a share cuts off access immediately.',
  },
];

const FALLBACK =
  'I can help with uploading, sharing, connecting with a doctor, notifications, and what the screening result means. Try one of the suggestions below.';

const SUGGESTIONS = [
  'How do I upload an X-ray?',
  'What does "flagged" mean?',
  'How do I share with my doctor?',
  'Is this a diagnosis?',
];

function answer(text) {
  const q = text.toLowerCase();
  let best = null;
  let bestScore = 0;
  for (const item of KB) {
    const score = item.tags.reduce((s, t) => (q.includes(t) ? s + t.length : s), 0);
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }
  return best ? best.a : FALLBACK;
}

function Bubble({ from, children }) {
  const me = from === 'me';
  return (
    <div className={cn('flex', me ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed',
          me
            ? 'bg-brand-600 text-white'
            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
        )}
        dangerouslySetInnerHTML={{ __html: renderMd(children) }}
      />
    </div>
  );
}

// tiny **bold** renderer, escaped
function renderMd(s) {
  const esc = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return esc.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

export function AssistantWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState([
    {
      from: 'bot',
      text: `Hi ${user?.fullName?.split(' ')[0] || 'there'} — I’m the MIS assistant. Ask me how anything here works.`,
    },
  ]);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, typing, open]);

  const send = (text) => {
    const clean = text.trim();
    if (!clean) return;
    setMsgs((m) => [...m, { from: 'me', text: clean }]);
    setInput('');
    setTyping(true);
    const reply = answer(clean);
    setTimeout(() => {
      setTyping(false);
      setMsgs((m) => [...m, { from: 'bot', text: reply }]);
    }, 550 + Math.min(900, reply.length * 6));
  };

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'fixed bottom-5 right-5 z-40 flex h-13 w-13 items-center justify-center rounded-full bg-brand-600 text-white shadow-card-lg transition hover:bg-brand-700',
          open && 'rotate-90'
        )}
        style={{ height: 52, width: 52 }}
        aria-label={open ? 'Close help assistant' : 'Open help assistant'}
      >
        {open ? <X className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="fixed bottom-24 right-5 z-40 flex h-[30rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border bg-white shadow-card-lg dark:bg-slate-900"
          >
            <div className="flex items-center gap-2.5 border-b bg-gradient-to-r from-brand-600 to-teal-500 px-4 py-3 text-white">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/20">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold">MIS Assistant</p>
                <p className="text-[11px] text-white/80">Guides you around the app · not medical advice</p>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-2.5 overflow-y-auto p-4">
              {msgs.map((m, i) => (
                <Bubble key={i} from={m.from === 'me' ? 'me' : 'bot'}>
                  {m.text}
                </Bubble>
              ))}
              {typing && (
                <div className="flex justify-start">
                  <div className="flex gap-1 rounded-2xl bg-slate-100 px-3.5 py-3 dark:bg-slate-800">
                    {[0, 1, 2].map((d) => (
                      <span
                        key={d}
                        className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"
                        style={{ animationDelay: `${d * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {msgs.length <= 1 && !typing && (
                <div className="space-y-1.5 pt-1">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="block w-full rounded-lg border border-dashed px-3 py-1.5 text-left text-xs text-slate-600 transition hover:border-brand-400 hover:bg-brand-50 dark:text-slate-300 dark:hover:bg-brand-950/40"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2 border-t p-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about the app…"
                className="input-base h-9 flex-1 rounded-lg py-1.5 text-[13px]"
              />
              <button
                type="submit"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
                disabled={!input.trim()}
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
