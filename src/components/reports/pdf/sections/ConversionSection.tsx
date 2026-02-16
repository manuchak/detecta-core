import React from 'react';
import { ReportPage } from '@/components/pdf/ReportPage';
import { SectionHeader } from '@/components/pdf/SectionHeader';
import { FieldGroup } from '@/components/pdf/FieldGroup';
import { DataTable } from '@/components/pdf/DataTable';
import { Text } from '@react-pdf/renderer';
import { PDF_COLORS } from '@/components/pdf/tokens';
import { formatNumber, formatPercent } from '../formatUtils';
import type { ConversionReportData } from '@/types/reports';

interface Props { data: ConversionReportData; periodLabel: string }

export const ConversionSection: React.FC<Props> = ({ data, periodLabel }) => (
  <ReportPage title="Informe Histórico" subtitle={periodLabel}>
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

    <DataTable
      title="Detalle Mensual"
      columns={[
        { header: 'Mes', accessor: 'month', flex: 2 },
        { header: 'Leads', accessor: (r) => formatNumber(r.leads), flex: 2 },
        { header: 'Convertidos', accessor: (r) => formatNumber(r.newCustodians), flex: 2 },
        { header: 'Tasa', accessor: (r) => formatPercent(r.conversionRate), flex: 2 },
      ]}
      data={data.monthlyBreakdown}
    />
  </ReportPage>
);
