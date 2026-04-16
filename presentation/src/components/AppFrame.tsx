"use client";

import { motion } from "framer-motion";

type Props = {
  src: string;
  label: string;
  caption?: string;
};

export default function AppFrame({ src, label, caption }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="glass relative w-full overflow-hidden rounded-[26px] shadow-card"
    >
      {/* Top bar — looks like a browser */}
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-brand-peach/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-brand-amber/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-brand-mint/70" />
        </div>
        <div className="rounded-full bg-white/5 px-4 py-1 text-[11px] tracking-[0.05em] text-ink-200/70 tabular">
          localhost · {label}
        </div>
        <div className="w-12" />
      </div>

      <div className="relative aspect-[16/10] w-full bg-ink-900">
        <iframe
          src={src}
          className="h-full w-full"
          loading="lazy"
          title={label}
        />
      </div>

      {caption ? (
        <div className="border-t border-white/5 px-6 py-3 text-[13px] text-ink-200/75">
          {caption}
        </div>
      ) : null}
    </motion.div>
  );
}
