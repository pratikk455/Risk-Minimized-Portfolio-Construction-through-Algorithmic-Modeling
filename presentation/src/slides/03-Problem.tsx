"use client";

import { motion } from "framer-motion";
import type { SlideProps } from "@/components/slides";
import MagSevenDonut from "@/components/charts/MagSevenDonut";

// SPY ETF holdings as of April 14, 2026 (source: stockanalysis.com).
// Alphabet is the sum of GOOGL (Class A, 3.25%) + GOOG (Class C, 2.59%).
const magSeven = [
  { name: "Nvidia", weight: 8.0 },
  { name: "Apple", weight: 6.37 },
  { name: "Alphabet", weight: 5.84 },
  { name: "Microsoft", weight: 4.89 },
  { name: "Amazon", weight: 4.07 },
  { name: "Meta", weight: 2.43 },
  { name: "Tesla", weight: 1.72 },
];

export default function Slide03Problem({ step }: SlideProps) {
  const totalMagSeven = magSeven.reduce((a, b) => a + b.weight, 0);

  return (
    <div className="grid w-full max-w-7xl grid-cols-[1.1fr_1fr] items-center gap-14">
      <div>
        <div className="mb-5 text-[11px] uppercase tracking-[0.3em] text-brand-peach/85">
          The problem
        </div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="font-display text-display font-semibold tracking-tight text-ink-50"
        >
          Everyone says{" "}
          <span className="text-gradient-warm">buy the S&amp;P 500.</span>
          <br />
          <span className="text-ink-200/80">It's safe. It's diversified.</span>
        </motion.h2>

        {step >= 1 && (
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mt-8 text-xl text-ink-100/85"
          >
            But look at it closely.
          </motion.p>
        )}

        {step >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mt-4"
          >
            <div className="font-display text-huge font-semibold leading-none text-gradient-warm tabular">
              {totalMagSeven.toFixed(1)}%
            </div>
            <div className="mt-2 text-lg text-ink-100/90">
              of the S&amp;P 500 is{" "}
              <span className="font-semibold text-ink-50">just seven companies.</span>
            </div>
          </motion.div>
        )}

        {step >= 3 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="mt-8 max-w-lg font-serif text-2xl italic text-ink-100/90"
          >
            Not diversification. Concentration, dressed up as safety.
          </motion.p>
        )}
      </div>

      <div className="flex flex-col items-center justify-center gap-12">
        <MagSevenDonut data={magSeven} step={step} />
        <div className="text-[10px] uppercase tracking-[0.22em] text-ink-300/55">
          SPY holdings · Apr 14, 2026 · stockanalysis.com
        </div>
      </div>
    </div>
  );
}
