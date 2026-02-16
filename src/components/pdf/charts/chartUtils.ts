/**
 * PDF Chart Utilities
 * Pure math helpers for SVG chart rendering in @react-pdf/renderer.
 * No external dependencies (no d3, no recharts).
 */

import { PDF_COLORS } from '../tokens';

// ── Default chart color palette ──
const CHART_PALETTE = [
  PDF_COLORS.info,
  PDF_COLORS.success,
  PDF_COLORS.warning,
  PDF_COLORS.orange,
  PDF_COLORS.red,
  PDF_COLORS.locationBlue,
  '#8B5CF6', // violet
  '#06B6D4', // cyan
  '#EC4899', // pink
  '#14B8A6', // teal
];

/** Return `n` colors cycling through the corporate palette */
export function getChartColors(n: number): string[] {
  return Array.from({ length: n }, (_, i) => CHART_PALETTE[i % CHART_PALETTE.length]);
}

// ── Linear scale ──

/** Map a value from `domain` [min,max] to `range` [min,max] linearly */
export function scaleLinear(
  domain: [number, number],
  range: [number, number],
): (value: number) => number {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const ratio = d1 === d0 ? 0 : (r1 - r0) / (d1 - d0);
  return (value: number) => r0 + (value - d0) * ratio;
}

// ── Nice ticks ──

/** Generate "nice" tick values for an axis given a data max */
export function niceAxisTicks(dataMax: number, desiredCount = 5): number[] {
  if (dataMax <= 0) return [0];
  const rough = dataMax / desiredCount;
  const pow = Math.pow(10, Math.floor(Math.log10(rough)));
  const normalized = rough / pow;
  let nice: number;
  if (normalized <= 1) nice = 1;
  else if (normalized <= 2) nice = 2;
  else if (normalized <= 5) nice = 5;
  else nice = 10;
  const step = nice * pow;
  const ticks: number[] = [];
  for (let v = 0; v <= dataMax + step * 0.01; v += step) {
    ticks.push(Math.round(v * 1e6) / 1e6);
  }
  // Ensure we always cover dataMax
  if (ticks[ticks.length - 1] < dataMax) {
    ticks.push(ticks[ticks.length - 1] + step);
  }
  return ticks;
}

// ── SVG Path helpers ──

/** Convert degrees to radians */
export function deg2rad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Polar to cartesian */
export function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = deg2rad(angleDeg - 90); // SVG: 0° = top
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

/** Generate SVG arc path (for pie slices and gauges) */
export function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

/** Generate SVG path for a pie slice (arc + lines to center) */
export function describePieSlice(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number,
): string {
  const outerStart = polarToCartesian(cx, cy, outerR, endAngle);
  const outerEnd = polarToCartesian(cx, cy, outerR, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;

  if (innerR <= 0) {
    // Full pie slice
    return [
      `M ${outerStart.x} ${outerStart.y}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 0 ${outerEnd.x} ${outerEnd.y}`,
      `L ${cx} ${cy}`,
      'Z',
    ].join(' ');
  }

  // Donut slice
  const innerStart = polarToCartesian(cx, cy, innerR, endAngle);
  const innerEnd = polarToCartesian(cx, cy, innerR, startAngle);
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 0 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 1 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ');
}

/** Generate polyline SVG path from array of {x,y} points */
export function polylinePath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
}

// ── Number formatting ──

/** Compact number formatting for axis labels */
export function formatAxisValue(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(1);
}

/** Truncate label to max chars */
export function truncateLabel(label: string, maxChars = 12): string {
  return label.length > maxChars ? label.slice(0, maxChars - 1) + '…' : label;
}
