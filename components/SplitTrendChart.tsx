"use client";

import { useState } from "react";
import type { SplitPoint } from "@/lib/stats";
import { formatDateShort, formatMeters, formatSplit } from "@/lib/format";
import { useMeasure } from "@/lib/useMeasure";
import { ChartTooltip } from "./ChartTooltip";

const HEIGHT = 220;
const MARGIN = { top: 12, right: 16, bottom: 26, left: 48 };

export function SplitTrendChart({ points }: { points: SplitPoint[] }) {
  const [containerRef, { width }] = useMeasure<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const plotW = Math.max(0, width - MARGIN.left - MARGIN.right);
  const plotH = HEIGHT - MARGIN.top - MARGIN.bottom;

  const splits = points.map((p) => p.split);
  const rawMin = Math.min(...splits);
  const rawMax = Math.max(...splits);
  const pad = Math.max((rawMax - rawMin) * 0.15, 2);
  const domainMin = Math.max(0, rawMin - pad);
  const domainMax = rawMax + pad;

  const times = points.map((p) => new Date(`${p.date}T00:00:00`).getTime());
  const tMin = Math.min(...times);
  const tMax = Math.max(...times);
  const tSpan = Math.max(tMax - tMin, 1);

  const x = (t: number) => MARGIN.left + ((t - tMin) / tSpan) * plotW;
  // Lower split = faster; mapping the domain min to the top puts faster sessions
  // higher, so an improving trend climbs.
  const y = (split: number) =>
    MARGIN.top + ((split - domainMin) / (domainMax - domainMin)) * plotH;

  const tickCount = 4;
  const ticks = Array.from(
    { length: tickCount + 1 },
    (_, i) => domainMin + ((domainMax - domainMin) / tickCount) * i,
  );

  const coords = points.map((p, i) => ({ px: x(times[i]), py: y(p.split) }));
  const linePath = coords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.px.toFixed(1)} ${c.py.toFixed(1)}`)
    .join(" ");

  const labelEvery = Math.max(1, Math.ceil(points.length / Math.max(1, Math.floor(plotW / 72))));

  function handleMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    let nearest = 0;
    let best = Infinity;
    coords.forEach((c, i) => {
      const d = Math.abs(c.px - px);
      if (d < best) {
        best = d;
        nearest = i;
      }
    });
    setHover(nearest);
  }

  const last = points.length - 1;

  return (
    <div ref={containerRef} className="relative">
      <svg
        width="100%"
        height={HEIGHT}
        role="img"
        aria-label="Average 500 meter split per session over time; higher on the chart is faster"
        onPointerMove={handleMove}
        onPointerLeave={() => setHover(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={MARGIN.left}
              x2={width - MARGIN.right}
              y1={y(t)}
              y2={y(t)}
              stroke="var(--gridline)"
              strokeWidth={1}
            />
            <text
              x={MARGIN.left - 8}
              y={y(t) + 3.5}
              textAnchor="end"
              className="fill-ink-muted text-[11px] tabular-nums"
            >
              {formatSplit(t)}
            </text>
          </g>
        ))}
        <line
          x1={MARGIN.left}
          x2={width - MARGIN.right}
          y1={MARGIN.top + plotH}
          y2={MARGIN.top + plotH}
          stroke="var(--baseline)"
          strokeWidth={1}
        />
        {points.map(
          (p, i) =>
            i % labelEvery === 0 && (
              <text
                key={p.session.id}
                x={coords[i].px}
                y={HEIGHT - 8}
                textAnchor="middle"
                className="fill-ink-muted text-[11px]"
              >
                {formatDateShort(p.date)}
              </text>
            ),
        )}
        {hover !== null && (
          <line
            x1={coords[hover].px}
            x2={coords[hover].px}
            y1={MARGIN.top}
            y2={MARGIN.top + plotH}
            stroke="var(--baseline)"
            strokeWidth={1}
          />
        )}
        <path d={linePath} fill="none" stroke="var(--series-1)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {/* End marker with a surface ring, plus the hovered point */}
        {[last, ...(hover !== null && hover !== last ? [hover] : [])].map((i) => (
          <circle
            key={i}
            cx={coords[i].px}
            cy={coords[i].py}
            r={4}
            fill="var(--series-1)"
            stroke="var(--surface-1)"
            strokeWidth={2}
          />
        ))}
        <text
          x={Math.min(coords[last].px + 8, width - MARGIN.right)}
          y={coords[last].py - 10}
          textAnchor={coords[last].px > width - 70 ? "end" : "start"}
          className="fill-ink-secondary text-[11px] font-semibold tabular-nums"
        >
          {formatSplit(points[last].split)}
        </text>
      </svg>
      {hover !== null && points[hover] && (
        <ChartTooltip
          x={coords[hover].px}
          y={coords[hover].py}
          containerWidth={width}
          title={`${formatDateShort(points[hover].date)} · ${points[hover].session.type === "erg" ? "Erg" : "On water"}`}
          rows={[
            { value: `${formatSplit(points[hover].split)} /500m`, label: "avg split" },
            { value: `${formatMeters(points[hover].session.distanceMeters)} m`, label: "distance" },
          ]}
        />
      )}
    </div>
  );
}
