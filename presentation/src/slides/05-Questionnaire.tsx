"use client";

import AppFrame from "@/components/AppFrame";
import type { SlideProps } from "@/components/slides";

export default function Slide05Questionnaire(_: SlideProps) {
  return (
    <div className="grid w-full max-w-7xl grid-cols-[1fr_1.8fr] items-center gap-12">
      <div>
        <div className="mb-4 text-[11px] uppercase tracking-[0.3em] text-brand-mint/85">
          Step 01
        </div>
        <h2 className="font-display text-display font-semibold tracking-tight text-ink-50">
          The app gets to{" "}
          <span className="text-gradient">know her.</span>
        </h2>
        <p className="mt-5 text-lg text-ink-200/80">
          Not the market. <span className="text-ink-100">Her.</span>
        </p>
        <ul className="mt-8 space-y-3 text-[15px] text-ink-200/80">
          <li className="flex gap-3">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand-mint" />
            How old are you? When do you need this money?
          </li>
          <li className="flex gap-3">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand-mint" />
            If the market dropped 30%, would you sell, hold, or buy?
          </li>
          <li className="flex gap-3">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand-mint" />
            Goals, timeline, stomach.
          </li>
        </ul>
        <p className="mt-8 max-w-md font-serif text-xl italic text-ink-100/85">
          Your risk isn't about the market. It's about you.
        </p>
      </div>

      <AppFrame
        src="http://localhost:3000/assessment"
        label="/assessment"
      />
    </div>
  );
}
