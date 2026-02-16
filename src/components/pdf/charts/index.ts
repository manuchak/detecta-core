/**
 * PDF Native Chart Library
 *
 * SVG-based charts for @react-pdf/renderer using native primitives.
 * No external charting dependencies required.
 *
 * Usage:
 *   import { PDFBarChart, PDFLineChart, PDFPieChart } from '@/components/pdf/charts';
 */

export { PDFBarChart } from './PDFBarChart';
export type { PDFBarChartProps, ChartDataPoint } from './PDFBarChart';

export { PDFHorizontalBarChart } from './PDFHorizontalBarChart';
export type { PDFHorizontalBarChartProps } from './PDFHorizontalBarChart';

export { PDFLineChart } from './PDFLineChart';
export type { PDFLineChartProps, ChartSeries } from './PDFLineChart';

export { PDFPieChart } from './PDFPieChart';
export type { PDFPieChartProps } from './PDFPieChart';

export { PDFGaugeChart } from './PDFGaugeChart';
export type { PDFGaugeChartProps } from './PDFGaugeChart';

export { PDFStackedBarChart } from './PDFStackedBarChart';
export type { PDFStackedBarChartProps } from './PDFStackedBarChart';

// Utilities
export {
  scaleLinear,
  niceAxisTicks,
  getChartColors,
  describeArc,
  describePieSlice,
  polarToCartesian,
  polylinePath,
  formatAxisValue,
  truncateLabel,
} from './chartUtils';
