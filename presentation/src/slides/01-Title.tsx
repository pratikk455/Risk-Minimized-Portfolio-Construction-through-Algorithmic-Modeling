"use client";

import { motion } from "framer-motion";
import type { SlideProps } from "@/components/slides";

export default function Slide01Title(_: SlideProps) {
  return (
    <div className="flex w-full max-w-7xl flex-col items-center text-center">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="mb-8 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[11px] uppercase tracking-[0.28em] text-ink-200/80"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-brand-mint" />
        A childhood dream · Supported by Furman Fellows
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="font-display text-mega font-semibold tracking-tight"
      >
        <span className="text-gradient">Hedgewise</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="mt-5 font-display text-3xl font-light tracking-tight text-ink-100/85"
      >
        Risk Minimized Portfolio Construction through Algorithmic Modeling
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.1 }}
        className="mt-14 flex items-center gap-4 text-sm text-ink-300/70"
      >
        <span className="font-display text-base text-ink-100/90">Pratik Shrestha</span>
        <span className="h-1 w-1 rounded-full bg-ink-300/40" />
        <span className="uppercase tracking-[0.25em]">Spring 2026</span>
      </motion.div>
    </div>
  );
}
