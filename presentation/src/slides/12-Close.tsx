"use client";

import { motion } from "framer-motion";
import type { SlideProps } from "@/components/slides";

const lessons = [
  {
    label: "Technically",
    body: "You can't trust any single model. Blending beats perfection. Every time.",
  },
  {
    label: "Personally",
    body:
      "The scariest number in investing, your worst day, turns out to be the most useful one.",
  },
  {
    label: "And about my path",
    body:
      "I started wanting to build an app. I ended up building something my 12-year-old self would've shown his friends.",
  },
];

export default function Slide12Close({ step }: SlideProps) {
  return (
    <div className="flex w-full max-w-7xl flex-col">
      <div className="mb-6 text-[11px] uppercase tracking-[0.3em] text-brand-mint/80">
        What I learned
      </div>

      <div className="space-y-8">
        {lessons.map((l, i) => (
          <motion.div
            key={l.label}
            initial={{ opacity: 0, x: -16 }}
            animate={step >= i ? { opacity: 1, x: 0 } : { opacity: 0.1, x: -16 }}
            transition={{ duration: 0.7, delay: 0.05 * i, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="text-[11px] uppercase tracking-[0.28em] text-ink-300/70">
              {l.label}
            </div>
            <p className="mt-2 font-display text-headline font-medium text-ink-50">{l.body}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
