"use client";

import { motion } from "framer-motion";
import type { SlideProps } from "@/components/slides";

const lines = [
  {
    text: "I grew up with not a lot.",
    sub: "My parents worked hard. We were happy. Money was tight. Or so I thought.",
  },
  {
    text: "Then somewhere in middle school, things got… comfortable.",
    sub: "I was convinced my parents had been secretly rich the whole time, and were just making us eat lentils to build character.",
  },
  {
    text: "At 12, my mom taught me to invest.",
    sub: "Dinner stopped being 'how was school.' It became: Did you see what the Fed did today?",
  },
  {
    text: "My friends thought I was speaking Klingon.",
    sub: "But they weren't uninterested. They were scared.",
  },
  {
    text: "The people who need investing the most,",
    sub: "are the ones most afraid to try.",
    big: true,
  },
];

export default function Slide02Hook({ step }: SlideProps) {
  const visible = Math.min(step, lines.length - 1);

  return (
    <div className="flex w-full max-w-7xl flex-col items-start">
      <div className="mb-6 text-[11px] uppercase tracking-[0.3em] text-brand-mint/80">
        The hook
      </div>
      <div className="space-y-5">
        {lines.slice(0, visible + 1).map((l, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2
              className={
                l.big
                  ? "font-display font-semibold text-display text-gradient-warm"
                  : "font-display font-medium text-headline text-ink-50"
              }
            >
              {l.text}
            </h2>
            <p
              className={
                l.big
                  ? "mt-2 font-serif text-xl italic text-ink-100/90"
                  : "mt-1 text-base text-ink-200/75"
              }
            >
              {l.sub}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
