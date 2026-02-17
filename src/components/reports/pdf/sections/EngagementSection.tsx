import React from 'react';
import { View } from '@react-pdf/renderer';
import { ReportPage } from '@/components/pdf/ReportPage';
import { SectionHeader } from '@/components/pdf/SectionHeader';
import { FieldGroup } from '@/components/pdf/FieldGroup';
import { DataTable } from '@/components/pdf/DataTable';
import { PDFLineChart } from '@/components/pdf/charts';
import { Text } from '@react-pdf/renderer';
import { PDF_COLORS } from '@/components/pdf/tokens';
import { formatNumber } from '../formatUtils';
import type { EngagementReportData } from '@/types/reports';

interface Props { data: EngagementReportData; periodLabel: string; logoBase64?: string | null }

export const EngagementSection: React.FC<Props> = ({ data, periodLabel, logoBase64 }) => {
  const chartLabels = data.monthlyEvolution.map(m => m.month);
  const chartSeries = [{
    name: 'Engagement',
    color: PDF_COLORS.info,
    data: data.monthlyEvolution.map(m => m.engagement),
  }];

  return (
    <ReportPage title="Informe Histórico" subtitle={periodLabel} logoBase64={logoBase64}>
      <SectionHeader title="Engagement" />
      <Text style={{ fontSize: 9, color: PDF_COLORS.gray, marginBottom: 8, paddingHorizontal: 4 }}>{data.formula}</Text>

      <FieldGroup
        title="Datos del Período"
        fields={[
          ['Total Servicios', formatNumber(data.yearlyData.totalServices)],
          ['Custodios Activos', formatNumber(data.yearlyData.totalCustodians)],
          ['Engagement Promedio', data.yearlyData.averageEngagement.toFixed(2) + ' servicios/mes'],
        ]}
      />

      {chartLabels.length > 0 && (
        <View wrap={false} style={{ marginVertical: 8 }}>
          <PDFLineChart labels={chartLabels} series={chartSeries} title="Engagement Mensual" height={170} />
        </View>
      )}

      <DataTable
        title="Detalle Mensual"
        columns={[
          { header: 'Mes', accessor: 'month', flex: 2 },
          { header: 'Servicios', accessor: (r) => formatNumber(r.services), flex: 2, align: 'right' },
          { header: 'Custodios', accessor: (r) => formatNumber(r.custodians), flex: 2, align: 'right' },
          { header: 'Engagement', accessor: (r) => r.engagement.toFixed(2), flex: 2, align: 'right' },
        ]}
        data={data.monthlyEvolution}
      />
    </ReportPage>
  );
};
