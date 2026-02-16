import React from 'react';
import { Svg, Circle, Line, Path, Text as SvgText, G } from '@react-pdf/renderer';
import { PDF_COLORS, PDF_FONT_SIZES } from '../tokens';
import { scaleLinear, niceAxisTicks, formatAxisValue, truncateLabel, polylinePath } from './chartUtils';

export interface ChartSeries {
  name: string;
  color: string;
  data: number[];
}

export interface PDFLineChartProps {
  labels: string[];
  series: ChartSeries[];
  width?: number;
  height?: number;
  title?: string;
  showDots?: boolean;
  showGrid?: boolean;
  showLegend?: boolean;
}

const MARGIN = { top: 24, right: 16, bottom: 34, left: 44 };

export const PDFLineChart: React.FC<PDFLineChartProps> = ({
  labels,
  series,
  width = 500,
  height = 200,
  title,
  showDots = true,
  showGrid = true,
  showLegend = true,
}) => {
  if (!series.length || !labels.length) return null;

  const plotW = width - MARGIN.left - MARGIN.right;
  const plotH = height - MARGIN.top - MARGIN.bottom;
  const allValues = series.flatMap((s) => s.data);
  const maxVal = Math.max(...allValues, 0);
  const ticks = niceAxisTicks(maxVal);
  const axisMax = ticks[ticks.length - 1] || 1;
  const yScale = scaleLinear([0, axisMax], [plotH, 0]);
  const xStep = labels.length > 1 ? plotW / (labels.length - 1) : plotW / 2;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {title && (
        <SvgText x={width / 2} y={14} style={{ fontSize: PDF_FONT_SIZES.sm, fontFamily: 'Inter', fontWeight: 700 }} fill={PDF_COLORS.black} textAnchor="middle">
          {title}
        </SvgText>
      )}

      <G transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>
        {/* Grid + Y labels */}
        {showGrid &&
          ticks.map((t) => {
            const y = yScale(t);
            return (
              <G key={`g-${t}`}>
                <Line x1={0} y1={y} x2={plotW} y2={y} stroke={PDF_COLORS.borderLight} strokeWidth={0.5} strokeDasharray="3,3" />
                <SvgText x={-4} y={y + 3} style={{ fontSize: 6, fontFamily: 'Inter' }} fill={PDF_COLORS.gray} textAnchor="end">
                  {formatAxisValue(t)}
                </SvgText>
              </G>
            );
          })}

        {/* Baseline */}
        <Line x1={0} y1={plotH} x2={plotW} y2={plotH} stroke={PDF_COLORS.border} strokeWidth={0.8} />

        {/* X labels */}
        {labels.map((l, i) => (
          <SvgText key={i} x={i * xStep} y={plotH + 12} style={{ fontSize: 5.5, fontFamily: 'Inter' }} fill={PDF_COLORS.gray} textAnchor="middle">
            {truncateLabel(l, 10)}
          </SvgText>
        ))}

        {/* Series */}
        {series.map((s) => {
          const points = s.data.map((v, i) => ({ x: i * xStep, y: yScale(v) }));
          return (
            <G key={s.name}>
              <Path d={polylinePath(points)} stroke={s.color} strokeWidth={1.5} fill="none" />
              {showDots &&
                points.map((p, i) => (
                  <Circle key={i} cx={p.x} cy={p.y} r={2.5} fill={s.color} />
                ))}
            </G>
          );
        })}
      </G>

      {/* Legend */}
      {showLegend && series.length > 1 && (
        <G transform={`translate(${MARGIN.left}, ${height - 10})`}>
          {series.map((s, i) => {
            const lx = i * 90;
            return (
              <G key={s.name}>
                <Line x1={lx} y1={0} x2={lx + 12} y2={0} stroke={s.color} strokeWidth={2} />
                <SvgText x={lx + 16} y={3} style={{ fontSize: 5.5, fontFamily: 'Inter' }} fill={PDF_COLORS.gray}>
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
