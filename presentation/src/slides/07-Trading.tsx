"use client";

import AppFrame from "@/components/AppFrame";
import type { SlideProps } from "@/components/slides";

export default function Slide07Trading(_: SlideProps) {
  return (
    <div className="grid w-full max-w-7xl grid-cols-[1fr_1.8fr] items-center gap-12">
      <div>
        <div className="mb-4 text-[11px] uppercase tracking-[0.3em] text-brand-mint/85">
          Step 03
        </div>
        <h2 className="font-display text-display font-semibold tracking-tight text-ink-50">
          One click to{" "}
          <span className="text-gradient-warm">act.</span>
        </h2>
        <p className="mt-5 text-lg text-ink-200/80">
          The gap between knowing what to invest in and actually investing.
          That's where most beginners give up.
        </p>
        <p className="mt-6 max-w-md font-serif text-xl italic text-ink-100/85">
          Most apps stop at advice. Mine lets her act.
        </p>
      </div>

      <AppFrame src="http://localhost:3000/trading" label="/trading" />
    </div>
  );
}
