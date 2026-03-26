import React from "react";
import type { PricePoint } from "../types";

interface Props {
  history: PricePoint[];
  purchased: boolean;
  height?: number;
  width?: number;
}

const W = 120;
const H = 40;
const PAD = 4;

export function SparklineChart({ history, purchased, height = H, width = W }: Props) {
  if (history.length < 2) {
    return (
      <svg width={width} height={height} aria-label="No price history yet">
        <text x={width / 2} y={height / 2 + 4} textAnchor="middle" fontSize="10" fill="#888">
          No data
        </text>
      </svg>
    );
  }

  const discounts = history.map((p) => p.discount);
  const min = Math.min(...discounts);
  const max = Math.max(...discounts);
  const range = max - min || 1;

  const toX = (i: number) => PAD + (i / (history.length - 1)) * (width - 2 * PAD);
  const toY = (val: number) => height - PAD - ((val - min) / range) * (height - 2 * PAD);

  const points = history.map((p, i) => `${toX(i)},${toY(p.discount)}`).join(" ");

  // Determine segment colors: each segment is green (discount up/high) or neutral/red
  const segments: React.ReactElement[] = [];
  for (let i = 1; i < history.length; i++) {
    const prev = history[i - 1];
    const curr = history[i];
    const x1 = toX(i - 1);
    const y1 = toY(prev.discount);
    const x2 = toX(i);
    const y2 = toY(curr.discount);

    // Red only if purchased and discount is falling
    const falling = curr.discount < prev.discount - 1;
    let color: string;
    if (falling && purchased) {
      color = "#ef4444"; // red-500
    } else if (curr.discount >= 50) {
      color = "#16a34a"; // green-600
    } else if (curr.discount >= 25) {
      color = "#22c55e"; // green-500
    } else if (curr.discount > 0) {
      color = "#86efac"; // green-300
    } else {
      color = "#94a3b8"; // slate-400 - no discount
    }

    segments.push(
      <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    );
  }

  // Fill area under the line
  const areaPath =
    `M${toX(0)},${height - PAD} ` +
    history.map((p, i) => `L${toX(i)},${toY(p.discount)}`).join(" ") +
    ` L${toX(history.length - 1)},${height - PAD} Z`;

  const latestDiscount = discounts[discounts.length - 1];
  const fillColor =
    purchased && latestDiscount < (discounts[discounts.length - 2] ?? latestDiscount) - 1
      ? "rgba(239,68,68,0.08)"
      : "rgba(34,197,94,0.10)";

  return (
    <svg
      width={width}
      height={height}
      aria-label={`Price trend sparkline, current discount ${latestDiscount}%`}
      role="img"
    >
      <path d={areaPath} fill={fillColor} />
      <polyline points={points} fill="none" stroke="transparent" strokeWidth="0" />
      {segments}
    </svg>
  );
}
