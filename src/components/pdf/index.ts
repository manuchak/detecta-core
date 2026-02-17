/**
 * PDF Design System
 *
 * Reusable @react-pdf/renderer components and tokens for all PDF reports.
 *
 * Usage:
 *   import { ReportHeader, ReportFooter, DataTable, ... } from '@/components/pdf';
 */

export { PDF_COLORS, PDF_SEVERITY_COLORS, PDF_SPACING, PDF_FONT_SIZES, PDF_PAGE_CONFIG } from './tokens';
export { pdfBaseStyles } from './styles';
export { registerPDFFonts } from './fontSetup';

// Components
export { ReportHeader } from './ReportHeader';
export { ReportFooter } from './ReportFooter';
export { SectionHeader } from './SectionHeader';
export { FieldRow } from './FieldRow';
export { FieldGroup } from './FieldGroup';
export { DataTable } from './DataTable';
export { KPIRow } from './KPIRow';
export { SignatureBlock } from './SignatureBlock';
export { StatusBadge } from './StatusBadge';
export { CoverPage } from './CoverPage';
export { ReportPage } from './ReportPage';
export { InsightBox } from './InsightBox';
export { EmptyDataNotice } from './EmptyDataNotice';

// Utilities
export { loadImageAsBase64 } from './utils';

// Charts
export {
  PDFBarChart,
  PDFHorizontalBarChart,
  PDFLineChart,
  PDFPieChart,
  PDFGaugeChart,
  PDFStackedBarChart,
} from './charts';
