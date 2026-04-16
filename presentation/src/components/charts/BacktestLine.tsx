"use client";

import { extent, max, min } from "d3-array";
import { scaleLinear, scaleTime } from "d3-scale";
import { area, line, curveMonotoneX } from "d3-shape";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

type Point = { d: string; sp: number; hy: number };
type Stress = { label: string; start: string; end: string };
type Data = {
  series: Point[];
  stress: Stress[];
  headlines: { hybrid: { dd: number }; sp500: { dd: number } };
};

const W = 900;
const H = 460;
const M = { top: 28, right: 32, bottom: 44, left: 60 };

export default function BacktestLine({ step }: { step: number }) {
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    fetch("/data/backtest.json").then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  const built = useMemo(() => {
    if (!data) return null;
    const series = data.series.map((p) => ({ ...p, t: new Date(p.d) }));
    const xDom = extent(series, (d) => d.t) as [Date, Date];
    const yLo = (min(series, (d) => Math.min(d.sp, d.hy)) ?? 0.9) - 0.05;
    const yHi = (max(series, (d) => Math.max(d.sp, d.hy)) ?? 2.1) + 0.05;

    const x = scaleTime().domain(xDom).range([M.left, W - M.right]);
    const y = scaleLinear().domain([yLo, yHi]).range([H - M.bottom, M.top]);

    const lineSP = line<{ t: Date; sp: number }>()
      .x((d) => x(d.t))
      .y((d) => y(d.sp))
      .curve(curveMonotoneX);
    const lineHY = line<{ t: Date; hy: number }>()
      .x((d) => x(d.t))
      .y((d) => y(d.hy))
      .curve(curveMonotoneX);
    const areaHY = area<{ t: Date; hy: number }>()
      .x((d) => x(d.t))
      .y0(H - M.bottom)
      .y1((d) => y(d.hy))
      .curve(curveMonotoneX);

    return { series, x, y, lineSP, lineHY, areaHY };
  }, [data]);

  if (!data || !built) return <div className="h-[460px]" />;

  const { series, x, y, lineSP, lineHY, areaHY } = built;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="auto">
        <defs>
          <linearGradient id="hyArea" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#00D4A8" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#00D4A8" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Y grid */}
        {y.ticks(4).map((t) => (
          <g key={t}>
            <line
              x1={M.left}
              x2={W - M.right}
              y1={y(t)}
              y2={y(t)}
              className="axis-line"
              strokeDasharray="2 5"
            />
            <text x={M.left - 6} y={y(t) + 3} textAnchor="end" className="axis-tick">
              {Math.round((t - 1) * 100)}%
            </text>
          </g>
        ))}

        {/* X axis years */}
        {[2019, 2020, 2021, 2022, 2023, 2024].map((yr) => (
          <text
            key={yr}
            x={x(new Date(`${yr}-06-15`))}
            y={H - M.bottom + 18}
            textAnchor="middle"
            className="axis-tick"
          >
            {yr}
          </text>
        ))}

        {/* Stress periods (revealed at step >= 2) */}
        {step >= 2 &&
          data.stress.map((s) => {
            const x0 = x(new Date(s.start));
            const x1 = x(new Date(s.end));
            return (
              <g key={s.label}>
                <motion.rect
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.16 }}
                  transition={{ duration: 0.6 }}
                  x={x0}
                  y={M.top}
                  width={x1 - x0}
                  height={H - M.top - M.bottom}
                  fill="#F76343"
                />
                <text
                  x={(x0 + x1) / 2}
                  y={M.top + 18}
                  textAnchor="middle"
                  fill="rgba(247,99,67,0.95)"
                  fontSize="13"
                  letterSpacing="2"
                  fontWeight={600}
                >
                  {s.label.toUpperCase()}
                </text>
              </g>
            );
          })}

        {/* S&P line — drawn first */}
        <motion.path
          d={lineSP(series as any) as string}
          fill="none"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth={2.4}
          strokeDasharray="4 4"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.6, ease: "easeInOut" }}
        />

        {/* Hybrid area + line */}
        <motion.path
          d={areaHY(series as any) as string}
          fill="url(#hyArea)"
          initial={{ opacity: 0 }}
          animate={{ opacity: step >= 1 ? 1 : 0 }}
          transition={{ duration: 1.2, delay: 0.6 }}
        />
        <motion.path
          d={lineHY(series as any) as string}
          fill="none"
          stroke="#00D4A8"
          strokeWidth={3.4}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: step >= 1 ? 1 : 0 }}
          transition={{ duration: 1.6, delay: 0.4, ease: "easeInOut" }}
        />

        {/* End-of-period labels */}
        {step >= 1 && (
          <g>
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 1.6 }}
            >
              <text
                x={W - M.right - 4}
                y={y(series[series.length - 1].hy) - 10}
                textAnchor="end"
                fill="#00D4A8"
                fontSize="15"
                letterSpacing="2"
                fontWeight={600}
              >
                HYBRID
              </text>
              <text
                x={W - M.right - 4}
                y={y(series[series.length - 1].sp) + 18}
                textAnchor="end"
                fill="rgba(255,255,255,0.75)"
                fontSize="15"
                letterSpacing="2"
                fontWeight={600}
              >
                S&amp;P 500
              </text>
            </motion.g>
          </g>
        )}
      </svg>
    </div>
  );
}
