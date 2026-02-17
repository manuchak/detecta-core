import React from 'react';
import { Svg, Rect, Line, Text as SvgText, G } from '@react-pdf/renderer';
import { PDF_COLORS, PDF_FONT_SIZES } from '../tokens';
import {
  scaleLinear,
  niceAxisTicks,
  getChartColors,
  formatAxisValue,
  truncateLabel,
} from './chartUtils';

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface PDFBarChartProps {
  data: ChartDataPoint[];
  width?: number;
  height?: number;
  title?: string;
  showValues?: boolean;
  barColor?: string;
}

const MARGIN = { top: 24, right: 12, bottom: 32, left: 44 };
const FONT = 'Poppins';

export const PDFBarChart: React.FC<PDFBarChartProps> = ({
  data,
  width = 500,
  height = 200,
  title,
  showValues = true,
  barColor,
}) => {
  if (!data.length) return null;

  const colors = getChartColors(data.length);
  const plotW = width - MARGIN.left - MARGIN.right;
  const plotH = height - MARGIN.top - MARGIN.bottom;
  const maxVal = Math.max(...data.map((d) => d.value), 0);
  const ticks = niceAxisTicks(maxVal);
  const axisMax = ticks[ticks.length - 1] || 1;
  const yScale = scaleLinear([0, axisMax], [plotH, 0]);

  const barGap = 4;
  const barW = Math.max(8, (plotW - barGap * (data.length + 1)) / data.length);

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {title && (
        <SvgText
          x={width / 2}
          y={14}
          style={{ fontSize: PDF_FONT_SIZES.sm, fontFamily: FONT, fontWeight: 700 }}
          fill={PDF_COLORS.black}
          textAnchor="middle"
        >
          {title}
        </SvgText>
      )}

      <G transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>
        {ticks.map((t) => {
          const y = yScale(t);
          return (
            <G key={`t-${t}`}>
              <Line x1={0} y1={y} x2={plotW} y2={y} stroke={PDF_COLORS.borderLight} strokeWidth={0.5} strokeDasharray="3,3" />
              <SvgText x={-4} y={y + 3} style={{ fontSize: 6, fontFamily: FONT }} fill={PDF_COLORS.gray} textAnchor="end">
                {formatAxisValue(t)}
              </SvgText>
            </G>
          );
        })}

        <Line x1={0} y1={plotH} x2={plotW} y2={plotH} stroke={PDF_COLORS.border} strokeWidth={0.8} />

        {data.map((d, i) => {
          const x = barGap + i * (barW + barGap);
          const barH = Math.max(0, plotH - yScale(d.value));
          const fill = d.color || barColor || colors[i];
          return (
            <G key={i}>
              <Rect x={x} y={yScale(d.value)} width={barW} height={barH} fill={fill} rx={2} />
              {showValues && (
                <SvgText
                  x={x + barW / 2}
                  y={yScale(d.value) - 3}
                  style={{ fontSize: 6, fontFamily: FONT, fontWeight: 600 }}
                  fill={PDF_COLORS.black}
                  textAnchor="middle"
                >
                  {formatAxisValue(d.value)}
                </SvgText>
              )}
              <SvgText
                x={x + barW / 2}
                y={plotH + 10}
                style={{ fontSize: 5.5, fontFamily: FONT }}
                fill={PDF_COLORS.gray}
                textAnchor="middle"
              >
                {truncateLabel(d.label, 10)}
              </SvgText>
            </G>
          );
        })}
      </G>
    </Svg>
  );
};
