import React from 'react';
import { Svg, Rect, Line, Text as SvgText, G } from '@react-pdf/renderer';
import { PDF_COLORS, PDF_FONT_SIZES } from '../tokens';
import { scaleLinear, niceAxisTicks, getChartColors, formatAxisValue, truncateLabel } from './chartUtils';
import type { ChartDataPoint } from './PDFBarChart';

export interface PDFHorizontalBarChartProps {
  data: ChartDataPoint[];
  width?: number;
  height?: number;
  title?: string;
  showValues?: boolean;
  barColor?: string;
}

const MARGIN = { top: 24, right: 40, bottom: 12, left: 80 };

export const PDFHorizontalBarChart: React.FC<PDFHorizontalBarChartProps> = ({
  data,
  width = 500,
  height: heightProp,
  title,
  showValues = true,
  barColor,
}) => {
  if (!data.length) return null;

  const barH = 16;
  const barGap = 4;
  const computedH = heightProp || MARGIN.top + MARGIN.bottom + data.length * (barH + barGap);
  const plotW = width - MARGIN.left - MARGIN.right;
  const plotH = computedH - MARGIN.top - MARGIN.bottom;
  const colors = getChartColors(data.length);
  const maxVal = Math.max(...data.map((d) => d.value), 0);
  const ticks = niceAxisTicks(maxVal, 4);
  const axisMax = ticks[ticks.length - 1] || 1;
  const xScale = scaleLinear([0, axisMax], [0, plotW]);

  return (
    <Svg width={width} height={computedH} viewBox={`0 0 ${width} ${computedH}`}>
      {title && (
        <SvgText x={width / 2} y={14} style={{ fontSize: PDF_FONT_SIZES.sm, fontFamily: 'Inter', fontWeight: 700 }} fill={PDF_COLORS.black} textAnchor="middle">
          {title}
        </SvgText>
      )}

      <G transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>
        {/* Vertical grid */}
        {ticks.map((t) => {
          const x = xScale(t);
          return (
            <G key={t}>
              <Line x1={x} y1={0} x2={x} y2={plotH} stroke={PDF_COLORS.borderLight} strokeWidth={0.5} strokeDasharray="3,3" />
              <SvgText x={x} y={plotH + 10} style={{ fontSize: 6, fontFamily: 'Inter' }} fill={PDF_COLORS.gray} textAnchor="middle">
                {formatAxisValue(t)}
              </SvgText>
            </G>
          );
        })}

        <Line x1={0} y1={0} x2={0} y2={plotH} stroke={PDF_COLORS.border} strokeWidth={0.8} />

        {data.map((d, i) => {
          const y = i * (barH + barGap);
          const w = Math.max(0, xScale(d.value));
          const fill = d.color || barColor || colors[i];
          return (
            <G key={i}>
              <Rect x={0} y={y} width={w} height={barH} fill={fill} rx={2} />
              {/* Label */}
              <SvgText x={-4} y={y + barH / 2 + 3} style={{ fontSize: 6, fontFamily: 'Inter' }} fill={PDF_COLORS.black} textAnchor="end">
                {truncateLabel(d.label, 14)}
              </SvgText>
              {showValues && (
                <SvgText x={w + 4} y={y + barH / 2 + 3} style={{ fontSize: 6, fontFamily: 'Inter', fontWeight: 600 }} fill={PDF_COLORS.black}>
                  {formatAxisValue(d.value)}
                </SvgText>
              )}
            </G>
          );
        })}
      </G>
    </Svg>
  );
};
