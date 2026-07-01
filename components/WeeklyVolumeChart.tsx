"use client";

import { useState } from "react";
import type { WeekBucket } from "@/lib/queries";
import { formatDateShort } from "@/lib/format";
import { useMeasure } from "@/lib/useMeasure";
import { ChartTooltip } from "./ChartTooltip";

const HEIGHT = 220;
const MARGIN = { top: 12, right: 8, bottom: 26, left: 48 };

function niceCeil(v: number): number {
  if (v <= 0) return 1000;
  const pow = 10 ** Math.floor(Math.log10(v));
  for (const mult of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) {
    if (mult * pow >= v) return mult * pow;
  }
  return 10 * pow;
}

export function WeeklyVolumeChart({ weeks }: { weeks: WeekBucket[] }) {
  const [containerRef, { width }] = useMeasure<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const plotW = Math.max(0, width - MARGIN.left - MARGIN.right);
  const plotH = HEIGHT - MARGIN.top - MARGIN.bottom;
  const maxMeters = niceCeil(Math.max(...weeks.map((w) => w.meters), 1));
  const tickCount = 4;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => (maxMeters / tickCount) * i);

  const band = weeks.length > 0 ? plotW / weeks.length : 0;
  const barW = Math.min(24, Math.max(3, band - 2));
  const labelEvery = Math.max(1, Math.ceil(weeks.length / Math.max(1, Math.floor(plotW / 64))));

  const y = (m: number) => MARGIN.top + plotH - (m / maxMeters) * plotH;

  return (
    <div ref={containerRef} className="relative">
      <svg width="100%" height={HEIGHT} role="img" aria-label="Weekly rowing volume in meters">
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={MARGIN.left}
              x2={width - MARGIN.right}
              y1={y(t)}
              y2={y(t)}
              stroke={t === 0 ? "var(--baseline)" : "var(--gridline)"}
              strokeWidth={1}
            />
            <text
              x={MARGIN.left - 8}
              y={y(t) + 3.5}
              textAnchor="end"
              className="fill-ink-muted text-[11px] tabular-nums"
            >
              {t.toLocaleString("en-US")}
            </text>
          </g>
        ))}
        {weeks.map((w, i) => {
          const cx = MARGIN.left + band * i + band / 2;
          const barX = cx - barW / 2;
          const barTop = y(w.meters);
          const h = MARGIN.top + plotH - barTop;
          const r = Math.min(4, h, barW / 2);
          return (
            <g key={w.weekStart}>
              {h > 0 && (
                <path
                  d={`M ${barX} ${MARGIN.top + plotH}
                      V ${barTop + r}
                      Q ${barX} ${barTop} ${barX + r} ${barTop}
                      H ${barX + barW - r}
                      Q ${barX + barW} ${barTop} ${barX + barW} ${barTop + r}
                      V ${MARGIN.top + plotH} Z`}
                  fill="var(--series-1)"
                  opacity={hover === null || hover === i ? 1 : 0.45}
                />
              )}
              {i % labelEvery === 0 && (
                <text
                  x={cx}
                  y={HEIGHT - 8}
                  textAnchor="middle"
                  className="fill-ink-muted text-[11px]"
                >
                  {formatDateShort(w.weekStart)}
                </text>
              )}
              <rect
                x={MARGIN.left + band * i}
                y={MARGIN.top}
                width={band}
                height={plotH}
                fill="transparent"
                tabIndex={0}
                aria-label={`Week of ${formatDateShort(w.weekStart)}: ${w.meters.toLocaleString("en-US")} meters, ${w.sessions} sessions`}
                onPointerEnter={() => setHover(i)}
                onPointerLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                className="outline-none"
              />
            </g>
          );
        })}
      </svg>
      {hover !== null && weeks[hover] && (
        <ChartTooltip
          x={MARGIN.left + band * hover + band / 2}
          y={y(weeks[hover].meters)}
          containerWidth={width}
          title={`Week of ${formatDateShort(weeks[hover].weekStart)}`}
          rows={[
            { value: `${weeks[hover].meters.toLocaleString("en-US")} m`, label: "volume" },
            {
              value: String(weeks[hover].sessions),
              label: weeks[hover].sessions === 1 ? "session" : "sessions",
            },
          ]}
        />
      )}
    </div>
  );
}
