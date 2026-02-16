import React from 'react';
import { Svg, Path, Text as SvgText, G, Line } from '@react-pdf/renderer';
import { PDF_COLORS } from '../tokens';
import { getChartColors, describePieSlice, polarToCartesian } from './chartUtils';
import type { ChartDataPoint } from './PDFBarChart';

export interface PDFPieChartProps {
  data: ChartDataPoint[];
  width?: number;
  height?: number;
  title?: string;
  showLabels?: boolean;
  showPercentages?: boolean;
  innerRadius?: number; // >0 = donut
}

export const PDFPieChart: React.FC<PDFPieChartProps> = ({
  data,
  width = 260,
  height = 200,
  title,
  showLabels = true,
  showPercentages = true,
  innerRadius = 0,
}) => {
  if (!data.length) return null;

  const colors = getChartColors(data.length);
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total <= 0) return null;

  const cx = width / 2;
  const cy = (height + (title ? 16 : 0)) / 2;
  const outerR = Math.min(cx, cy) - (showLabels ? 36 : 12);
  const innerR = innerRadius > 0 ? Math.min(innerRadius, outerR - 4) : 0;

  // Build slices
  let currentAngle = 0;
  const slices = data.map((d, i) => {
    const angle = (d.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;
    return { ...d, startAngle, endAngle, color: d.color || colors[i], pct: (d.value / total) * 100 };
  });

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {title && (
        <SvgText x={cx} y={14} style={{ fontSize: 8, fontFamily: 'Inter', fontWeight: 700 }} fill={PDF_COLORS.black} textAnchor="middle">
          {title}
        </SvgText>
      )}

      <G>
        {slices.map((s, i) => {
          // Avoid rendering 0-width slices
          if (s.endAngle - s.startAngle < 0.5) return null;
          const path = describePieSlice(cx, cy, outerR, innerR, s.startAngle, s.endAngle);
          const midAngle = (s.startAngle + s.endAngle) / 2;
          const labelR = outerR + 14;
          const labelPos = polarToCartesian(cx, cy, labelR, midAngle);
          const connectorStart = polarToCartesian(cx, cy, outerR + 2, midAngle);

          return (
            <G key={i}>
              <Path d={path} fill={s.color} />
              {showLabels && s.pct >= 4 && (
                <G>
                  <Line x1={connectorStart.x} y1={connectorStart.y} x2={labelPos.x} y2={labelPos.y} stroke={PDF_COLORS.grayLight} strokeWidth={0.5} />
                  <SvgText
                    x={labelPos.x}
                    y={labelPos.y + 3}
                    style={{ fontSize: 5.5, fontFamily: 'Inter' }}
                    fill={PDF_COLORS.gray}
                    textAnchor={midAngle > 180 ? 'end' : 'start'}
                  >
                    {s.label}{showPercentages ? ` ${s.pct.toFixed(0)}%` : ''}
                  </SvgText>
                </G>
              )}
            </G>
          );
        })}
      </G>
    </Svg>
  );
};
