"use client";

import { motion } from "framer-motion";
import type { SlideProps } from "@/components/slides";
import BacktestLine from "@/components/charts/BacktestLine";

export default function Slide09Backtest({ step }: SlideProps) {
  return (
    <div className="grid w-full max-w-7xl grid-cols-[1fr_1.4fr] items-center gap-14">
      <div>
        <div className="mb-5 text-[11px] uppercase tracking-[0.3em] text-brand-mint/85">
          Does it actually work?
        </div>
        <h2 className="font-display text-display font-semibold tracking-tight text-ink-50">
          I sent the model{" "}
          <span className="text-gradient-cool">back in time.</span>
        </h2>
        <p className="mt-5 text-lg text-ink-200/80">
          Six years. Two crashes. Real prices. No future knowledge.
        </p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={step >= 1 ? { opacity: 1, y: 0 } : { opacity: 0.1, y: 16 }}
          transition={{ duration: 0.7 }}
          className="mt-10 grid grid-cols-2 gap-4"
        >
          <div className="glass rounded-2xl p-5">
            <div className="text-[10px] uppercase tracking-[0.22em] text-ink-300/70">
              Worst drawdown
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display tabular text-4xl font-semibold text-gradient-cool">
                −26.5%
              </span>
            </div>
            <div className="mt-1 text-[12px] text-ink-300/70 tabular">
              vs S&amp;P 500 −33.7%
            </div>
          </div>
          <div className="glass rounded-2xl p-5">
            <div className="text-[10px] uppercase tracking-[0.22em] text-ink-300/70">
              Sharpe ratio
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display tabular text-4xl font-semibold text-gradient-cool">
                0.97
              </span>
            </div>
            <div className="mt-1 text-[12px] text-ink-300/70 tabular">vs S&amp;P 500 0.93</div>
          </div>
        </motion.div>

        {step >= 2 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="mt-8 max-w-md font-serif text-xl italic text-ink-100/85"
          >
            That's how I earned the right to put a number in front of a user.
          </motion.p>
        )}
      </div>

      <BacktestLine step={step} />
    </div>
  );
}
