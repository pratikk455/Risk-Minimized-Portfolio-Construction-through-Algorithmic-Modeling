"use client";

import AppFrame from "@/components/AppFrame";
import type { SlideProps } from "@/components/slides";

export default function Slide06Portfolio(_: SlideProps) {
  return (
    <div className="grid w-full max-w-7xl grid-cols-[1.8fr_1fr] items-center gap-12">
      <AppFrame src="http://localhost:3000/portfolio" label="/portfolio" />

      <div>
        <div className="mb-4 text-[11px] uppercase tracking-[0.3em] text-brand-mint/85">
          Step 02
        </div>
        <h2 className="font-display text-display font-semibold tracking-tight text-ink-50">
          A real mix.
          <br />
          <span className="text-gradient">Built for her.</span>
        </h2>
        <p className="mt-5 text-lg text-ink-200/80">
          Stocks, bonds, sectors. Spread{" "}
          <span className="text-ink-100">deliberately</span> away from the Mag Seven trap.
        </p>
        <p className="mt-6 text-[15px] text-ink-200/75">
          When one of those companies has a bad quarter, her whole future doesn't move with it.
        </p>
      </div>
    </div>
  );
}
