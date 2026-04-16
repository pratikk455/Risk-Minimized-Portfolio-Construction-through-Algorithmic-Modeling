"use client";

import { arc, pie } from "d3-shape";
import { motion } from "framer-motion";
import { useMemo } from "react";

type Datum = { name: string; weight: number };

type Props = {
  data: Datum[];
  step: number;
};

const SIZE = 540;
const RADIUS = SIZE / 2 - 22;
const INNER = RADIUS - 84;

const colors = ["#F76343", "#F7B955", "#5B5BF6", "#6EB9FF", "#00D4A8", "#9B6EFF", "#FF8FB1"];

export default function MagSevenDonut({ data, step }: Props) {
  // Build the donut: 7 highlighted Mag Seven slices + one big "rest" slice (493 companies)
  const totalMag = data.reduce((a, b) => a + b.weight, 0);
  const restWeight = 100 - totalMag;
  const slices = useMemo(
    () => [...data.map((d, i) => ({ ...d, kind: "mag" as const, color: colors[i] })),
           { name: "493 others", weight: restWeight, kind: "rest" as const, color: "#1B1F38" }],
    [data, restWeight]
  );

  const pieGen = pie<typeof slices[number]>().value((d) => d.weight).sort(null).startAngle(-Math.PI);
  const arcGen = arc<any>().innerRadius(INNER).outerRadius(RADIUS).cornerRadius(2).padAngle(0.005);
  const arcs = pieGen(slices);

  // Step 0: dim ring with all slices muted
  // Step 1: 'rest' fades, mag slices brighten
  // Step 2: total pulse glow
  // Step 3: hold

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE}>
        <defs>
          <radialGradient id="ringGlow" cx="50%" cy="50%" r="50%">
            <stop offset="60%" stopColor="rgba(247,99,67,0)" />
            <stop offset="100%" stopColor="rgba(247,99,67,0.35)" />
          </radialGradient>
        </defs>

        <g transform={`translate(${SIZE / 2}, ${SIZE / 2})`}>
          {/* Backdrop ring */}
          <circle r={RADIUS + 4} fill="rgba(255,255,255,0.02)" />
          {step >= 2 && <circle r={RADIUS + 12} fill="url(#ringGlow)" />}

          {arcs.map((a, i) => {
            const isMag = a.data.kind === "mag";
            const baseOpacity = step === 0 ? 0.5 : isMag ? 1 : step >= 1 ? 0.18 : 0.6;
            return (
              <motion.path
                key={a.data.name}
                d={arcGen(a) as string}
                fill={a.data.color}
                initial={{ opacity: 0 }}
                animate={{ opacity: baseOpacity }}
                transition={{ duration: 0.6, delay: 0.04 * i }}
              />
            );
          })}

          {/* Center text */}
          <g>
            {step >= 2 ? (
              <>
                <motion.text
                  textAnchor="middle"
                  y={-8}
                  fill="#ffffff"
                  className="font-display"
                  fontSize="68"
                  fontWeight={600}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: -8 }}
                  transition={{ duration: 0.6 }}
                >
                  {totalMag.toFixed(1)}%
                </motion.text>
                <motion.text
                  textAnchor="middle"
                  y={32}
                  fill="rgba(255,255,255,0.7)"
                  fontSize="16"
                  letterSpacing="2.5"
                  fontWeight={600}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  MAG SEVEN
                </motion.text>
              </>
            ) : (
              <text
                textAnchor="middle"
                y={6}
                fill="rgba(255,255,255,0.6)"
                fontSize="16"
                letterSpacing="2.5"
                fontWeight={600}
              >
                S&amp;P 500
              </text>
            )}
          </g>
        </g>
      </svg>

      {/* Labels around the ring once highlighted */}
      {step >= 1 && (
        <div className="absolute inset-0 pointer-events-none">
          {arcs
            .filter((a) => a.data.kind === "mag")
            .map((a, i) => {
              const mid = (a.startAngle + a.endAngle) / 2 - Math.PI / 2;
              const lx = SIZE / 2 + Math.cos(mid) * (RADIUS + 34);
              const ly = SIZE / 2 + Math.sin(mid) * (RADIUS + 34);
              return (
                <motion.div
                  key={a.data.name}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.05 * i + 0.15 }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-[14px] font-semibold text-ink-50"
                  style={{ left: `${(lx / SIZE) * 100}%`, top: `${(ly / SIZE) * 100}%` }}
                >
                  <span className="rounded-full border border-white/15 bg-ink-900/80 px-3 py-1 backdrop-blur">
                    {a.data.name}
                  </span>
                </motion.div>
              );
            })}
        </div>
      )}
    </div>
  );
}
