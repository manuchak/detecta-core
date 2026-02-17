import React from 'react';
import { View } from '@react-pdf/renderer';
import { ReportPage } from '@/components/pdf/ReportPage';
import { SectionHeader } from '@/components/pdf/SectionHeader';
import { FieldGroup } from '@/components/pdf/FieldGroup';
import { DataTable } from '@/components/pdf/DataTable';
import { PDFBarChart } from '@/components/pdf/charts';
import { Text } from '@react-pdf/renderer';
import { PDF_COLORS } from '@/components/pdf/tokens';
import { formatCurrency, formatNumber, formatPercent } from '../formatUtils';
import type { CPAReportData } from '@/types/reports';

interface Props { data: CPAReportData; periodLabel: string; logoBase64?: string | null }

export const CPASection: React.FC<Props> = ({ data, periodLabel, logoBase64 }) => {
  const chartData = data.monthlyEvolution.map(m => ({
    label: m.month,
    value: m.cpa,
  }));

  return (
    <ReportPage title="Informe Histórico" subtitle={periodLabel} logoBase64={logoBase64}>
      <SectionHeader title="CPA - Costo por Adquisición" />
      <Text style={{ fontSize: 9, color: PDF_COLORS.gray, marginBottom: 8, paddingHorizontal: 4 }}>{data.formula}</Text>

      <FieldGroup
        title="Acumulado Anual"
        fields={[
          ['Costos Totales', formatCurrency(data.yearlyData.totalCosts)],
          ['Custodios Nuevos', formatNumber(data.yearlyData.newCustodians)],
          ['CPA Promedio', formatCurrency(data.yearlyData.cpaPromedio)],
        ]}
      />

      {chartData.length > 0 && (
        <View style={{ marginVertical: 8 }}>
          <PDFBarChart data={chartData} title="CPA Mensual" barColor={PDF_COLORS.red} height={180} />
        </View>
      )}

      <FieldGroup
        title="Desglose de Costos"
        fields={data.yearlyData.costBreakdown.map(item => [
          item.category,
          `${formatCurrency(item.amount)} (${formatPercent(item.percentage)})`,
        ])}
      />

      <DataTable
        title="Detalle Mensual"
        columns={[
          { header: 'Mes', accessor: 'month', flex: 2 },
          { header: 'Costos', accessor: (r) => formatCurrency(r.costs), flex: 2, align: 'right' },
          { header: 'Nuevos', accessor: (r) => formatNumber(r.newCustodians), flex: 2, align: 'right' },
          { header: 'CPA', accessor: (r) => formatCurrency(r.cpa), flex: 2, align: 'right' },
        ]}
        data={data.monthlyEvolution}
      />
    </ReportPage>
  );
};
