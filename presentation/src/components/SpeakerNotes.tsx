"use client";

import { AnimatePresence, motion } from "framer-motion";

type Props = {
  open: boolean;
  notes: string[];
  slideTitle: string;
  slideNumber: number;
  total: number;
};

export default function SpeakerNotes({ open, notes, slideTitle, slideNumber, total }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-6 left-1/2 z-30 w-[min(720px,90vw)] -translate-x-1/2"
        >
          <div className="glass rounded-2xl px-6 py-5 shadow-card">
            <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.22em] text-ink-300/70">
              <span>Speaker Notes</span>
              <span className="tabular">
                {String(slideNumber).padStart(2, "0")} · {slideTitle}
              </span>
            </div>
            <ul className="space-y-1.5 text-[15px] leading-relaxed text-ink-100">
              {notes.map((n, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand-mint/80" />
                  <span>{n}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
