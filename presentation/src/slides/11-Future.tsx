"use client";

import { motion } from "framer-motion";
import type { SlideProps } from "@/components/slides";

const gaps = [
  {
    num: "01",
    title: "Risk that feels real",
    body:
      "Show feelings, not numbers. 'On your worst day, you could lose the price of a used car.' Something Sraddha can picture.",
    tint: "from-brand-indigo/30 to-brand-sky/10",
  },
  {
    num: "02",
    title: "More rigor",
    body:
      "More backtests across more crises: 2008, 2011, dot-com. Different simulation methods. Real markets aren't bell curves.",
    tint: "from-brand-mint/25 to-brand-indigo/10",
  },
  {
    num: "03",
    title: "Ten real users",
    body:
      "Real money comes later: licensing, regulation, reputation. First milestone: watch ten people use it and learn what I got wrong.",
    tint: "from-brand-peach/25 to-brand-amber/10",
  },
];

export default function Slide11Future({ step }: SlideProps) {
  return (
    <div className="flex w-full max-w-7xl flex-col">
      <div className="mb-4 text-[11px] uppercase tracking-[0.3em] text-brand-mint/80">
        What's next
      </div>
      <h2 className="font-display text-display font-semibold tracking-tight text-ink-50">
        Three honest gaps.
      </h2>
      <p className="mt-4 max-w-2xl text-xl text-ink-200/75">
        I'm proud of what I built. I'm also honest about what it isn't yet.
      </p>

      <div className="mt-14 grid grid-cols-3 gap-6">
        {gaps.map((g, i) => (
          <motion.div
            key={g.num}
            initial={{ opacity: 0, y: 24 }}
            animate={step >= i ? { opacity: 1, y: 0 } : { opacity: 0.15, y: 24 }}
            transition={{ duration: 0.6, delay: 0.1 * i, ease: [0.22, 1, 0.36, 1] }}
            className={`glass relative overflow-hidden rounded-3xl p-7 shadow-card`}
          >
            <div
              className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${g.tint} opacity-60`}
            />
            <div className="relative">
              <div className="font-display tabular text-5xl font-semibold text-ink-100/40">
                {g.num}
              </div>
              <div className="mt-6 font-display text-2xl font-semibold text-ink-50">
                {g.title}
              </div>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-200/85">{g.body}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
