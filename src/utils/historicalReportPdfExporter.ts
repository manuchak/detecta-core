import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { 
  HistoricalReportConfig, 
  HistoricalReportData,
  CPAReportData,
  LTVReportData,
  RetentionReportData,
  EngagementReportData,
  SupplyGrowthReportData,
  ConversionReportData,
  CapacityReportData,
  OperationalReportData,
  ProjectionsReportData,
  ClientsReportData
} from '@/types/reports';

// ============================================
// DESIGN SYSTEM - Corporate Colors
// ============================================
const CORPORATE_RED = [235, 0, 0] as const;
const CORPORATE_BLACK = [25, 25, 25] as const;
const CORPORATE_GRAY = [100, 100, 100] as const;
const LIGHT_GRAY = [240, 240, 240] as const;
const MUTED_GRAY = [150, 150, 150] as const;
const WHITE = [255, 255, 255] as const;
const BACKGROUND_SUBTLE = [248, 250, 252] as const;
const BORDER_LIGHT = [220, 220, 220] as const;

// Retention heatmap colors
const RETENTION_EXCELLENT = [22, 163, 74] as const;  // Green
const RETENTION_GOOD = [202, 138, 4] as const;       // Yellow
const RETENTION_POOR = [220, 38, 38] as const;       // Red

// ============================================
// SPACING SYSTEM - Professional Hierarchy
// ============================================
const SPACING = {
  SECTION_GAP: 15,
  SUBSECTION_GAP: 10,
  CARD_GAP: 8,
  ELEMENT_GAP: 4,
  TABLE_AFTER: 12,
  PAGE_MARGIN_TOP: 25,
  PAGE_MARGIN_BOTTOM: 20,
  HEADER_HEIGHT: 18,
  FOOTER_HEIGHT: 12
};

// ============================================
// PDF CONTEXT - Extended with section tracking
// ============================================
interface PDFContext {
  pdf: jsPDF;
  y: number;
  pageHeight: number;
  marginLeft: number;
  marginRight: number;
  contentWidth: number;
  currentSectionTitle: string;
  currentSectionNumber: number;
  periodLabel: string;
  generatedAt: Date;
}

// ============================================
// FORMATTING UTILITIES
// ============================================
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('es-MX').format(value);
};

const formatPercent = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

// ============================================
// PAGE MANAGEMENT - Headers, Footers, Breaks
// ============================================
const addPageHeader = (ctx: PDFContext): void => {
  const { pdf } = ctx;
  
  // Header background
  pdf.setFillColor(...BACKGROUND_SUBTLE);
  pdf.rect(0, 0, 210, SPACING.HEADER_HEIGHT, 'F');
  
  // Left: Section info
  pdf.setFontSize(9);
  pdf.setTextColor(...CORPORATE_GRAY);
  pdf.text(`${ctx.currentSectionNumber}. ${ctx.currentSectionTitle}`, ctx.marginLeft, 12);
  
  // Right: Period
  pdf.setFontSize(8);
  pdf.text(ctx.periodLabel, 195 - ctx.marginRight, 12, { align: 'right' });
  
  // Bottom line
  pdf.setDrawColor(...CORPORATE_RED);
  pdf.setLineWidth(0.5);
  pdf.line(ctx.marginLeft, SPACING.HEADER_HEIGHT, 210 - ctx.marginRight, SPACING.HEADER_HEIGHT);
};

const addPageFooter = (ctx: PDFContext, pageNum: number, totalPages: number): void => {
  const { pdf } = ctx;
  const footerY = 287;
  
  // Top separator line
  pdf.setDrawColor(...BORDER_LIGHT);
  pdf.setLineWidth(0.3);
  pdf.line(ctx.marginLeft, footerY - 3, 210 - ctx.marginRight, footerY - 3);
  
  pdf.setFontSize(8);
  pdf.setTextColor(...MUTED_GRAY);
  
  // Left: Report name
  pdf.text(`Informe Histórico • ${ctx.periodLabel}`, ctx.marginLeft, footerY);
  
  // Center: Page number
  pdf.text(`Página ${pageNum} de ${totalPages}`, 105, footerY, { align: 'center' });
  
  // Right: Generated date
  pdf.text(format(ctx.generatedAt, "d MMM yyyy", { locale: es }), 210 - ctx.marginRight, footerY, { align: 'right' });
};

const checkNewPage = (ctx: PDFContext, neededHeight: number, forceNewPage: boolean = false): void => {
  const safetyMargin = SPACING.PAGE_MARGIN_BOTTOM + SPACING.FOOTER_HEIGHT;
  
  if (forceNewPage || ctx.y + neededHeight > ctx.pageHeight - safetyMargin) {
    ctx.pdf.addPage();
    addPageHeader(ctx);
    ctx.y = SPACING.PAGE_MARGIN_TOP + SPACING.HEADER_HEIGHT;
  }
};

const startNewSection = (ctx: PDFContext, title: string, sectionNumber: number): void => {
  ctx.currentSectionTitle = title;
  ctx.currentSectionNumber = sectionNumber;
  
  // Always start sections on new page
  ctx.pdf.addPage();
  addPageHeader(ctx);
  ctx.y = SPACING.PAGE_MARGIN_TOP + SPACING.HEADER_HEIGHT + 5;
};

// ============================================
// COVER PAGE - Professional Design
// ============================================
const renderCoverPage = (ctx: PDFContext, config: HistoricalReportConfig, data: HistoricalReportData): void => {
  const { pdf } = ctx;
  
  // Top accent bar
  pdf.setFillColor(...CORPORATE_RED);
  pdf.rect(0, 0, 210, 8, 'F');
  
  // Main title area
  pdf.setFontSize(36);
  pdf.setTextColor(...CORPORATE_BLACK);
  pdf.text('Informe Histórico', 105, 75, { align: 'center' });
  
  pdf.setFontSize(28);
  pdf.text('Detallado', 105, 90, { align: 'center' });
  
  // Period highlight
  pdf.setFontSize(22);
  pdf.setTextColor(...CORPORATE_RED);
  pdf.text(data.periodLabel, 105, 115, { align: 'center' });
  
  // Metadata box
  const boxY = 145;
  const boxHeight = 70;
  pdf.setDrawColor(...BORDER_LIGHT);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(45, boxY, 120, boxHeight, 3, 3, 'S');
  
  // Metadata content
  const moduleCount = config.modules.length;
  const moduleNames: Record<string, string> = {
    cpa: 'CPA',
    ltv: 'LTV',
    retention: 'Retención',
    engagement: 'Engagement',
    supply_growth: 'Crecimiento',
    conversion: 'Conversión',
    capacity: 'Capacidad',
    operational: 'Operacional',
    projections: 'Proyecciones'
  };
  
  const includedModules = config.modules.slice(0, 4).map(m => moduleNames[m]).join(', ') + 
    (moduleCount > 4 ? ` +${moduleCount - 4} más` : '');
  
  const granularityMap: Record<string, string> = {
    'monthly': 'Mensual',
    'quarterly': 'Trimestral',
    'yearly': 'Anual'
  };
  const granularityLabel = granularityMap[config.granularity] || 'Anual';
  
  pdf.setFontSize(10);
  pdf.setTextColor(...CORPORATE_GRAY);
  
  const labels = ['Fecha de generación:', 'Módulos incluidos:', 'Granularidad:', 'Clasificación:'];
  const values = [
    format(ctx.generatedAt, "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es }),
    includedModules,
    granularityLabel,
    'Uso Interno - Confidencial'
  ];
  
  let metaY = boxY + 15;
  labels.forEach((label, i) => {
    pdf.setTextColor(...CORPORATE_GRAY);
    pdf.text(label, 55, metaY);
    pdf.setTextColor(...CORPORATE_BLACK);
    pdf.text(values[i], 105, metaY);
    metaY += 14;
  });
  
  // Footer branding
  pdf.setFontSize(9);
  pdf.setTextColor(...MUTED_GRAY);
  pdf.text('Dashboard Ejecutivo', 105, 265, { align: 'center' });
  pdf.text('Documento Confidencial', 105, 272, { align: 'center' });
  
  // Bottom accent
  pdf.setFillColor(...CORPORATE_RED);
  pdf.rect(0, 289, 210, 8, 'F');
};

// ============================================
// EXECUTIVE SUMMARY - KPIs Dashboard
// ============================================
const renderExecutiveSummary = (ctx: PDFContext, data: HistoricalReportData): void => {
  const { pdf } = ctx;
  
  pdf.addPage();
  ctx.y = 25;
  
  // Section header with indicator bar
  pdf.setFillColor(...CORPORATE_RED);
  pdf.rect(ctx.marginLeft, ctx.y - 5, 4, 14, 'F');
  
  pdf.setFontSize(20);
  pdf.setTextColor(...CORPORATE_BLACK);
  pdf.text('Resumen Ejecutivo', ctx.marginLeft + 10, ctx.y + 5);
  ctx.y += 20;
  
  // Build KPIs array from available data
  interface KPIData {
    label: string;
    value: string;
    trend?: string;
    trendUp?: boolean;
  }
  
  const kpis: KPIData[] = [];
  
  if (data.cpa?.yearlyData) {
    kpis.push({
      label: 'CPA Promedio',
      value: formatCurrency(data.cpa.yearlyData.cpaPromedio)
    });
  }
  
  if (data.ltv?.yearlyData) {
    kpis.push({
      label: 'LTV General',
      value: formatCurrency(data.ltv.yearlyData.ltvGeneral)
    });
    
    // Add LTV/CPA ratio if both available
    if (data.cpa?.yearlyData?.cpaPromedio && data.cpa.yearlyData.cpaPromedio > 0) {
      const ratio = data.ltv.yearlyData.ltvGeneral / data.cpa.yearlyData.cpaPromedio;
      kpis.push({
        label: 'LTV/CPA Ratio',
        value: ratio.toFixed(1) + 'x',
        trend: ratio >= 3 ? 'Saludable' : ratio >= 2 ? 'Aceptable' : 'Atención',
        trendUp: ratio >= 2
      });
    }
  }
  
  if (data.retention?.yearlyData) {
    kpis.push({
      label: 'Retención Promedio',
      value: formatPercent(data.retention.yearlyData.retentionPromedio),
      trend: data.retention.yearlyData.retentionPromedio >= 80 ? '+' : '-',
      trendUp: data.retention.yearlyData.retentionPromedio >= 80
    });
  }
  
  if (data.operational?.gmv) {
    kpis.push({
      label: 'GMV Total',
      value: formatCurrency(data.operational.gmv.total)
    });
    kpis.push({
      label: 'AOV',
      value: formatCurrency(data.operational.gmv.aov)
    });
  }
  
  if (data.supplyGrowth?.summary) {
    kpis.push({
      label: 'Crecimiento Neto',
      value: formatNumber(data.supplyGrowth.summary.crecimientoNetoAnual),
      trend: formatPercent(data.supplyGrowth.summary.crecimientoPromedioMensual) + '/mes',
      trendUp: data.supplyGrowth.summary.crecimientoNetoAnual > 0
    });
  }
  
  if (data.conversion?.yearlyData) {
    kpis.push({
      label: 'Tasa Conversión',
      value: formatPercent(data.conversion.yearlyData.conversionRate)
    });
  }
  
  // Render KPI cards in 2-column grid
  const cardWidth = 85;
  const cardHeight = 38;
  const cardGap = 10;
  let col = 0;
  let startY = ctx.y;
  
  kpis.slice(0, 8).forEach((kpi, i) => {
    const x = ctx.marginLeft + (col * (cardWidth + cardGap));
    const y = startY;
    
    // Card border
    pdf.setDrawColor(...BORDER_LIGHT);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(x, y, cardWidth, cardHeight, 2, 2, 'S');
    
    // Label
    pdf.setFontSize(9);
    pdf.setTextColor(...CORPORATE_GRAY);
    pdf.text(kpi.label, x + 6, y + 12);
    
    // Value
    pdf.setFontSize(16);
    pdf.setTextColor(...CORPORATE_BLACK);
    pdf.setFont('helvetica', 'bold');
    pdf.text(kpi.value, x + 6, y + 28);
    pdf.setFont('helvetica', 'normal');
    
    // Trend indicator if available
    if (kpi.trend) {
      pdf.setFontSize(8);
      const trendColor = kpi.trendUp ? RETENTION_EXCELLENT : RETENTION_POOR;
      pdf.setTextColor(trendColor[0], trendColor[1], trendColor[2]);
      pdf.text(kpi.trend, x + cardWidth - 6, y + 12, { align: 'right' });
    }
    
    col++;
    if (col >= 2) {
      col = 0;
      startY += cardHeight + 8;
    }
  });
  
  ctx.y = startY + (col > 0 ? cardHeight + 15 : 10);
  
  // Highlights section
  pdf.setFontSize(14);
  pdf.setTextColor(...CORPORATE_BLACK);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Highlights del Período', ctx.marginLeft, ctx.y);
  pdf.setFont('helvetica', 'normal');
  ctx.y += 10;
  
  // Generate dynamic insights
  const highlights: { icon: string; text: string; positive: boolean }[] = [];
  
  if (data.ltv?.yearlyData && data.cpa?.yearlyData) {
    const ratio = data.ltv.yearlyData.ltvGeneral / data.cpa.yearlyData.cpaPromedio;
    if (ratio >= 3) {
      highlights.push({ icon: '✓', text: `Ratio LTV/CPA saludable de ${ratio.toFixed(1)}x`, positive: true });
    } else if (ratio < 2) {
      highlights.push({ icon: '!', text: `Ratio LTV/CPA bajo (${ratio.toFixed(1)}x) - revisar costos de adquisición`, positive: false });
    }
  }
  
  if (data.retention?.yearlyData) {
    if (data.retention.yearlyData.retentionPromedio >= 85) {
      highlights.push({ icon: '✓', text: `Excelente retención: ${formatPercent(data.retention.yearlyData.retentionPromedio)}`, positive: true });
    } else if (data.retention.yearlyData.retentionPromedio < 70) {
      highlights.push({ icon: '!', text: `Retención por debajo del objetivo: ${formatPercent(data.retention.yearlyData.retentionPromedio)}`, positive: false });
    }
  }
  
  if (data.supplyGrowth?.summary) {
    if (data.supplyGrowth.summary.crecimientoNetoAnual > 0) {
      highlights.push({ icon: '✓', text: `Crecimiento neto positivo: +${formatNumber(data.supplyGrowth.summary.crecimientoNetoAnual)} custodios`, positive: true });
    }
  }
  
  // Render highlights
  highlights.slice(0, 5).forEach(h => {
    const color = h.positive ? RETENTION_EXCELLENT : RETENTION_POOR;
    pdf.setFillColor(color[0], color[1], color[2]);
    pdf.circle(ctx.marginLeft + 3, ctx.y - 2, 2, 'F');
    
    pdf.setFontSize(10);
    pdf.setTextColor(...CORPORATE_BLACK);
    pdf.text(h.text, ctx.marginLeft + 10, ctx.y);
    ctx.y += 8;
  });
  
  if (highlights.length === 0) {
    pdf.setFontSize(10);
    pdf.setTextColor(...CORPORATE_GRAY);
    pdf.text('No hay alertas críticas en este período.', ctx.marginLeft, ctx.y);
  }
};

// ============================================
// TABLE OF CONTENTS - Enhanced
// ============================================
const renderTableOfContents = (ctx: PDFContext, config: HistoricalReportConfig): void => {
  const { pdf } = ctx;
  
  pdf.addPage();
  ctx.y = 35;
  
  // Title
  pdf.setFontSize(20);
  pdf.setTextColor(...CORPORATE_BLACK);
  pdf.text('Contenido del Informe', ctx.marginLeft, ctx.y);
  ctx.y += 20;
  
  const moduleNames: Record<string, { name: string; desc: string }> = {
    cpa: { name: 'CPA - Costo por Adquisición', desc: 'Análisis de costos de incorporación' },
    ltv: { name: 'LTV - Lifetime Value', desc: 'Valor de vida del custodio' },
    retention: { name: 'Retención', desc: 'Análisis de permanencia y cohortes' },
    engagement: { name: 'Engagement', desc: 'Frecuencia de actividad' },
    supply_growth: { name: 'Supply Growth', desc: 'Crecimiento de la red' },
    conversion: { name: 'Conversión', desc: 'Eficiencia del funnel' },
    capacity: { name: 'Capacidad Operativa', desc: 'Utilización y disponibilidad' },
    operational: { name: 'Operacional', desc: 'Servicios, GMV y rankings' },
    projections: { name: 'Proyecciones', desc: 'Forecast y precisión' },
    clients: { name: 'Análisis de Clientes', desc: 'Concentración, ranking y riesgos' }
  };
  
  config.modules.forEach((module, i) => {
    const info = moduleNames[module];
    const sectionNum = i + 1;
    
    // Number badge
    pdf.setFillColor(...CORPORATE_RED);
    pdf.circle(ctx.marginLeft + 5, ctx.y - 2, 5, 'F');
    pdf.setFontSize(10);
    pdf.setTextColor(...WHITE);
    pdf.text(sectionNum.toString(), ctx.marginLeft + 5, ctx.y, { align: 'center' });
    
    // Section title
    pdf.setFontSize(12);
    pdf.setTextColor(...CORPORATE_BLACK);
    pdf.setFont('helvetica', 'bold');
    pdf.text(info.name, ctx.marginLeft + 15, ctx.y);
    pdf.setFont('helvetica', 'normal');
    
    // Description
    pdf.setFontSize(9);
    pdf.setTextColor(...CORPORATE_GRAY);
    pdf.text(info.desc, ctx.marginLeft + 15, ctx.y + 6);
    
    // Dotted line to page number
    pdf.setDrawColor(...BORDER_LIGHT);
    pdf.setLineDashPattern([1, 2], 0);
    pdf.line(ctx.marginLeft + 100, ctx.y, 180, ctx.y);
    pdf.setLineDashPattern([], 0);
    
    ctx.y += 18;
  });
  
  // Legend box
  ctx.y += 10;
  pdf.setDrawColor(BORDER_LIGHT[0], BORDER_LIGHT[1], BORDER_LIGHT[2]);
  pdf.setFillColor(BACKGROUND_SUBTLE[0], BACKGROUND_SUBTLE[1], BACKGROUND_SUBTLE[2]);
  pdf.roundedRect(ctx.marginLeft, ctx.y, ctx.contentWidth, 25, 2, 2, 'FD');
  
  pdf.setFontSize(9);
  pdf.setTextColor(...CORPORATE_GRAY);
  pdf.text('Este informe contiene métricas calculadas con datos del período seleccionado.', ctx.marginLeft + 5, ctx.y + 10);
  pdf.text('Los valores presentados son aproximaciones basadas en la información disponible.', ctx.marginLeft + 5, ctx.y + 18);
};

// ============================================
// CONTENT HELPERS - Enhanced Typography
// ============================================
const addSectionTitle = (ctx: PDFContext, title: string): void => {
  checkNewPage(ctx, 25);
  
  // Accent bar
  ctx.pdf.setFillColor(...CORPORATE_RED);
  ctx.pdf.rect(ctx.marginLeft, ctx.y - 4, 3, 12, 'F');
  
  ctx.pdf.setFontSize(18);
  ctx.pdf.setTextColor(...CORPORATE_BLACK);
  ctx.pdf.setFont('helvetica', 'bold');
  ctx.pdf.text(title, ctx.marginLeft + 8, ctx.y + 4);
  ctx.pdf.setFont('helvetica', 'normal');
  ctx.y += 15;
};

const addSubsectionTitle = (ctx: PDFContext, title: string): void => {
  checkNewPage(ctx, 18);
  ctx.pdf.setFontSize(13);
  ctx.pdf.setTextColor(...CORPORATE_BLACK);
  ctx.pdf.setFont('helvetica', 'bold');
  ctx.pdf.text(title, ctx.marginLeft, ctx.y);
  ctx.pdf.setFont('helvetica', 'normal');
  ctx.y += 10;
};

const addText = (ctx: PDFContext, text: string, fontSize: number = 10): void => {
  checkNewPage(ctx, 10);
  ctx.pdf.setFontSize(fontSize);
  ctx.pdf.setTextColor(...CORPORATE_GRAY);
  
  // Handle long text with wrapping
  const maxWidth = ctx.contentWidth;
  const lines = ctx.pdf.splitTextToSize(text, maxWidth);
  ctx.pdf.text(lines, ctx.marginLeft, ctx.y);
  ctx.y += lines.length * 5 + 3;
};

const addKeyValue = (ctx: PDFContext, key: string, value: string): void => {
  checkNewPage(ctx, 8);
  ctx.pdf.setFontSize(10);
  ctx.pdf.setTextColor(...CORPORATE_GRAY);
  ctx.pdf.text(key + ':', ctx.marginLeft, ctx.y);
  ctx.pdf.setTextColor(...CORPORATE_BLACK);
  ctx.pdf.setFont('helvetica', 'bold');
  ctx.pdf.text(value, ctx.marginLeft + 65, ctx.y);
  ctx.pdf.setFont('helvetica', 'normal');
  ctx.y += 7;
};

// ============================================
// TABLES - Never Cut, With Headers Repeated
// ============================================
const addTable = (ctx: PDFContext, headers: string[], rows: string[][], colWidths: number[], options?: { maxRowsPerPage?: number }): void => {
  const rowHeight = 8;
  const headerHeight = 10;
  const maxRowsPerPage = options?.maxRowsPerPage || 18;
  
  // Split rows into chunks if too many
  const chunks: string[][][] = [];
  for (let i = 0; i < rows.length; i += maxRowsPerPage) {
    chunks.push(rows.slice(i, i + maxRowsPerPage));
  }
  
  chunks.forEach((chunkRows, chunkIndex) => {
    const tableHeight = headerHeight + (chunkRows.length * rowHeight) + 10;
    
    // Check if we need new page (with safety margin)
    if (ctx.y + tableHeight > ctx.pageHeight - 35) {
      ctx.pdf.addPage();
      addPageHeader(ctx);
      ctx.y = SPACING.PAGE_MARGIN_TOP + SPACING.HEADER_HEIGHT + 5;
    }
    
    // Continuation indicator for subsequent chunks
    if (chunkIndex > 0) {
      ctx.pdf.setFontSize(8);
      ctx.pdf.setTextColor(...CORPORATE_GRAY);
      ctx.pdf.text('(continuación)', ctx.marginLeft, ctx.y);
      ctx.y += 5;
    }
    
    // Header
    ctx.pdf.setFillColor(...CORPORATE_RED);
    ctx.pdf.rect(ctx.marginLeft, ctx.y - 5, ctx.contentWidth, headerHeight, 'F');
    ctx.pdf.setTextColor(...WHITE);
    ctx.pdf.setFontSize(9);
    ctx.pdf.setFont('helvetica', 'bold');
    
    let x = ctx.marginLeft + 2;
    headers.forEach((header, i) => {
      ctx.pdf.text(header, x, ctx.y + 1);
      x += colWidths[i];
    });
    ctx.y += headerHeight;
    
    // Rows
    ctx.pdf.setFont('helvetica', 'normal');
    
    chunkRows.forEach((row, rowIndex) => {
      // Alternating row colors
      if (rowIndex % 2 === 0) {
        ctx.pdf.setFillColor(...LIGHT_GRAY);
        ctx.pdf.rect(ctx.marginLeft, ctx.y - 5, ctx.contentWidth, rowHeight, 'F');
      }
      
      ctx.pdf.setTextColor(...CORPORATE_BLACK);
      x = ctx.marginLeft + 2;
      row.forEach((cell, i) => {
        ctx.pdf.text(cell, x, ctx.y);
        x += colWidths[i];
      });
      ctx.y += rowHeight;
    });
    
    ctx.y += 5;
  });
  
  ctx.y += SPACING.TABLE_AFTER;
};

// ============================================
// COHORT TABLE - With Legend and Heatmap Colors
// ============================================
const addCohortTable = (ctx: PDFContext, data: RetentionReportData): void => {
  const { pdf } = ctx;
  
  // Explanatory box
  checkNewPage(ctx, 35);
  
  pdf.setDrawColor(...BORDER_LIGHT);
  pdf.setFillColor(...BACKGROUND_SUBTLE);
  pdf.roundedRect(ctx.marginLeft, ctx.y, ctx.contentWidth, 28, 2, 2, 'FD');
  
  pdf.setFontSize(10);
  pdf.setTextColor(...CORPORATE_BLACK);
  pdf.setFont('helvetica', 'bold');
  pdf.text('CÓMO INTERPRETAR LA MATRIZ DE COHORTES', ctx.marginLeft + 5, ctx.y + 8);
  pdf.setFont('helvetica', 'normal');
  
  pdf.setFontSize(8);
  pdf.setTextColor(...CORPORATE_GRAY);
  pdf.text('Cada fila = grupo de custodios incorporados en ese mes. Columnas = % activo después de N meses.', ctx.marginLeft + 5, ctx.y + 16);
  
  // Color legend
  const legendY = ctx.y + 22;
  pdf.setFillColor(...RETENTION_EXCELLENT);
  pdf.rect(ctx.marginLeft + 5, legendY - 3, 8, 5, 'F');
  pdf.text('≥80% Excelente', ctx.marginLeft + 15, legendY);
  
  pdf.setFillColor(...RETENTION_GOOD);
  pdf.rect(ctx.marginLeft + 65, legendY - 3, 8, 5, 'F');
  pdf.text('60-79% Normal', ctx.marginLeft + 75, legendY);
  
  pdf.setFillColor(...RETENTION_POOR);
  pdf.rect(ctx.marginLeft + 120, legendY - 3, 8, 5, 'F');
  pdf.text('<60% Atención', ctx.marginLeft + 130, legendY);
  
  ctx.y += 35;
  
  // Table with heatmap colors
  const headers = ['Cohorte', 'Inicio', 'M+1', 'M+2', 'M+3', 'M+4', 'M+5', 'M+6'];
  const colWidths = [28, 22, 20, 20, 20, 20, 20, 20];
  const rowHeight = 9;
  const headerHeight = 10;
  
  // Check space for table
  const tableHeight = headerHeight + (data.cohortAnalysis.length * rowHeight) + 10;
  if (ctx.y + tableHeight > ctx.pageHeight - 35) {
    pdf.addPage();
    addPageHeader(ctx);
    ctx.y = SPACING.PAGE_MARGIN_TOP + SPACING.HEADER_HEIGHT + 5;
  }
  
  // Header
  pdf.setFillColor(...CORPORATE_BLACK);
  pdf.rect(ctx.marginLeft, ctx.y - 5, ctx.contentWidth, headerHeight, 'F');
  pdf.setTextColor(...WHITE);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  
  let x = ctx.marginLeft + 2;
  headers.forEach((header, i) => {
    pdf.text(header, x, ctx.y + 1);
    x += colWidths[i];
  });
  ctx.y += headerHeight;
  
  // Rows with conditional coloring
  pdf.setFont('helvetica', 'normal');
  
  data.cohortAnalysis.forEach((cohort) => {
    x = ctx.marginLeft + 2;
    
    // Cohort month
    pdf.setFillColor(...WHITE);
    pdf.setTextColor(...CORPORATE_BLACK);
    pdf.text(cohort.cohortMonth, x, ctx.y);
    x += colWidths[0];
    
    // Initial count
    pdf.text(formatNumber(cohort.month0), x, ctx.y);
    x += colWidths[1];
    
    // Retention percentages with color coding
    const percentages = [cohort.month1, cohort.month2, cohort.month3, cohort.month4, cohort.month5, cohort.month6];
    percentages.forEach((pct, i) => {
      // Background color based on value
      let bgColor: readonly [number, number, number] = LIGHT_GRAY;
      if (pct >= 80) bgColor = RETENTION_EXCELLENT;
      else if (pct >= 60) bgColor = RETENTION_GOOD;
      else if (pct > 0) bgColor = RETENTION_POOR;
      
      if (pct > 0) {
        pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        pdf.rect(x - 2, ctx.y - 5, colWidths[i + 2], rowHeight, 'F');
      }
      
      pdf.setTextColor(...CORPORATE_BLACK);
      pdf.text(pct > 0 ? formatPercent(pct) : '-', x, ctx.y);
      x += colWidths[i + 2];
    });
    
    ctx.y += rowHeight;
  });
  
  ctx.y += 8;
  
  // Insight box
  const avgRetention = data.cohortAnalysis.reduce((sum, c) => sum + c.month3, 0) / data.cohortAnalysis.filter(c => c.month3 > 0).length || 0;
  
  if (avgRetention > 0) {
    const insightColor = avgRetention >= 70 ? RETENTION_EXCELLENT : RETENTION_POOR;
    pdf.setDrawColor(insightColor[0], insightColor[1], insightColor[2]);
    pdf.setFillColor(WHITE[0], WHITE[1], WHITE[2]);
    pdf.roundedRect(ctx.marginLeft, ctx.y, ctx.contentWidth, 15, 2, 2, 'FD');
    
    pdf.setFontSize(9);
    pdf.setTextColor(...CORPORATE_BLACK);
    pdf.text(`📊 INSIGHT: Retención promedio al mes 3: ${formatPercent(avgRetention)}`, ctx.marginLeft + 5, ctx.y + 9);
    ctx.y += 20;
  }
};

// ============================================
// SECTION RENDERERS - Enhanced
// ============================================
const renderCPASection = (ctx: PDFContext, data: CPAReportData, sectionNumber: number): void => {
  startNewSection(ctx, 'CPA - Costo por Adquisición', sectionNumber);
  
  addSectionTitle(ctx, 'CPA - Costo por Adquisición');
  addText(ctx, data.formula, 9);
  ctx.y += 5;

  addSubsectionTitle(ctx, 'Acumulado Anual');
  addKeyValue(ctx, 'Costos Totales', formatCurrency(data.yearlyData.totalCosts));
  addKeyValue(ctx, 'Custodios Nuevos', formatNumber(data.yearlyData.newCustodians));
  addKeyValue(ctx, 'CPA Promedio', formatCurrency(data.yearlyData.cpaPromedio));
  ctx.y += 8;

  addSubsectionTitle(ctx, 'Desglose de Costos');
  data.yearlyData.costBreakdown.forEach(item => {
    addKeyValue(ctx, item.category, `${formatCurrency(item.amount)} (${formatPercent(item.percentage)})`);
  });
  ctx.y += 8;

  addSubsectionTitle(ctx, 'Detalle Mensual');
  const headers = ['Mes', 'Costos', 'Nuevos', 'CPA'];
  const colWidths = [35, 50, 45, 50];
  const rows = data.monthlyEvolution.map(m => [
    m.month,
    formatCurrency(m.costs),
    formatNumber(m.newCustodians),
    formatCurrency(m.cpa)
  ]);
  addTable(ctx, headers, rows, colWidths);
};

const renderLTVSection = (ctx: PDFContext, data: LTVReportData, sectionNumber: number): void => {
  startNewSection(ctx, 'LTV - Lifetime Value', sectionNumber);
  
  addSectionTitle(ctx, 'LTV - Lifetime Value');
  addText(ctx, data.formula, 9);
  ctx.y += 5;

  addSubsectionTitle(ctx, 'Datos del Período');
  addKeyValue(ctx, 'Custodios Activos', formatNumber(data.yearlyData.totalCustodios));
  addKeyValue(ctx, 'Ingresos Totales', formatCurrency(data.yearlyData.ingresosTotales));
  addKeyValue(ctx, 'Ingreso/Custodio', formatCurrency(data.yearlyData.ingresoPromedioPorCustodio));
  addKeyValue(ctx, 'LTV General', formatCurrency(data.yearlyData.ltvGeneral));
  addKeyValue(ctx, 'Tiempo Vida Promedio', `${data.tiempoVidaPromedio} meses`);
  ctx.y += 8;

  addSubsectionTitle(ctx, 'Comparativo MoM');
  addKeyValue(ctx, 'LTV Actual', formatCurrency(data.momComparison.ltvActual));
  addKeyValue(ctx, 'LTV Mes Anterior', formatCurrency(data.momComparison.ltvMesAnterior));
  addKeyValue(ctx, 'Cambio Absoluto', formatCurrency(data.momComparison.cambioAbsoluto));
  addKeyValue(ctx, 'Cambio Relativo', formatPercent(data.momComparison.cambioRelativo));
  ctx.y += 8;

  addSubsectionTitle(ctx, 'Análisis Trimestral');
  const headers = ['Trimestre', 'LTV', 'Custodios', 'Ingresos'];
  const colWidths = [40, 45, 45, 50];
  const rows = data.quarterlyData.map(q => [
    q.quarter,
    formatCurrency(q.ltvPromedio),
    formatNumber(q.custodiosPromedio),
    formatCurrency(q.ingresosTotales)
  ]);
  addTable(ctx, headers, rows, colWidths);
};

const renderRetentionSection = (ctx: PDFContext, data: RetentionReportData, sectionNumber: number): void => {
  startNewSection(ctx, 'Retención', sectionNumber);
  
  addSectionTitle(ctx, 'Retención de Custodios');
  addText(ctx, data.formula, 9);
  ctx.y += 5;

  addSubsectionTitle(ctx, 'Resumen Anual');
  addKeyValue(ctx, 'Retención Promedio', formatPercent(data.yearlyData.retentionPromedio));
  addKeyValue(ctx, 'Total Retenidos', formatNumber(data.yearlyData.totalCustodiosRetenidos));
  addKeyValue(ctx, 'Tiempo Permanencia', `${data.yearlyData.tiempoPromedioPermanenciaGeneral.toFixed(1)} meses`);
  ctx.y += 8;

  addSubsectionTitle(ctx, 'Detalle Mensual');
  const headers = ['Mes', 'Anterior', 'Retenidos', 'Nuevos', 'Perdidos', 'Tasa'];
  const colWidths = [28, 28, 30, 28, 30, 28];
  const rows = data.monthlyBreakdown.map(m => [
    m.monthName,
    formatNumber(m.custodiosAnterior),
    formatNumber(m.custodiosRetenidos),
    formatNumber(m.custodiosNuevos),
    formatNumber(m.custodiosPerdidos),
    formatPercent(m.tasaRetencion)
  ]);
  addTable(ctx, headers, rows, colWidths);

  ctx.y += 5;
  addSubsectionTitle(ctx, 'Análisis de Cohortes');
  addCohortTable(ctx, data);
};

const renderEngagementSection = (ctx: PDFContext, data: EngagementReportData, sectionNumber: number): void => {
  startNewSection(ctx, 'Engagement', sectionNumber);
  
  addSectionTitle(ctx, 'Engagement');
  addText(ctx, data.formula, 9);
  ctx.y += 5;

  addSubsectionTitle(ctx, 'Datos del Período');
  addKeyValue(ctx, 'Total Servicios', formatNumber(data.yearlyData.totalServices));
  addKeyValue(ctx, 'Custodios Activos', formatNumber(data.yearlyData.totalCustodians));
  addKeyValue(ctx, 'Engagement Promedio', data.yearlyData.averageEngagement.toFixed(2) + ' servicios/mes');
  ctx.y += 8;

  addSubsectionTitle(ctx, 'Detalle Mensual');
  const headers = ['Mes', 'Servicios', 'Custodios', 'Engagement'];
  const colWidths = [35, 50, 50, 45];
  const rows = data.monthlyEvolution.map(m => [
    m.month,
    formatNumber(m.services),
    formatNumber(m.custodians),
    m.engagement.toFixed(2)
  ]);
  addTable(ctx, headers, rows, colWidths);
};

const renderSupplyGrowthSection = (ctx: PDFContext, data: SupplyGrowthReportData, sectionNumber: number): void => {
  startNewSection(ctx, 'Supply Growth', sectionNumber);
  
  addSectionTitle(ctx, 'Supply Growth - Crecimiento');

  addSubsectionTitle(ctx, 'Resumen Anual');
  addKeyValue(ctx, 'Crecimiento Promedio', formatPercent(data.summary.crecimientoPromedioMensual));
  addKeyValue(ctx, 'Crecimiento Neto', formatNumber(data.summary.crecimientoNetoAnual));
  addKeyValue(ctx, 'Custodios Activos', formatNumber(data.summary.custodiosActivosActuales));
  addKeyValue(ctx, 'Total Nuevos', formatNumber(data.summary.custodiosNuevosAnual));
  addKeyValue(ctx, 'Total Perdidos', formatNumber(data.summary.custodiosPerdidosAnual));
  ctx.y += 8;

  addSubsectionTitle(ctx, 'Insights');
  addKeyValue(ctx, 'Mejor Mes', `${data.summary.mejorMes.mes} (${formatPercent(data.summary.mejorMes.crecimiento)})`);
  addKeyValue(ctx, 'Peor Mes', `${data.summary.peorMes.mes} (${formatPercent(data.summary.peorMes.crecimiento)})`);
  ctx.y += 8;

  addSubsectionTitle(ctx, 'Detalle Mensual');
  const headers = ['Mes', 'Activos', 'Nuevos', 'Perdidos', 'Crec.'];
  const colWidths = [35, 40, 35, 35, 35];
  const rows = data.monthlyData.map(m => [
    m.monthName,
    formatNumber(m.custodiosActivos),
    formatNumber(m.custodiosNuevos),
    formatNumber(m.custodiosPerdidos),
    formatPercent(m.crecimientoPorcentual)
  ]);
  addTable(ctx, headers, rows, colWidths);
};

const renderConversionSection = (ctx: PDFContext, data: ConversionReportData, sectionNumber: number): void => {
  startNewSection(ctx, 'Conversión', sectionNumber);
  
  addSectionTitle(ctx, 'Conversión');
  addText(ctx, data.formula, 9);
  ctx.y += 5;

  addSubsectionTitle(ctx, 'Datos del Período');
  addKeyValue(ctx, 'Total Leads', formatNumber(data.yearlyData.totalLeads));
  addKeyValue(ctx, 'Convertidos', formatNumber(data.yearlyData.totalNewCustodians));
  addKeyValue(ctx, 'Tasa Conversión', formatPercent(data.yearlyData.conversionRate));
  ctx.y += 8;

  addSubsectionTitle(ctx, 'Detalle Mensual');
  const headers = ['Mes', 'Leads', 'Convertidos', 'Tasa'];
  const colWidths = [35, 50, 50, 45];
  const rows = data.monthlyBreakdown.map(m => [
    m.month,
    formatNumber(m.leads),
    formatNumber(m.newCustodians),
    formatPercent(m.conversionRate)
  ]);
  addTable(ctx, headers, rows, colWidths);
};

const renderCapacitySection = (ctx: PDFContext, data: CapacityReportData, sectionNumber: number): void => {
  startNewSection(ctx, 'Capacidad Operativa', sectionNumber);
  
  addSectionTitle(ctx, 'Capacidad Operativa');

  addSubsectionTitle(ctx, 'Capacidad Actual');
  addKeyValue(ctx, 'Custodios Totales', formatNumber(data.currentCapacity.totalCustodians));
  addKeyValue(ctx, 'Disponibles', formatNumber(data.currentCapacity.availableToday));
  addKeyValue(ctx, 'Retornando Foráneo', formatNumber(data.currentCapacity.unavailable.returningFromForeign));
  addKeyValue(ctx, 'En Ruta', formatNumber(data.currentCapacity.unavailable.currentlyOnRoute));
  ctx.y += 8;

  addSubsectionTitle(ctx, 'Capacidad por Tipo');
  addKeyValue(ctx, 'Locales (≤50km)', formatNumber(data.capacityByServiceType.local));
  addKeyValue(ctx, 'Regionales (51-200km)', formatNumber(data.capacityByServiceType.regional));
  addKeyValue(ctx, 'Foráneos (>200km)', formatNumber(data.capacityByServiceType.foraneo));
  ctx.y += 8;

  addSubsectionTitle(ctx, 'Utilización');
  addKeyValue(ctx, 'Actual', formatPercent(data.utilizationMetrics.current));
  addKeyValue(ctx, 'Objetivo', formatPercent(data.utilizationMetrics.healthy));
  addKeyValue(ctx, 'Máximo Seguro', formatPercent(data.utilizationMetrics.maxSafe));
  ctx.y += 8;

  addSubsectionTitle(ctx, 'Eficiencia de Flota');
  addKeyValue(ctx, 'Custodios Disponibles', formatNumber(data.fleetEfficiency.availableCustodians));
  addKeyValue(ctx, 'Servicios/Custodio/Mes', data.fleetEfficiency.servicesPerCustodianMonth.toFixed(1));
  addKeyValue(ctx, 'Eficiencia Operativa', formatPercent(data.fleetEfficiency.operationalEfficiency));
};

const renderOperationalSection = (ctx: PDFContext, data: OperationalReportData, sectionNumber: number): void => {
  startNewSection(ctx, 'Operacional', sectionNumber);
  
  addSectionTitle(ctx, 'Operacional');

  addSubsectionTitle(ctx, 'Servicios');
  addKeyValue(ctx, 'Total', formatNumber(data.services.total));
  addKeyValue(ctx, 'Completados', `${formatNumber(data.services.completed)} (${formatPercent(data.services.completedPercent)})`);
  addKeyValue(ctx, 'Cancelados', `${formatNumber(data.services.cancelled)} (${formatPercent(data.services.cancelledPercent)})`);
  addKeyValue(ctx, 'Pendientes', `${formatNumber(data.services.pending)} (${formatPercent(data.services.pendingPercent)})`);
  ctx.y += 8;

  addSubsectionTitle(ctx, 'GMV');
  addKeyValue(ctx, 'Total', formatCurrency(data.gmv.total));
  addKeyValue(ctx, 'AOV', formatCurrency(data.gmv.aov));
  ctx.y += 8;

  addSubsectionTitle(ctx, 'Top 10 Custodios por Cobro');
  addText(ctx, 'Solo custodios con datos de costo registrados', 8);
  const custodianHeaders = ['#', 'Nombre', 'Svcs', 'Meses', 'Cobro', 'Prom/Mes', 'Margen'];
  const custodianWidths = [12, 42, 18, 20, 30, 28, 30];
  const custodianRows = data.topCustodians.map(c => [
    c.rank.toString(),
    c.name.substring(0, 16),
    formatNumber(c.services),
    c.mesesActivos.toString(),
    formatCurrency(c.costoCustodio),
    formatCurrency(c.promedioCostoMes),
    formatCurrency(c.margen)
  ]);
  addTable(ctx, custodianHeaders, custodianRows, custodianWidths);

  addSubsectionTitle(ctx, 'Top 10 Clientes');
  const clientHeaders = ['#', 'Cliente', 'Servicios', 'GMV', 'AOV'];
  const clientWidths = [15, 60, 35, 40, 30];
  const clientRows = data.topClients.map(c => [
    c.rank.toString(),
    c.name.substring(0, 22),
    formatNumber(c.services),
    formatCurrency(c.gmv),
    formatCurrency(c.aov)
  ]);
  addTable(ctx, clientHeaders, clientRows, clientWidths);
};

const renderProjectionsSection = (ctx: PDFContext, data: ProjectionsReportData, sectionNumber: number): void => {
  startNewSection(ctx, 'Proyecciones', sectionNumber);
  
  addSectionTitle(ctx, 'Proyecciones');

  addSubsectionTitle(ctx, 'Precisión del Modelo');
  addKeyValue(ctx, 'MAPE Promedio', formatPercent(data.modelPrecision.mapePromedio));
  addKeyValue(ctx, 'Desviación Estándar', formatPercent(data.modelPrecision.desviacionEstandar));
  ctx.y += 8;

  addSubsectionTitle(ctx, 'Proyección Anual');
  addKeyValue(ctx, 'Escenario Optimista', formatNumber(data.annualProjection.optimistic));
  addKeyValue(ctx, 'Escenario Esperado', formatNumber(data.annualProjection.expected));
  addKeyValue(ctx, 'Escenario Conservador', formatNumber(data.annualProjection.conservative));
  ctx.y += 8;

  addSubsectionTitle(ctx, 'Forecast vs Real');
  const headers = ['Mes', 'Forecast', 'Real', 'Dif.', 'MAPE'];
  const colWidths = [30, 40, 40, 35, 35];
  const rows = data.forecastVsReal.map(m => [
    m.month,
    formatNumber(m.forecast),
    formatNumber(m.real),
    formatNumber(m.difference),
    formatPercent(m.mape)
  ]);
  addTable(ctx, headers, rows, colWidths);
};

// ============================================
// SECTION: CLIENTS ANALYSIS
// ============================================
const renderClientsSection = (ctx: PDFContext, data: ClientsReportData, sectionNumber: number): void => {
  startNewSection(ctx, 'Análisis de Clientes', sectionNumber);
  
  addSectionTitle(ctx, 'Análisis de Clientes');
  
  // ---- RESUMEN GENERAL ----
  addSubsectionTitle(ctx, 'Resumen General');
  addKeyValue(ctx, 'Total Clientes', formatNumber(data.summary.totalClients));
  addKeyValue(ctx, 'Clientes Activos', formatNumber(data.summary.activeClients));
  addKeyValue(ctx, 'Nuevos Clientes (Período)', formatNumber(data.summary.newClientsThisPeriod));
  addKeyValue(ctx, 'GMV Total', formatCurrency(data.summary.totalGMV));
  addKeyValue(ctx, 'Servicios Prom./Cliente', data.summary.avgServicesPerClient.toFixed(1));
  addKeyValue(ctx, 'GMV Prom./Cliente', formatCurrency(data.summary.avgGmvPerClient));
  ctx.y += SPACING.SUBSECTION_GAP;
  
  // ---- CONCENTRACIÓN DE INGRESOS ----
  addSubsectionTitle(ctx, 'Concentración de Ingresos');
  
  const boxY = ctx.y;
  ctx.pdf.setFillColor(...BACKGROUND_SUBTLE);
  ctx.pdf.setDrawColor(...BORDER_LIGHT);
  ctx.pdf.roundedRect(ctx.marginLeft, boxY, ctx.contentWidth, 40, 2, 2, 'FD');
  
  ctx.pdf.setFontSize(9);
  ctx.pdf.setTextColor(...CORPORATE_GRAY);
  ctx.pdf.text('ANÁLISIS DE CONCENTRACIÓN', ctx.marginLeft + 5, boxY + 10);
  
  ctx.pdf.setFontSize(10);
  ctx.pdf.setTextColor(...CORPORATE_BLACK);
  ctx.pdf.text(`Top 5% de clientes genera: ${formatPercent(data.clientConcentration.top5Percent)} del GMV`, 
    ctx.marginLeft + 5, boxY + 20);
  ctx.pdf.text(`Top 10% de clientes genera: ${formatPercent(data.clientConcentration.top10Percent)} del GMV`, 
    ctx.marginLeft + 5, boxY + 28);
  
  const hhi = data.clientConcentration.hhi;
  const hhiLevel = hhi < 1500 ? 'Baja' : hhi < 2500 ? 'Moderada' : 'Alta';
  ctx.pdf.text(`Índice HHI: ${formatNumber(hhi)} (Concentración ${hhiLevel})`, 
    ctx.marginLeft + 5, boxY + 36);
  
  ctx.y = boxY + 48;
  
  // ---- TOP CLIENTES ----
  if (data.topClients && data.topClients.length > 0) {
    checkNewPage(ctx, 100);
    addSubsectionTitle(ctx, 'Top 10 Clientes por GMV');
    
    const headers = ['#', 'Cliente', 'Servicios', 'GMV', 'AOV', 'Compl.'];
    const rows = data.topClients.slice(0, 10).map(c => [
      c.rank.toString(),
      c.name.substring(0, 22),
      formatNumber(c.services),
      formatCurrency(c.gmv),
      formatCurrency(c.aov),
      formatPercent(c.completionRate)
    ]);
    
    addTable(ctx, headers, rows, [12, 55, 25, 35, 35, 20]);
    ctx.y += SPACING.TABLE_AFTER;
  }
  
  // ---- ANÁLISIS POR TIPO DE SERVICIO ----
  if (data.serviceTypeAnalysis) {
    checkNewPage(ctx, 60);
    addSubsectionTitle(ctx, 'Análisis por Tipo de Servicio');
    
    const foraneo = data.serviceTypeAnalysis.foraneo;
    const local = data.serviceTypeAnalysis.local;
    const totalGMV = (foraneo?.gmv || 0) + (local?.gmv || 0);
    
    const typeHeaders = ['Tipo', 'Servicios', 'GMV', '% GMV', 'Valor Prom.'];
    const typeRows = [
      ['Foráneo', 
        formatNumber(foraneo?.count || 0),
        formatCurrency(foraneo?.gmv || 0),
        totalGMV > 0 ? formatPercent((foraneo?.gmv || 0) / totalGMV * 100) : '0%',
        formatCurrency(foraneo?.avgValue || 0)
      ],
      ['Local', 
        formatNumber(local?.count || 0),
        formatCurrency(local?.gmv || 0),
        totalGMV > 0 ? formatPercent((local?.gmv || 0) / totalGMV * 100) : '0%',
        formatCurrency(local?.avgValue || 0)
      ]
    ];
    
    addTable(ctx, typeHeaders, typeRows, [30, 30, 40, 30, 40]);
  }
};

// ============================================
// MAIN EXPORT FUNCTION
// ============================================
export const exportHistoricalReportToPDF = async (
  config: HistoricalReportConfig,
  data: HistoricalReportData
): Promise<boolean> => {
  try {
    document.body.style.cursor = 'wait';

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const generatedAt = new Date();

    const ctx: PDFContext = {
      pdf,
      y: 20,
      pageHeight: 297,
      marginLeft: 15,
      marginRight: 15,
      contentWidth: 180,
      currentSectionTitle: 'Portada',
      currentSectionNumber: 0,
      periodLabel: data.periodLabel,
      generatedAt
    };

    // ============================================
    // PAGE 1: COVER PAGE
    // ============================================
    renderCoverPage(ctx, config, data);

    // ============================================
    // PAGE 2: EXECUTIVE SUMMARY
    // ============================================
    renderExecutiveSummary(ctx, data);

    // ============================================
    // PAGE 3: TABLE OF CONTENTS
    // ============================================
    renderTableOfContents(ctx, config);

    // ============================================
    // CONTENT SECTIONS
    // ============================================
    let sectionNumber = 0;

    config.modules.forEach(module => {
      sectionNumber++;
      
      switch (module) {
        case 'cpa':
          if (data.cpa) renderCPASection(ctx, data.cpa, sectionNumber);
          break;
        case 'ltv':
          if (data.ltv) renderLTVSection(ctx, data.ltv, sectionNumber);
          break;
        case 'retention':
          if (data.retention) renderRetentionSection(ctx, data.retention, sectionNumber);
          break;
        case 'engagement':
          if (data.engagement) renderEngagementSection(ctx, data.engagement, sectionNumber);
          break;
        case 'supply_growth':
          if (data.supplyGrowth) renderSupplyGrowthSection(ctx, data.supplyGrowth, sectionNumber);
          break;
        case 'conversion':
          if (data.conversion) renderConversionSection(ctx, data.conversion, sectionNumber);
          break;
        case 'capacity':
          if (data.capacity) renderCapacitySection(ctx, data.capacity, sectionNumber);
          break;
        case 'operational':
          if (data.operational) renderOperationalSection(ctx, data.operational, sectionNumber);
          break;
        case 'projections':
          if (data.projections) renderProjectionsSection(ctx, data.projections, sectionNumber);
          break;
        case 'clients':
          if (data.clients) renderClientsSection(ctx, data.clients, sectionNumber);
          break;
      }
    });

    // ============================================
    // ADD FOOTERS TO ALL PAGES
    // ============================================
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      addPageFooter(ctx, i, totalPages);
    }

    // ============================================
    // SAVE PDF
    // ============================================
    const filename = `informe-historico-${config.year}${config.month ? `-${String(config.month).padStart(2, '0')}` : ''}-${format(generatedAt, 'yyyyMMdd-HHmm')}.pdf`;
    pdf.save(filename);

    document.body.style.cursor = 'default';
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    document.body.style.cursor = 'default';
    throw error;
  }
};
