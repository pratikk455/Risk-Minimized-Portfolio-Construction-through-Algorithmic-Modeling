"use client";

import { motion } from "framer-motion";
import type { SlideProps } from "@/components/slides";

export default function Slide04Sarah({ step }: SlideProps) {
  return (
    <div className="flex w-full max-w-7xl items-center gap-16">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex-shrink-0"
      >
        <div className="relative h-72 w-72 overflow-hidden rounded-[36px] glass shadow-card">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-indigo/30 via-transparent to-brand-mint/20" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-display text-[8rem] font-semibold text-gradient">S</span>
          </div>
          <div className="absolute left-5 top-5 h-2 w-2 rounded-full bg-brand-mint shadow-[0_0_12px_rgba(0,212,168,0.8)]" />
        </div>
      </motion.div>

      <div className="flex flex-col">
        <div className="mb-4 text-[11px] uppercase tracking-[0.3em] text-brand-mint/80">
          Meet the user
        </div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="font-display text-huge font-semibold tracking-tight text-ink-50"
        >
          Sraddha.
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mt-8 space-y-4 text-xl text-ink-100/90"
        >
          <div className="flex items-baseline gap-3">
            <span className="w-20 text-sm uppercase tracking-[0.2em] text-ink-300/70">Age</span>
            <span className="font-display tabular text-3xl">23</span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="w-20 text-sm uppercase tracking-[0.2em] text-ink-300/70">Saved</span>
            <span className="font-display tabular text-3xl">$5,000</span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="w-20 text-sm uppercase tracking-[0.2em] text-ink-300/70">Feels</span>
            <span className="font-serif text-3xl italic text-gradient-warm">Scared.</span>
          </div>
        </motion.div>

        {step >= 1 && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mt-10 max-w-lg text-xl text-ink-200/80"
          >
            Let me walk you through what happens when she opens the app.
          </motion.p>
        )}
      </div>
    </div>
  );
}
