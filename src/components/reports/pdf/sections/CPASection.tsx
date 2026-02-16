import React from 'react';
import { ReportPage } from '@/components/pdf/ReportPage';
import { SectionHeader } from '@/components/pdf/SectionHeader';
import { FieldGroup } from '@/components/pdf/FieldGroup';
import { DataTable } from '@/components/pdf/DataTable';
import { Text } from '@react-pdf/renderer';
import { PDF_COLORS } from '@/components/pdf/tokens';
import { formatCurrency, formatNumber, formatPercent } from '../formatUtils';
import type { CPAReportData } from '@/types/reports';

interface Props { data: CPAReportData; periodLabel: string }

export const CPASection: React.FC<Props> = ({ data, periodLabel }) => (
  <ReportPage title="Informe Histórico" subtitle={periodLabel}>
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
        { header: 'Costos', accessor: (r) => formatCurrency(r.costs), flex: 2 },
        { header: 'Nuevos', accessor: (r) => formatNumber(r.newCustodians), flex: 2 },
        { header: 'CPA', accessor: (r) => formatCurrency(r.cpa), flex: 2 },
      ]}
      data={data.monthlyEvolution}
    />
  </ReportPage>
);
