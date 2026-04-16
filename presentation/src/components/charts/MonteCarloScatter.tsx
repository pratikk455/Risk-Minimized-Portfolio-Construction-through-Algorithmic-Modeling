"use client";

import { extent } from "d3-array";
import { scaleLinear } from "d3-scale";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

type Sample = {
  sharpe: number;
  vol: number;
  ret: number;
  dd: number;
  risk: number;
  beats: boolean;
};
type Data = {
  sampled: Sample[];
  sp500: { vol: number; sharpe: number; label: string };
  summary: { beatsSharpePct: number; beatsDDPct: number };
};

const W = 900;
const H = 540;
const M = { top: 28, right: 32, bottom: 52, left: 64 };

export default function MonteCarloScatter({ step }: { step: number }) {
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    fetch("/data/monte_carlo.json").then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  const built = useMemo(() => {
    if (!data) return null;
    const xExt = extent(data.sampled, (d) => d.vol) as [number, number];
    const yExt = extent(data.sampled, (d) => d.sharpe) as [number, number];
    const x = scaleLinear()
      .domain([Math.min(xExt[0], data.sp500.vol) - 0.01, xExt[1] + 0.01])
      .range([M.left, W - M.right]);
    const y = scaleLinear()
      .domain([yExt[0] - 0.05, yExt[1] + 0.05])
      .range([H - M.bottom, M.top]);
    return { x, y };
  }, [data]);

  if (!data || !built) return <div className="h-[540px]" />;
  const { x, y } = built;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="auto">
        {/* Grid */}
        {y.ticks(5).map((t) => (
          <g key={t}>
            <line
              x1={M.left}
              x2={W - M.right}
              y1={y(t)}
              y2={y(t)}
              className="axis-line"
              strokeDasharray="2 5"
            />
            <text x={M.left - 8} y={y(t) + 3} textAnchor="end" className="axis-tick">
              {t.toFixed(2)}
            </text>
          </g>
        ))}
        {x.ticks(5).map((t) => (
          <text key={t} x={x(t)} y={H - M.bottom + 18} textAnchor="middle" className="axis-tick">
            {(t * 100).toFixed(0)}%
          </text>
        ))}

        {/* Axis labels */}
        <text x={W / 2} y={H - 4} textAnchor="middle" className="axis-label">
          Volatility →
        </text>
        <text
          x={-H / 2}
          y={14}
          textAnchor="middle"
          transform="rotate(-90)"
          className="axis-label"
        >
          Sharpe ratio
        </text>

        {/* S&P 500 reference line */}
        <line
          x1={M.left}
          x2={W - M.right}
          y1={y(0.93)}
          y2={y(0.93)}
          stroke="rgba(255,255,255,0.25)"
          strokeDasharray="4 4"
        />
        <text
          x={W - M.right - 6}
          y={y(0.93) - 8}
          textAnchor="end"
          fill="rgba(255,255,255,0.55)"
          fontSize="13"
          letterSpacing="1.2"
        >
          S&amp;P 500 Sharpe (0.93)
        </text>

        {/* Dots */}
        {data.sampled.map((d, i) => {
          const beats = d.sharpe > 0.93;
          const fill = beats ? "#00D4A8" : "#5B5BF6";
          const op = step >= 1 ? (beats ? 0.65 : 0.28) : 0.45;
          return (
            <motion.circle
              key={i}
              cx={x(d.vol)}
              cy={y(d.sharpe)}
              r={4.5}
              fill={fill}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: op, scale: 1 }}
              transition={{
                duration: 0.4,
                delay: Math.min(0.0008 * i, 0.6),
                ease: [0.22, 1, 0.36, 1],
              }}
            />
          );
        })}

        {/* S&P 500 marker */}
        <motion.g
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <circle cx={x(data.sp500.vol)} cy={y(0.93)} r={12} fill="none" stroke="#F76343" strokeWidth={2.5} />
          <circle cx={x(data.sp500.vol)} cy={y(0.93)} r={6} fill="#F76343" />
          <text
            x={x(data.sp500.vol) + 18}
            y={y(0.93) + 5}
            fill="#F76343"
            fontSize="15"
            letterSpacing="2"
            fontWeight={600}
          >
            S&amp;P 500
          </text>
        </motion.g>

        {/* Summary callout */}
        {step >= 1 && (
          <motion.g
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <text
              x={M.left + 10}
              y={M.top + 22}
              fill="#00D4A8"
              fontSize="15"
              letterSpacing="2.5"
              fontWeight={600}
            >
              ▲ BEAT THE S&amp;P
            </text>
          </motion.g>
        )}
      </svg>
    </div>
  );
}
