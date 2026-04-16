"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import SlideLayout from "./SlideLayout";
import SpeakerNotes from "./SpeakerNotes";
import { slides } from "./slides";

export default function Presentation() {
  const [slideIndex, setSlideIndex] = useState(0);
  const [step, setStep] = useState(0);
  const [notesOpen, setNotesOpen] = useState(false);

  // Hydrate from URL hash on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const match = window.location.hash.match(/slide=(\d+)(?:&step=(\d+))?/);
    if (match) {
      const idx = Math.max(0, Math.min(slides.length - 1, parseInt(match[1], 10) - 1));
      const st = match[2] ? parseInt(match[2], 10) : 0;
      setSlideIndex(idx);
      setStep(Math.max(0, Math.min(slides[idx].maxStep, st)));
    }
  }, []);

  // Sync URL hash whenever slide/step changes.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = `#slide=${slideIndex + 1}${step > 0 ? `&step=${step}` : ""}`;
    window.history.replaceState(null, "", hash);
  }, [slideIndex, step]);

  const goNext = useCallback(() => {
    const current = slides[slideIndex];
    if (step < current.maxStep) {
      setStep((s) => s + 1);
    } else if (slideIndex < slides.length - 1) {
      setSlideIndex((i) => i + 1);
      setStep(0);
    }
  }, [slideIndex, step]);

  const goPrev = useCallback(() => {
    if (step > 0) {
      setStep((s) => s - 1);
    } else if (slideIndex > 0) {
      const prevIdx = slideIndex - 1;
      setSlideIndex(prevIdx);
      setStep(slides[prevIdx].maxStep);
    }
  }, [slideIndex, step]);

  const jumpTo = useCallback((idx: number) => {
    const clamped = Math.max(0, Math.min(slides.length - 1, idx));
    setSlideIndex(clamped);
    setStep(0);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Allow typing inside iframes / inputs to pass through
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;

      switch (e.key) {
        case "ArrowRight":
        case " ":
        case "PageDown":
          e.preventDefault();
          goNext();
          break;
        case "ArrowLeft":
        case "PageUp":
          e.preventDefault();
          goPrev();
          break;
        case "n":
        case "N":
          e.preventDefault();
          setNotesOpen((v) => !v);
          break;
        case "f":
        case "F":
          e.preventDefault();
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
          } else {
            document.exitFullscreen().catch(() => {});
          }
          break;
        case "Home":
          e.preventDefault();
          jumpTo(0);
          break;
        case "End":
          e.preventDefault();
          jumpTo(slides.length - 1);
          break;
        default:
          if (/^[0-9]$/.test(e.key)) {
            e.preventDefault();
            const n = parseInt(e.key, 10);
            // 1→slide 1, 0→slide 10; for higher, use cmd shortcut
            const idx = n === 0 ? 9 : n - 1;
            jumpTo(idx);
          }
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev, jumpTo]);

  const current = slides[slideIndex];
  const SlideComponent = current.component;

  return (
    <main className="h-screen w-screen overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="h-full w-full"
        >
          <SlideLayout
            index={slideIndex}
            total={slides.length}
            title={current.title}
          >
            <SlideComponent
              step={step}
              isActive={true}
              advanceStep={goNext}
            />
          </SlideLayout>
        </motion.div>
      </AnimatePresence>

      <SpeakerNotes
        open={notesOpen}
        notes={current.notes}
        slideTitle={current.title}
        slideNumber={slideIndex + 1}
        total={slides.length}
      />

      <div className="pointer-events-none fixed bottom-5 right-6 z-20 select-none text-[11px] uppercase tracking-[0.2em] text-ink-300/55">
        <span className="tabular">
          {String(slideIndex + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
        </span>
      </div>
    </main>
  );
}
