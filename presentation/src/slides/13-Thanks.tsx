"use client";

import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import type { SlideProps } from "@/components/slides";

const REPO_URL =
  "https://github.com/pratikk455/Risk-Minimized-Portfolio-Construction-through-Algorithmic-Modeling";

const qrItems = [
  {
    label: "Paper",
    caption: "Final report",
    url: `${REPO_URL}/blob/master/portfolio-risk-app/paper_demo.pdf`,
  },
  {
    label: "Poster",
    caption: "Furman Fellows poster",
    url: `${REPO_URL}/blob/master/portfolio-risk-app/Hedgewise%20Final%20(1).pdf`,
  },
  {
    label: "App",
    caption: "Source on GitHub",
    url: REPO_URL,
  },
];

export default function Slide13Thanks({ step }: SlideProps) {
  const showThanks = step >= 1;

  return (
    <div className="flex w-full max-w-7xl flex-col items-center text-center">
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="font-display text-5xl font-light tracking-tight text-ink-100/85 md:text-6xl"
      >
        Any questions?
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.15 }}
        className="mt-12 grid w-full grid-cols-3 gap-8"
      >
        {qrItems.map((q, i) => (
          <motion.a
            key={q.label}
            href={q.url}
            target="_blank"
            rel="noreferrer"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 + i * 0.1 }}
            className="flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition hover:border-white/20 hover:bg-white/[0.07]"
          >
            <div className="rounded-2xl bg-white p-3">
              <QRCodeSVG
                value={q.url}
                size={168}
                level="M"
                bgColor="#ffffff"
                fgColor="#0b0b14"
              />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.28em] text-brand-mint/80">
                {q.label}
              </div>
              <div className="mt-1 font-display text-lg font-medium text-ink-50">
                {q.caption}
              </div>
            </div>
          </motion.a>
        ))}
      </motion.div>

      {showThanks ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mt-14 font-display text-mega font-semibold tracking-tight text-gradient"
        >
          Thank you.
        </motion.div>
      ) : null}
    </div>
  );
}
