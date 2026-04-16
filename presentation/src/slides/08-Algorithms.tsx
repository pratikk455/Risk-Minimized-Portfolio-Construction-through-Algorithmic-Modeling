"use client";

import { motion } from "framer-motion";
import type { SlideProps } from "@/components/slides";
import AllocationBars from "@/components/charts/AllocationBars";

export default function Slide08Algorithms({ step }: SlideProps) {
  return (
    <div className="flex w-full max-w-7xl flex-col">
      <div className="mb-4 text-[11px] uppercase tracking-[0.3em] text-brand-mint/80">
        How the portfolio is built
      </div>
      <h2 className="font-display text-display font-semibold tracking-tight text-ink-50">
        Two flawed methods.{" "}
        <span className="text-gradient">So I use both.</span>
      </h2>

      <div className="mt-6 grid grid-cols-[1fr_1fr_auto] gap-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={step >= 1 ? { opacity: 1, y: 0 } : { opacity: 0.15, y: 20 }}
          transition={{ duration: 0.6 }}
          className="glass rounded-2xl p-5"
        >
          <div className="flex items-baseline justify-between">
            <div className="font-display text-xl font-semibold text-ink-50">Markowitz</div>
            <div className="text-xs uppercase tracking-[0.18em] text-ink-300/60">1952</div>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-200/85">
            Nobel Prize math. The mathematically perfect mix, if history repeats exactly.{" "}
            <span className="text-ink-50">Precise, but fragile.</span>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={step >= 2 ? { opacity: 1, y: 0 } : { opacity: 0.15, y: 20 }}
          transition={{ duration: 0.6 }}
          className="glass rounded-2xl p-5"
        >
          <div className="flex items-baseline justify-between">
            <div className="font-display text-xl font-semibold text-ink-50">HRP</div>
            <div className="text-xs uppercase tracking-[0.18em] text-ink-300/60">2016</div>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-200/85">
            Groups similar stocks and spreads money across groups.{" "}
            <span className="text-ink-50">Stable, humble.</span>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={step >= 3 ? { opacity: 1, y: 0 } : { opacity: 0.15, y: 20 }}
          transition={{ duration: 0.6 }}
          className="glass flex flex-col justify-center rounded-2xl bg-gradient-to-br from-brand-indigo/25 to-brand-mint/15 px-6 py-5"
        >
          <div className="text-[10px] uppercase tracking-[0.2em] text-ink-300/80">Blended</div>
          <div className="mt-0.5 font-display text-xl font-semibold text-gradient">Hybrid</div>
          <div className="mt-2 font-display tabular text-3xl font-semibold text-ink-50">
            40<span className="text-ink-300/60 text-xl">%</span>{" "}
            <span className="text-ink-300/60 text-lg">+</span> 60
            <span className="text-ink-300/60 text-xl">%</span>
          </div>
          <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-ink-300/80">
            HRP · Markowitz
          </div>
        </motion.div>
      </div>

      <div className="mt-6">
        <AllocationBars step={step} />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={step >= 3 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mt-5 font-serif text-lg italic text-ink-100/85"
      >
        Markowitz gives the textbook answer. HRP gives the answer that survives Monday morning.
      </motion.div>
    </div>
  );
}
