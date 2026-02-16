import React from 'react';
import { Svg, Rect, Line, Text as SvgText, G } from '@react-pdf/renderer';
import { PDF_COLORS, PDF_FONT_SIZES } from '../tokens';
import { scaleLinear, niceAxisTicks, formatAxisValue, truncateLabel } from './chartUtils';
import type { ChartSeries } from './PDFLineChart';

export interface PDFStackedBarChartProps {
  labels: string[];
  series: ChartSeries[];
  width?: number;
  height?: number;
  title?: string;
  showValues?: boolean;
  showLegend?: boolean;
}

const MARGIN = { top: 24, right: 12, bottom: 34, left: 44 };

export const PDFStackedBarChart: React.FC<PDFStackedBarChartProps> = ({
  labels,
  series,
  width = 500,
  height = 220,
  title,
  showValues = false,
  showLegend = true,
}) => {
  if (!series.length || !labels.length) return null;

  const plotW = width - MARGIN.left - MARGIN.right;
  const plotH = height - MARGIN.top - MARGIN.bottom;

  // Compute stacked totals per label
  const totals = labels.map((_, li) => series.reduce((sum, s) => sum + (s.data[li] || 0), 0));
  const maxVal = Math.max(...totals, 0);
  const ticks = niceAxisTicks(maxVal);
  const axisMax = ticks[ticks.length - 1] || 1;
  const yScale = scaleLinear([0, axisMax], [plotH, 0]);

  const barGap = 4;
  const barW = Math.max(8, (plotW - barGap * (labels.length + 1)) / labels.length);

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {title && (
        <SvgText x={width / 2} y={14} style={{ fontSize: PDF_FONT_SIZES.sm, fontFamily: 'Inter', fontWeight: 700 }} fill={PDF_COLORS.black} textAnchor="middle">
          {title}
        </SvgText>
      )}

      <G transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>
        {/* Grid */}
        {ticks.map((t) => {
          const y = yScale(t);
          return (
            <G key={t}>
              <Line x1={0} y1={y} x2={plotW} y2={y} stroke={PDF_COLORS.borderLight} strokeWidth={0.5} strokeDasharray="3,3" />
              <SvgText x={-4} y={y + 3} style={{ fontSize: 6, fontFamily: 'Inter' }} fill={PDF_COLORS.gray} textAnchor="end">
                {formatAxisValue(t)}
              </SvgText>
            </G>
          );
        })}

        <Line x1={0} y1={plotH} x2={plotW} y2={plotH} stroke={PDF_COLORS.border} strokeWidth={0.8} />

        {/* Stacked bars */}
        {labels.map((label, li) => {
          const x = barGap + li * (barW + barGap);
          let cumulative = 0;
          return (
            <G key={li}>
              {series.map((s) => {
                const val = s.data[li] || 0;
                const y = yScale(cumulative + val);
                const h = Math.max(0, plotH - yScale(val));
                cumulative += val;
                return <Rect key={s.name} x={x} y={y} width={barW} height={h} fill={s.color} />;
              })}
              {showValues && (
                <SvgText x={x + barW / 2} y={yScale(totals[li]) - 3} style={{ fontSize: 6, fontFamily: 'Inter', fontWeight: 600 }} fill={PDF_COLORS.black} textAnchor="middle">
                  {formatAxisValue(totals[li])}
                </SvgText>
              )}
              <SvgText x={x + barW / 2} y={plotH + 10} style={{ fontSize: 5.5, fontFamily: 'Inter' }} fill={PDF_COLORS.gray} textAnchor="middle">
                {truncateLabel(label, 10)}
              </SvgText>
            </G>
          );
        })}
      </G>

      {/* Legend */}
      {showLegend && (
        <G transform={`translate(${MARGIN.left}, ${height - 10})`}>
          {series.map((s, i) => {
            const lx = i * 90;
            return (
              <G key={s.name}>
                <Rect x={lx} y={-4} width={8} height={8} fill={s.color} rx={1} />
                <SvgText x={lx + 12} y={3} style={{ fontSize: 5.5, fontFamily: 'Inter' }} fill={PDF_COLORS.gray}>
                  {s.name}
                </SvgText>
              </G>
            );
          })}
        </G>
      )}
    </Svg>
  );
};
