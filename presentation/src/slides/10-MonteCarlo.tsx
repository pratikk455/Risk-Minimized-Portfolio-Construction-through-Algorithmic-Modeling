"use client";

import { motion } from "framer-motion";
import type { SlideProps } from "@/components/slides";
import MonteCarloScatter from "@/components/charts/MonteCarloScatter";

export default function Slide10MonteCarlo({ step }: SlideProps) {
  return (
    <div className="grid w-full max-w-7xl grid-cols-[0.85fr_1.3fr] items-center gap-14">
      <div>
        <div className="mb-5 text-[11px] uppercase tracking-[0.3em] text-brand-amber/85">
          What could happen
        </div>
        <h2 className="font-display text-display font-semibold tracking-tight text-ink-50">
          Ten thousand{" "}
          <span className="text-gradient-warm">possible futures.</span>
        </h2>
        <p className="mt-5 text-lg text-ink-200/80">
          History tells you what did happen. Simulation tells you what could.
          I care about the disasters.
        </p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={step >= 1 ? { opacity: 1, y: 0 } : { opacity: 0.1, y: 16 }}
          transition={{ duration: 0.7 }}
          className="mt-10 space-y-4"
        >
          <div className="glass rounded-2xl p-5">
            <div className="font-display tabular text-5xl font-semibold text-gradient-warm">
              79.2%
            </div>
            <div className="mt-1 text-[15px] text-ink-100/85">
              of simulated portfolios beat the S&amp;P on Sharpe
            </div>
          </div>
          <div className="glass rounded-2xl p-5">
            <div className="font-display tabular text-5xl font-semibold text-gradient-cool">
              100%
            </div>
            <div className="mt-1 text-[15px] text-ink-100/85">
              had a smaller worst-case loss than the S&amp;P
            </div>
          </div>
        </motion.div>

        {step >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mt-8 text-[14px] text-ink-200/80"
          >
            <span className="text-ink-100/90">Blend:</span> 40% history · 60% simulation.
            <span className="ml-2 text-ink-300/70">Tested. Not guessed.</span>
          </motion.div>
        )}
      </div>

      <MonteCarloScatter step={step} />
    </div>
  );
}
