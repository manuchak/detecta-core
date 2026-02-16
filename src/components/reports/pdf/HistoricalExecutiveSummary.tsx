import React from 'react';
import { Page, View, Text } from '@react-pdf/renderer';
import { pdfBaseStyles } from '@/components/pdf/styles';
import { PDF_COLORS } from '@/components/pdf/tokens';
import { SectionHeader } from '@/components/pdf/SectionHeader';
import { KPIRow, type KPIItem } from '@/components/pdf/KPIRow';
import { ReportHeader } from '@/components/pdf/ReportHeader';
import { ReportFooter } from '@/components/pdf/ReportFooter';
import { registerPDFFonts } from '@/components/pdf/fontSetup';
import { formatCurrency, formatNumber, formatPercent } from './formatUtils';
import type { HistoricalReportData } from '@/types/reports';

registerPDFFonts();

interface Props {
  data: HistoricalReportData;
}

export const HistoricalExecutiveSummary: React.FC<Props> = ({ data }) => {
  const kpis: KPIItem[] = [];

  if (data.cpa?.yearlyData) {
    kpis.push({ label: 'CPA Promedio', value: formatCurrency(data.cpa.yearlyData.cpaPromedio) });
  }
  if (data.ltv?.yearlyData) {
    kpis.push({ label: 'LTV General', value: formatCurrency(data.ltv.yearlyData.ltvGeneral) });
    if (data.cpa?.yearlyData?.cpaPromedio && data.cpa.yearlyData.cpaPromedio > 0) {
      const ratio = data.ltv.yearlyData.ltvGeneral / data.cpa.yearlyData.cpaPromedio;
      kpis.push({
        label: 'LTV/CPA Ratio',
        value: ratio.toFixed(1) + 'x',
        trend: ratio >= 3 ? 'Saludable' : ratio >= 2 ? 'Aceptable' : 'Atención',
        trendUp: ratio >= 2,
      });
    }
  }
  if (data.retention?.yearlyData) {
    kpis.push({
      label: 'Retención Promedio',
      value: formatPercent(data.retention.yearlyData.retentionPromedio),
      trendUp: data.retention.yearlyData.retentionPromedio >= 80,
    });
  }

  const gmvTotal = data.operational?.gmv?.total || data.clients?.summary?.totalGMV || 0;
  const aov = data.operational?.gmv?.aov ||
    (data.clients?.summary?.totalGMV && data.clients?.summary?.activeClients
      ? data.clients.summary.totalGMV / data.clients.summary.activeClients
      : 0);
  if (gmvTotal > 0) {
    kpis.push({ label: 'GMV Total', value: formatCurrency(gmvTotal) });
    kpis.push({ label: 'AOV', value: formatCurrency(aov) });
  }
  if (data.operational?.services?.total) {
    kpis.push({ label: 'Servicios Totales', value: formatNumber(data.operational.services.total) });
  }
  if (data.clients?.summary?.activeClients) {
    kpis.push({ label: 'Clientes Activos', value: formatNumber(data.clients.summary.activeClients) });
  }
  if (data.supplyGrowth?.summary) {
    kpis.push({
      label: 'Crecimiento Neto',
      value: formatNumber(data.supplyGrowth.summary.crecimientoNetoAnual),
      trend: formatPercent(data.supplyGrowth.summary.crecimientoPromedioMensual) + '/mes',
      trendUp: data.supplyGrowth.summary.crecimientoNetoAnual > 0,
    });
  }
  if (data.conversion?.yearlyData) {
    kpis.push({ label: 'Tasa Conversión', value: formatPercent(data.conversion.yearlyData.conversionRate) });
  }

  // Highlights
  const highlights: { text: string; positive: boolean }[] = [];
  if (data.ltv?.yearlyData && data.cpa?.yearlyData) {
    const ratio = data.ltv.yearlyData.ltvGeneral / data.cpa.yearlyData.cpaPromedio;
    if (ratio >= 3) highlights.push({ text: `Ratio LTV/CPA saludable de ${ratio.toFixed(1)}x`, positive: true });
    else if (ratio < 2) highlights.push({ text: `Ratio LTV/CPA bajo (${ratio.toFixed(1)}x) - revisar costos de adquisición`, positive: false });
  }
  if (data.retention?.yearlyData) {
    if (data.retention.yearlyData.retentionPromedio >= 85)
      highlights.push({ text: `Excelente retención: ${formatPercent(data.retention.yearlyData.retentionPromedio)}`, positive: true });
    else if (data.retention.yearlyData.retentionPromedio < 70)
      highlights.push({ text: `Retención por debajo del objetivo: ${formatPercent(data.retention.yearlyData.retentionPromedio)}`, positive: false });
  }
  if (data.supplyGrowth?.summary?.crecimientoNetoAnual && data.supplyGrowth.summary.crecimientoNetoAnual > 0) {
    highlights.push({ text: `Crecimiento neto positivo: +${formatNumber(data.supplyGrowth.summary.crecimientoNetoAnual)} custodios`, positive: true });
  }

  return (
    <Page size="A4" style={pdfBaseStyles.page} wrap>
      <ReportHeader title="Informe Histórico" subtitle={data.periodLabel} />
      <ReportFooter />

      <SectionHeader title="Resumen Ejecutivo" />
      <KPIRow items={kpis.slice(0, 8)} />

      {highlights.length > 0 && (
        <View style={{ marginTop: 10 }}>
          <Text style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: PDF_COLORS.black }}>
            Highlights del Período
          </Text>
          {highlights.slice(0, 5).map((h, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: h.positive ? PDF_COLORS.success : PDF_COLORS.danger,
                  marginRight: 6,
                }}
              />
              <Text style={{ fontSize: 9, color: PDF_COLORS.black }}>{h.text}</Text>
            </View>
          ))}
        </View>
      )}

      {highlights.length === 0 && (
        <Text style={{ fontSize: 9, color: PDF_COLORS.gray, marginTop: 10 }}>
          No hay alertas críticas en este período.
        </Text>
      )}
    </Page>
  );
};
