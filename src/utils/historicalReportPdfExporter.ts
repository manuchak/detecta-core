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
  ProjectionsReportData
} from '@/types/reports';

const CORPORATE_RED = [235, 0, 0] as const;
const CORPORATE_BLACK = [25, 25, 25] as const;
const CORPORATE_GRAY = [100, 100, 100] as const;
const LIGHT_GRAY = [240, 240, 240] as const;
const WHITE = [255, 255, 255] as const;

interface PDFContext {
  pdf: jsPDF;
  y: number;
  pageHeight: number;
  marginLeft: number;
  marginRight: number;
  contentWidth: number;
}

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

const checkNewPage = (ctx: PDFContext, neededHeight: number): void => {
  if (ctx.y + neededHeight > ctx.pageHeight - 20) {
    ctx.pdf.addPage();
    ctx.y = 20;
  }
};

const addSectionTitle = (ctx: PDFContext, title: string): void => {
  checkNewPage(ctx, 20);
  ctx.pdf.setFontSize(16);
  ctx.pdf.setTextColor(...CORPORATE_RED);
  ctx.pdf.text(title, ctx.marginLeft, ctx.y);
  ctx.y += 10;
};

const addSubsectionTitle = (ctx: PDFContext, title: string): void => {
  checkNewPage(ctx, 15);
  ctx.pdf.setFontSize(12);
  ctx.pdf.setTextColor(...CORPORATE_BLACK);
  ctx.pdf.setFont('helvetica', 'bold');
  ctx.pdf.text(title, ctx.marginLeft, ctx.y);
  ctx.pdf.setFont('helvetica', 'normal');
  ctx.y += 8;
};

const addText = (ctx: PDFContext, text: string, fontSize: number = 10): void => {
  checkNewPage(ctx, 8);
  ctx.pdf.setFontSize(fontSize);
  ctx.pdf.setTextColor(...CORPORATE_BLACK);
  ctx.pdf.text(text, ctx.marginLeft, ctx.y);
  ctx.y += 6;
};

const addKeyValue = (ctx: PDFContext, key: string, value: string): void => {
  checkNewPage(ctx, 8);
  ctx.pdf.setFontSize(10);
  ctx.pdf.setTextColor(...CORPORATE_GRAY);
  ctx.pdf.text(key + ':', ctx.marginLeft, ctx.y);
  ctx.pdf.setTextColor(...CORPORATE_BLACK);
  ctx.pdf.setFont('helvetica', 'bold');
  ctx.pdf.text(value, ctx.marginLeft + 60, ctx.y);
  ctx.pdf.setFont('helvetica', 'normal');
  ctx.y += 6;
};

const addTable = (ctx: PDFContext, headers: string[], rows: string[][], colWidths: number[]): void => {
  const rowHeight = 8;
  const tableHeight = (rows.length + 1) * rowHeight + 4;
  checkNewPage(ctx, tableHeight);

  // Header
  ctx.pdf.setFillColor(...CORPORATE_RED);
  ctx.pdf.rect(ctx.marginLeft, ctx.y - 5, ctx.contentWidth, rowHeight, 'F');
  ctx.pdf.setTextColor(...WHITE);
  ctx.pdf.setFontSize(9);
  ctx.pdf.setFont('helvetica', 'bold');

  let x = ctx.marginLeft + 2;
  headers.forEach((header, i) => {
    ctx.pdf.text(header, x, ctx.y);
    x += colWidths[i];
  });
  ctx.y += rowHeight;

  // Rows
  ctx.pdf.setFont('helvetica', 'normal');
  ctx.pdf.setTextColor(...CORPORATE_BLACK);

  rows.forEach((row, rowIndex) => {
    if (rowIndex % 2 === 0) {
      ctx.pdf.setFillColor(...LIGHT_GRAY);
      ctx.pdf.rect(ctx.marginLeft, ctx.y - 5, ctx.contentWidth, rowHeight, 'F');
    }

    x = ctx.marginLeft + 2;
    row.forEach((cell, i) => {
      ctx.pdf.text(cell, x, ctx.y);
      x += colWidths[i];
    });
    ctx.y += rowHeight;
  });

  ctx.y += 5;
};

// Section renderers
const renderCPASection = (ctx: PDFContext, data: CPAReportData): void => {
  addSectionTitle(ctx, 'CPA - Costo por Adquisición');
  
  addText(ctx, data.formula, 9);
  ctx.y += 5;

  addSubsectionTitle(ctx, 'Acumulado Anual');
  addKeyValue(ctx, 'Costos Totales', formatCurrency(data.yearlyData.totalCosts));
  addKeyValue(ctx, 'Custodios Nuevos', formatNumber(data.yearlyData.newCustodians));
  addKeyValue(ctx, 'CPA Promedio', formatCurrency(data.yearlyData.cpaPromedio));
  ctx.y += 5;

  addSubsectionTitle(ctx, 'Desglose de Costos');
  data.yearlyData.costBreakdown.forEach(item => {
    addKeyValue(ctx, item.category, `${formatCurrency(item.amount)} (${formatPercent(item.percentage)})`);
  });
  ctx.y += 5;

  addSubsectionTitle(ctx, 'Detalle Mensual');
  const headers = ['Mes', 'Costos', 'Nuevos', 'CPA'];
  const colWidths = [30, 50, 40, 50];
  const rows = data.monthlyEvolution.map(m => [
    m.month,
    formatCurrency(m.costs),
    formatNumber(m.newCustodians),
    formatCurrency(m.cpa)
  ]);
  addTable(ctx, headers, rows, colWidths);
};

const renderLTVSection = (ctx: PDFContext, data: LTVReportData): void => {
  addSectionTitle(ctx, 'LTV - Lifetime Value');
  
  addText(ctx, data.formula, 9);
  ctx.y += 5;

  addSubsectionTitle(ctx, 'Datos del Período');
  addKeyValue(ctx, 'Custodios Activos', formatNumber(data.yearlyData.totalCustodios));
  addKeyValue(ctx, 'Ingresos Totales', formatCurrency(data.yearlyData.ingresosTotales));
  addKeyValue(ctx, 'Ingreso/Custodio', formatCurrency(data.yearlyData.ingresoPromedioPorCustodio));
  addKeyValue(ctx, 'LTV General', formatCurrency(data.yearlyData.ltvGeneral));
  addKeyValue(ctx, 'Tiempo Vida Promedio', `${data.tiempoVidaPromedio} meses`);
  ctx.y += 5;

  addSubsectionTitle(ctx, 'Comparativo MoM');
  addKeyValue(ctx, 'LTV Actual', formatCurrency(data.momComparison.ltvActual));
  addKeyValue(ctx, 'LTV Mes Anterior', formatCurrency(data.momComparison.ltvMesAnterior));
  addKeyValue(ctx, 'Cambio Absoluto', formatCurrency(data.momComparison.cambioAbsoluto));
  addKeyValue(ctx, 'Cambio Relativo', formatPercent(data.momComparison.cambioRelativo));
  ctx.y += 5;

  addSubsectionTitle(ctx, 'Análisis Trimestral');
  const headers = ['Trimestre', 'LTV', 'Custodios', 'Ingresos'];
  const colWidths = [35, 40, 40, 50];
  const rows = data.quarterlyData.map(q => [
    q.quarter,
    formatCurrency(q.ltvPromedio),
    formatNumber(q.custodiosPromedio),
    formatCurrency(q.ingresosTotales)
  ]);
  addTable(ctx, headers, rows, colWidths);
};

const renderRetentionSection = (ctx: PDFContext, data: RetentionReportData): void => {
  addSectionTitle(ctx, 'Retención');
  
  addText(ctx, data.formula, 9);
  ctx.y += 5;

  addSubsectionTitle(ctx, 'Resumen Anual');
  addKeyValue(ctx, 'Retención Promedio', formatPercent(data.yearlyData.retentionPromedio));
  addKeyValue(ctx, 'Total Retenidos', formatNumber(data.yearlyData.totalCustodiosRetenidos));
  addKeyValue(ctx, 'Tiempo Permanencia', `${data.yearlyData.tiempoPromedioPermanenciaGeneral.toFixed(1)} meses`);
  ctx.y += 5;

  addSubsectionTitle(ctx, 'Detalle Mensual');
  const headers = ['Mes', 'Anterior', 'Retenidos', 'Nuevos', 'Perdidos', 'Tasa'];
  const colWidths = [25, 30, 30, 25, 30, 30];
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
  const cohortHeaders = ['Cohorte', 'Mes 0', 'Mes 1', 'Mes 2', 'Mes 3', 'Mes 4', 'Mes 5', 'Mes 6'];
  const cohortWidths = [30, 20, 20, 20, 20, 20, 20, 20];
  const cohortRows = data.cohortAnalysis.map(c => [
    c.cohortMonth,
    formatNumber(c.month0),
    formatPercent(c.month1),
    formatPercent(c.month2),
    formatPercent(c.month3),
    formatPercent(c.month4),
    formatPercent(c.month5),
    formatPercent(c.month6)
  ]);
  addTable(ctx, cohortHeaders, cohortRows, cohortWidths);
};

const renderEngagementSection = (ctx: PDFContext, data: EngagementReportData): void => {
  addSectionTitle(ctx, 'Engagement');
  
  addText(ctx, data.formula, 9);
  ctx.y += 5;

  addSubsectionTitle(ctx, 'Datos del Período');
  addKeyValue(ctx, 'Total Servicios', formatNumber(data.yearlyData.totalServices));
  addKeyValue(ctx, 'Custodios Activos', formatNumber(data.yearlyData.totalCustodians));
  addKeyValue(ctx, 'Engagement Promedio', data.yearlyData.averageEngagement.toFixed(2) + ' servicios/mes');
  ctx.y += 5;

  addSubsectionTitle(ctx, 'Detalle Mensual');
  const headers = ['Mes', 'Servicios', 'Custodios', 'Engagement'];
  const colWidths = [30, 50, 50, 50];
  const rows = data.monthlyEvolution.map(m => [
    m.month,
    formatNumber(m.services),
    formatNumber(m.custodians),
    m.engagement.toFixed(2)
  ]);
  addTable(ctx, headers, rows, colWidths);
};

const renderSupplyGrowthSection = (ctx: PDFContext, data: SupplyGrowthReportData): void => {
  addSectionTitle(ctx, 'Supply Growth - Crecimiento');
  
  addSubsectionTitle(ctx, 'Resumen Anual');
  addKeyValue(ctx, 'Crecimiento Promedio', formatPercent(data.summary.crecimientoPromedioMensual));
  addKeyValue(ctx, 'Crecimiento Neto', formatNumber(data.summary.crecimientoNetoAnual));
  addKeyValue(ctx, 'Custodios Activos', formatNumber(data.summary.custodiosActivosActuales));
  addKeyValue(ctx, 'Total Nuevos', formatNumber(data.summary.custodiosNuevosAnual));
  addKeyValue(ctx, 'Total Perdidos', formatNumber(data.summary.custodiosPerdidosAnual));
  ctx.y += 5;

  addSubsectionTitle(ctx, 'Insights');
  addKeyValue(ctx, 'Mejor Mes', `${data.summary.mejorMes.mes} (${formatPercent(data.summary.mejorMes.crecimiento)})`);
  addKeyValue(ctx, 'Peor Mes', `${data.summary.peorMes.mes} (${formatPercent(data.summary.peorMes.crecimiento)})`);
  ctx.y += 5;

  addSubsectionTitle(ctx, 'Detalle Mensual');
  const headers = ['Mes', 'Activos', 'Nuevos', 'Perdidos', 'Crec.'];
  const colWidths = [30, 35, 30, 30, 30];
  const rows = data.monthlyData.map(m => [
    m.monthName,
    formatNumber(m.custodiosActivos),
    formatNumber(m.custodiosNuevos),
    formatNumber(m.custodiosPerdidos),
    formatPercent(m.crecimientoPorcentual)
  ]);
  addTable(ctx, headers, rows, colWidths);
};

const renderConversionSection = (ctx: PDFContext, data: ConversionReportData): void => {
  addSectionTitle(ctx, 'Conversión');
  
  addText(ctx, data.formula, 9);
  ctx.y += 5;

  addSubsectionTitle(ctx, 'Datos del Período');
  addKeyValue(ctx, 'Total Leads', formatNumber(data.yearlyData.totalLeads));
  addKeyValue(ctx, 'Convertidos', formatNumber(data.yearlyData.totalNewCustodians));
  addKeyValue(ctx, 'Tasa Conversión', formatPercent(data.yearlyData.conversionRate));
  ctx.y += 5;

  addSubsectionTitle(ctx, 'Detalle Mensual');
  const headers = ['Mes', 'Leads', 'Convertidos', 'Tasa'];
  const colWidths = [30, 50, 50, 50];
  const rows = data.monthlyBreakdown.map(m => [
    m.month,
    formatNumber(m.leads),
    formatNumber(m.newCustodians),
    formatPercent(m.conversionRate)
  ]);
  addTable(ctx, headers, rows, colWidths);
};

const renderCapacitySection = (ctx: PDFContext, data: CapacityReportData): void => {
  addSectionTitle(ctx, 'Capacidad Operativa');
  
  addSubsectionTitle(ctx, 'Capacidad Actual');
  addKeyValue(ctx, 'Custodios Totales', formatNumber(data.currentCapacity.totalCustodians));
  addKeyValue(ctx, 'Disponibles', formatNumber(data.currentCapacity.availableToday));
  addKeyValue(ctx, 'Retornando Foráneo', formatNumber(data.currentCapacity.unavailable.returningFromForeign));
  addKeyValue(ctx, 'En Ruta', formatNumber(data.currentCapacity.unavailable.currentlyOnRoute));
  ctx.y += 5;

  addSubsectionTitle(ctx, 'Capacidad por Tipo');
  addKeyValue(ctx, 'Locales (≤50km)', formatNumber(data.capacityByServiceType.local));
  addKeyValue(ctx, 'Regionales (51-200km)', formatNumber(data.capacityByServiceType.regional));
  addKeyValue(ctx, 'Foráneos (>200km)', formatNumber(data.capacityByServiceType.foraneo));
  ctx.y += 5;

  addSubsectionTitle(ctx, 'Utilización');
  addKeyValue(ctx, 'Actual', formatPercent(data.utilizationMetrics.current));
  addKeyValue(ctx, 'Objetivo', formatPercent(data.utilizationMetrics.healthy));
  addKeyValue(ctx, 'Máximo Seguro', formatPercent(data.utilizationMetrics.maxSafe));
  ctx.y += 5;

  addSubsectionTitle(ctx, 'Eficiencia de Flota');
  addKeyValue(ctx, 'Custodios Disponibles', formatNumber(data.fleetEfficiency.availableCustodians));
  addKeyValue(ctx, 'Servicios/Custodio/Mes', data.fleetEfficiency.servicesPerCustodianMonth.toFixed(1));
  addKeyValue(ctx, 'Eficiencia Operativa', formatPercent(data.fleetEfficiency.operationalEfficiency));
};

const renderOperationalSection = (ctx: PDFContext, data: OperationalReportData): void => {
  addSectionTitle(ctx, 'Operacional');
  
  addSubsectionTitle(ctx, 'Servicios');
  addKeyValue(ctx, 'Total', formatNumber(data.services.total));
  addKeyValue(ctx, 'Completados', `${formatNumber(data.services.completed)} (${formatPercent(data.services.completedPercent)})`);
  addKeyValue(ctx, 'Cancelados', `${formatNumber(data.services.cancelled)} (${formatPercent(data.services.cancelledPercent)})`);
  addKeyValue(ctx, 'Pendientes', `${formatNumber(data.services.pending)} (${formatPercent(data.services.pendingPercent)})`);
  ctx.y += 5;

  addSubsectionTitle(ctx, 'GMV');
  addKeyValue(ctx, 'Total', formatCurrency(data.gmv.total));
  addKeyValue(ctx, 'AOV', formatCurrency(data.gmv.aov));
  ctx.y += 5;

  addSubsectionTitle(ctx, 'Top 10 Custodios por Cobro');
  addText(ctx, 'Solo custodios con datos de costo registrados', 8);
  const custodianHeaders = ['#', 'Nombre', 'Svcs', 'Meses', 'Cobro', 'Prom/Mes', 'Margen'];
  const custodianWidths = [10, 45, 20, 20, 30, 30, 30];
  const custodianRows = data.topCustodians.map(c => [
    c.rank.toString(),
    c.name.substring(0, 18),
    formatNumber(c.services),
    c.mesesActivos.toString(),
    formatCurrency(c.costoCustodio),
    formatCurrency(c.promedioCostoMes),
    formatCurrency(c.margen)
  ]);
  addTable(ctx, custodianHeaders, custodianRows, custodianWidths);

  addSubsectionTitle(ctx, 'Top 10 Clientes');
  const clientHeaders = ['#', 'Cliente', 'Servicios', 'GMV', 'AOV'];
  const clientWidths = [15, 55, 35, 40, 35];
  const clientRows = data.topClients.map(c => [
    c.rank.toString(),
    c.name.substring(0, 20),
    formatNumber(c.services),
    formatCurrency(c.gmv),
    formatCurrency(c.aov)
  ]);
  addTable(ctx, clientHeaders, clientRows, clientWidths);
};

const renderProjectionsSection = (ctx: PDFContext, data: ProjectionsReportData): void => {
  addSectionTitle(ctx, 'Proyecciones');
  
  addSubsectionTitle(ctx, 'Precisión del Modelo');
  addKeyValue(ctx, 'MAPE Promedio', formatPercent(data.modelPrecision.mapePromedio));
  addKeyValue(ctx, 'Desviación Estándar', formatPercent(data.modelPrecision.desviacionEstandar));
  ctx.y += 5;

  addSubsectionTitle(ctx, 'Proyección Anual');
  addKeyValue(ctx, 'Escenario Optimista', formatNumber(data.annualProjection.optimistic));
  addKeyValue(ctx, 'Escenario Esperado', formatNumber(data.annualProjection.expected));
  addKeyValue(ctx, 'Escenario Conservador', formatNumber(data.annualProjection.conservative));
  ctx.y += 5;

  addSubsectionTitle(ctx, 'Forecast vs Real');
  const headers = ['Mes', 'Forecast', 'Real', 'Dif.', 'MAPE'];
  const colWidths = [25, 40, 40, 35, 30];
  const rows = data.forecastVsReal.map(m => [
    m.month,
    formatNumber(m.forecast),
    formatNumber(m.real),
    formatNumber(m.difference),
    formatPercent(m.mape)
  ]);
  addTable(ctx, headers, rows, colWidths);
};

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

    const ctx: PDFContext = {
      pdf,
      y: 20,
      pageHeight: 297,
      marginLeft: 15,
      marginRight: 15,
      contentWidth: 180
    };

    // Cover page
    pdf.setFontSize(28);
    pdf.setTextColor(...CORPORATE_RED);
    pdf.text('Informe Histórico', ctx.marginLeft, 60);
    
    pdf.setFontSize(18);
    pdf.setTextColor(...CORPORATE_BLACK);
    pdf.text(data.periodLabel, ctx.marginLeft, 75);
    
    pdf.setFontSize(12);
    pdf.setTextColor(...CORPORATE_GRAY);
    pdf.text(`Generado el ${format(new Date(), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}`, ctx.marginLeft, 90);

    // Table of contents
    pdf.setFontSize(14);
    pdf.setTextColor(...CORPORATE_BLACK);
    pdf.text('Contenido:', ctx.marginLeft, 110);
    
    let tocY = 120;
    pdf.setFontSize(11);
    const moduleNames: Record<string, string> = {
      cpa: 'CPA - Costo por Adquisición',
      ltv: 'LTV - Lifetime Value',
      retention: 'Retención',
      engagement: 'Engagement',
      supply_growth: 'Supply Growth',
      conversion: 'Conversión',
      capacity: 'Capacidad Operativa',
      operational: 'Operacional',
      projections: 'Proyecciones'
    };
    config.modules.forEach((module, i) => {
      pdf.text(`${i + 1}. ${moduleNames[module]}`, ctx.marginLeft + 5, tocY);
      tocY += 8;
    });

    // Content pages
    pdf.addPage();
    ctx.y = 20;

    config.modules.forEach(module => {
      switch (module) {
        case 'cpa':
          if (data.cpa) renderCPASection(ctx, data.cpa);
          break;
        case 'ltv':
          if (data.ltv) renderLTVSection(ctx, data.ltv);
          break;
        case 'retention':
          if (data.retention) renderRetentionSection(ctx, data.retention);
          break;
        case 'engagement':
          if (data.engagement) renderEngagementSection(ctx, data.engagement);
          break;
        case 'supply_growth':
          if (data.supplyGrowth) renderSupplyGrowthSection(ctx, data.supplyGrowth);
          break;
        case 'conversion':
          if (data.conversion) renderConversionSection(ctx, data.conversion);
          break;
        case 'capacity':
          if (data.capacity) renderCapacitySection(ctx, data.capacity);
          break;
        case 'operational':
          if (data.operational) renderOperationalSection(ctx, data.operational);
          break;
        case 'projections':
          if (data.projections) renderProjectionsSection(ctx, data.projections);
          break;
      }
      ctx.y += 10;
    });

    // Footer on all pages
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(...CORPORATE_GRAY);
      pdf.text(`Página ${i} de ${totalPages} • Informe Histórico`, ctx.marginLeft, 290);
    }

    // Save
    const filename = `informe-historico-${config.year}${config.month ? `-${String(config.month).padStart(2, '0')}` : ''}-${format(new Date(), 'yyyyMMdd-HHmm')}.pdf`;
    pdf.save(filename);

    document.body.style.cursor = 'default';
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    document.body.style.cursor = 'default';
    throw error;
  }
};
