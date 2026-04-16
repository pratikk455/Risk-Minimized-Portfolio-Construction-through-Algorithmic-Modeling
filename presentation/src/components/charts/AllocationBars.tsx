"use client";

import { scaleBand, scaleLinear } from "d3-scale";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

type Row = {
  ticker: string;
  name: string;
  category: string;
  hrp: number;
  markowitz: number;
  hybrid: number;
};

type Props = { step: number };

const W = 980;
const H = 240;
const M = { top: 18, right: 20, bottom: 36, left: 44 };

export default function AllocationBars({ step }: Props) {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    fetch("/data/allocations.json")
      .then((r) => r.json())
      .then(setRows)
      .catch(() => setRows([]));
  }, []);

  if (!rows || rows.length === 0) {
    return <div className="h-[240px]" />;
  }

  const x = scaleBand()
    .domain(rows.map((r) => r.ticker))
    .range([M.left, W - M.right])
    .padding(0.32);

  const max = Math.max(...rows.flatMap((r) => [r.hrp, r.markowitz, r.hybrid]));
  const y = scaleLinear().domain([0, max + 4]).range([H - M.bottom, M.top]);

  const barW = x.bandwidth() / 3;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="auto">
        {/* Y axis grid */}
        {y.ticks(4).map((t) => (
          <g key={t}>
            <line
              x1={M.left}
              x2={W - M.right}
              y1={y(t)}
              y2={y(t)}
              className="axis-line"
              strokeDasharray="2 4"
            />
            <text x={M.left - 8} y={y(t) + 4} textAnchor="end" className="axis-tick">
              {t}%
            </text>
          </g>
        ))}

        {rows.map((r, i) => {
          const xb = x(r.ticker)!;
          return (
            <g key={r.ticker}>
              {/* HRP bar */}
              <motion.rect
                x={xb}
                width={barW}
                fill="#6EB9FF"
                rx={3}
                initial={{ height: 0, y: H - M.bottom }}
                animate={
                  step >= 1
                    ? { height: H - M.bottom - y(r.hrp), y: y(r.hrp) }
                    : { height: 0, y: H - M.bottom }
                }
                transition={{ duration: 0.6, delay: 0.015 * i, ease: [0.22, 1, 0.36, 1] }}
              />
              {/* Markowitz bar */}
              <motion.rect
                x={xb + barW}
                width={barW}
                fill="#5B5BF6"
                rx={3}
                initial={{ height: 0, y: H - M.bottom }}
                animate={
                  step >= 2
                    ? { height: H - M.bottom - y(r.markowitz), y: y(r.markowitz) }
                    : { height: 0, y: H - M.bottom }
                }
                transition={{ duration: 0.6, delay: 0.015 * i, ease: [0.22, 1, 0.36, 1] }}
              />
              {/* Hybrid bar */}
              <motion.rect
                x={xb + barW * 2}
                width={barW}
                fill="#00D4A8"
                rx={3}
                initial={{ height: 0, y: H - M.bottom }}
                animate={
                  step >= 3
                    ? { height: H - M.bottom - y(r.hybrid), y: y(r.hybrid) }
                    : { height: 0, y: H - M.bottom }
                }
                transition={{ duration: 0.7, delay: 0.02 * i, ease: [0.22, 1, 0.36, 1] }}
              />
              <text
                x={xb + x.bandwidth() / 2}
                y={H - M.bottom + 22}
                textAnchor="middle"
                fill="rgba(255,255,255,0.75)"
                fontSize="13"
                fontWeight={600}
                letterSpacing="0.5"
              >
                {r.ticker}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="mt-4 flex items-center gap-6 text-[14px] text-ink-200/90">
        <Legend color="#6EB9FF" label="HRP" active={step >= 1} />
        <Legend color="#5B5BF6" label="Markowitz" active={step >= 2} />
        <Legend color="#00D4A8" label="Hybrid (40 / 60)" active={step >= 3} />
      </div>
    </div>
  );
}

function Legend({ color, label, active }: { color: string; label: string; active: boolean }) {
  return (
    <div className={`flex items-center gap-2 transition-opacity ${active ? "opacity-100" : "opacity-30"}`}>
      <span className="h-3 w-3 rounded-sm" style={{ background: color }} />
      <span>{label}</span>
    </div>
  );
}
