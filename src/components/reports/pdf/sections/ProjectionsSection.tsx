import React from 'react';
import { View } from '@react-pdf/renderer';
import { ReportPage } from '@/components/pdf/ReportPage';
import { SectionHeader } from '@/components/pdf/SectionHeader';
import { FieldGroup } from '@/components/pdf/FieldGroup';
import { DataTable } from '@/components/pdf/DataTable';
import { PDFLineChart } from '@/components/pdf/charts';
import { PDF_COLORS } from '@/components/pdf/tokens';
import { formatNumber, formatPercent } from '../formatUtils';
import type { ProjectionsReportData } from '@/types/reports';

interface Props { data: ProjectionsReportData; periodLabel: string; logoBase64?: string | null }

export const ProjectionsSection: React.FC<Props> = ({ data, periodLabel, logoBase64 }) => {
  const chartLabels = data.forecastVsReal.map(m => m.month);
  const chartSeries = [
    { name: 'Forecast', color: PDF_COLORS.info, data: data.forecastVsReal.map(m => m.forecast) },
    { name: 'Real', color: PDF_COLORS.success, data: data.forecastVsReal.map(m => m.real) },
  ];

  return (
    <ReportPage title="Informe Histórico" subtitle={periodLabel} logoBase64={logoBase64}>
      <SectionHeader title="Proyecciones" />

      <FieldGroup
        title="Precisión del Modelo"
        fields={[
          ['MAPE Promedio', formatPercent(data.modelPrecision.mapePromedio)],
          ['Desviación Estándar', formatPercent(data.modelPrecision.desviacionEstandar)],
        ]}
      />

      {chartLabels.length > 0 && (
        <View wrap={false} style={{ marginVertical: 8 }}>
          <PDFLineChart labels={chartLabels} series={chartSeries} title="Forecast vs Real" height={190} />
        </View>
      )}

      <FieldGroup
        title="Proyección Anual"
        fields={[
          ['Escenario Optimista', formatNumber(data.annualProjection.optimistic)],
          ['Escenario Esperado', formatNumber(data.annualProjection.expected)],
          ['Escenario Conservador', formatNumber(data.annualProjection.conservative)],
        ]}
      />

      <DataTable
        title="Forecast vs Real"
        columns={[
          { header: 'Mes', accessor: 'month', flex: 1.5 },
          { header: 'Forecast', accessor: (r) => formatNumber(r.forecast), flex: 1.5, align: 'right' },
          { header: 'Real', accessor: (r) => formatNumber(r.real), flex: 1.5, align: 'right' },
          { header: 'Dif.', accessor: (r) => formatNumber(r.difference), flex: 1.5, align: 'right' },
          { header: 'MAPE', accessor: (r) => formatPercent(r.mape), flex: 1.5, align: 'right' },
        ]}
        data={data.forecastVsReal}
      />
    </ReportPage>
  );
};
