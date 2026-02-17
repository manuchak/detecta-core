import React from 'react';
import { View } from '@react-pdf/renderer';
import { ReportPage } from '@/components/pdf/ReportPage';
import { SectionHeader } from '@/components/pdf/SectionHeader';
import { FieldGroup } from '@/components/pdf/FieldGroup';
import { DataTable } from '@/components/pdf/DataTable';
import { PDFBarChart } from '@/components/pdf/charts';
import { Text } from '@react-pdf/renderer';
import { PDF_COLORS } from '@/components/pdf/tokens';
import { formatNumber, formatPercent } from '../formatUtils';
import type { ConversionReportData } from '@/types/reports';

interface Props { data: ConversionReportData; periodLabel: string; logoBase64?: string | null }

export const ConversionSection: React.FC<Props> = ({ data, periodLabel, logoBase64 }) => {
  const chartData = data.monthlyBreakdown.map(m => ({
    label: m.month,
    value: m.conversionRate,
  }));

  return (
    <ReportPage title="Informe Histórico" subtitle={periodLabel} logoBase64={logoBase64}>
      <SectionHeader title="Conversión" />
      <Text style={{ fontSize: 9, color: PDF_COLORS.gray, marginBottom: 8, paddingHorizontal: 4 }}>{data.formula}</Text>

      <FieldGroup
        title="Datos del Período"
        fields={[
          ['Total Leads', formatNumber(data.yearlyData.totalLeads)],
          ['Convertidos', formatNumber(data.yearlyData.totalNewCustodians)],
          ['Tasa Conversión', formatPercent(data.yearlyData.conversionRate)],
        ]}
      />

      {chartData.length > 0 && (
        <View style={{ marginVertical: 8 }}>
          <PDFBarChart data={chartData} title="Tasa de Conversión Mensual (%)" barColor={PDF_COLORS.orange} height={180} />
        </View>
      )}

      <DataTable
        title="Detalle Mensual"
        columns={[
          { header: 'Mes', accessor: 'month', flex: 2 },
          { header: 'Leads', accessor: (r) => formatNumber(r.leads), flex: 2, align: 'right' },
          { header: 'Convertidos', accessor: (r) => formatNumber(r.newCustodians), flex: 2, align: 'right' },
          { header: 'Tasa', accessor: (r) => formatPercent(r.conversionRate), flex: 2, align: 'right' },
        ]}
        data={data.monthlyBreakdown}
      />
    </ReportPage>
  );
};
