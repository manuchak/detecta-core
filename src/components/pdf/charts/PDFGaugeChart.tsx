import React from 'react';
import { Svg, Path, Circle, Text as SvgText, G, Line } from '@react-pdf/renderer';
import { PDF_COLORS } from '../tokens';
import { describeArc, polarToCartesian } from './chartUtils';

export interface PDFGaugeChartProps {
  value: number;
  label?: string;
  size?: number;
  color?: string;
  thresholds?: { value: number; color: string }[];
}

const DEFAULT_THRESHOLDS = [
  { value: 0, color: PDF_COLORS.danger },
  { value: 40, color: PDF_COLORS.warning },
  { value: 70, color: PDF_COLORS.success },
];

const FONT = 'Poppins';

export const PDFGaugeChart: React.FC<PDFGaugeChartProps> = ({
  value,
  label,
  size = 100,
  color,
  thresholds = DEFAULT_THRESHOLDS,
}) => {
  const cx = size / 2;
  const cy = size / 2 + 4;
  const r = size / 2 - 10;
  const strokeW = 8;
  const clamped = Math.max(0, Math.min(100, value));

  const activeColor =
    color ||
    (() => {
      const sorted = [...thresholds].sort((a, b) => b.value - a.value);
      for (const t of sorted) {
        if (clamped >= t.value) return t.color;
      }
      return sorted[sorted.length - 1]?.color || PDF_COLORS.info;
    })();

  const startAngle = 180;
  const endAngle = 360;
  const valueAngle = startAngle + (clamped / 100) * (endAngle - startAngle);
  const bgArc = describeArc(cx, cy, r, startAngle, endAngle);
  const valArc = clamped > 0 ? describeArc(cx, cy, r, startAngle, valueAngle) : '';
  const needle = polarToCartesian(cx, cy, r - strokeW / 2 - 2, valueAngle);

  return (
    <Svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
      <Path d={bgArc} stroke={PDF_COLORS.borderLight} strokeWidth={strokeW} fill="none" strokeLinecap="round" />
      {valArc && <Path d={valArc} stroke={activeColor} strokeWidth={strokeW} fill="none" strokeLinecap="round" />}
      <Line x1={cx} y1={cy} x2={needle.x} y2={needle.y} stroke={PDF_COLORS.black} strokeWidth={1.2} />
      <Circle cx={cx} cy={cy} r={3} fill={PDF_COLORS.black} />
      <SvgText x={cx} y={cy - 6} style={{ fontSize: 14, fontFamily: FONT, fontWeight: 700 }} fill={PDF_COLORS.black} textAnchor="middle">
        {clamped.toFixed(0)}%
      </SvgText>
      {label && (
        <SvgText x={cx} y={cy + 14} style={{ fontSize: 7, fontFamily: FONT }} fill={PDF_COLORS.gray} textAnchor="middle">
          {label}
        </SvgText>
      )}
    </Svg>
  );
};
