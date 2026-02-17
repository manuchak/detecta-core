import React from 'react';
import { View } from '@react-pdf/renderer';
import { ReportPage } from '@/components/pdf/ReportPage';
import { SectionHeader } from '@/components/pdf/SectionHeader';
import { FieldGroup } from '@/components/pdf/FieldGroup';
import { DataTable } from '@/components/pdf/DataTable';
import { InsightBox } from '@/components/pdf/InsightBox';
import { PDFStackedBarChart } from '@/components/pdf/charts';
import { PDF_COLORS } from '@/components/pdf/tokens';
import { formatNumber, formatPercent } from '../formatUtils';
import type { SupplyGrowthReportData } from '@/types/reports';

interface Props { data: SupplyGrowthReportData; periodLabel: string; logoBase64?: string | null }

export const SupplyGrowthSection: React.FC<Props> = ({ data, periodLabel, logoBase64 }) => {
  const chartLabels = data.monthlyData.map(m => m.monthName);
  const chartSeries = [
    { name: 'Nuevos', color: PDF_COLORS.success, data: data.monthlyData.map(m => m.custodiosNuevos) },
    { name: 'Perdidos', color: PDF_COLORS.danger, data: data.monthlyData.map(m => m.custodiosPerdidos) },
  ];

  return (
    <ReportPage title="Informe Histórico" subtitle={periodLabel} logoBase64={logoBase64}>
      <SectionHeader title="Supply Growth - Crecimiento" />

      <FieldGroup
        title="Resumen Anual"
        fields={[
          ['Crecimiento Promedio', formatPercent(data.summary.crecimientoPromedioMensual)],
          ['Crecimiento Neto', formatNumber(data.summary.crecimientoNetoAnual)],
          ['Custodios Activos', formatNumber(data.summary.custodiosActivosActuales)],
          ['Total Nuevos', formatNumber(data.summary.custodiosNuevosAnual)],
          ['Total Perdidos', formatNumber(data.summary.custodiosPerdidosAnual)],
        ]}
      />

      {chartLabels.length > 0 && (
        <View wrap={false} style={{ marginVertical: 8 }}>
          <PDFStackedBarChart labels={chartLabels} series={chartSeries} title="Nuevos vs Perdidos por Mes" height={190} />
        </View>
      )}

      <InsightBox
        text={`Mejor mes: ${data.summary.mejorMes.mes} (${formatPercent(data.summary.mejorMes.crecimiento)}) | Peor mes: ${data.summary.peorMes.mes} (${formatPercent(data.summary.peorMes.crecimiento)})`}
        positive={data.summary.crecimientoNetoAnual > 0}
      />

      <DataTable
        title="Detalle Mensual"
        columns={[
          { header: 'Mes', accessor: 'monthName', flex: 2 },
          { header: 'Activos', accessor: (r) => formatNumber(r.custodiosActivos), flex: 1.5, align: 'right' },
          { header: 'Nuevos', accessor: (r) => formatNumber(r.custodiosNuevos), flex: 1.5, align: 'right' },
          { header: 'Perdidos', accessor: (r) => formatNumber(r.custodiosPerdidos), flex: 1.5, align: 'right' },
          { header: 'Crec.', accessor: (r) => formatPercent(r.crecimientoPorcentual), flex: 1.5, align: 'right' },
        ]}
        data={data.monthlyData}
      />
    </ReportPage>
  );
};
