import React from 'react';
import { ReportPage } from '@/components/pdf/ReportPage';
import { SectionHeader } from '@/components/pdf/SectionHeader';
import { FieldGroup } from '@/components/pdf/FieldGroup';
import { DataTable } from '@/components/pdf/DataTable';
import { Text } from '@react-pdf/renderer';
import { PDF_COLORS } from '@/components/pdf/tokens';
import { formatNumber } from '../formatUtils';
import type { EngagementReportData } from '@/types/reports';

interface Props { data: EngagementReportData; periodLabel: string }

export const EngagementSection: React.FC<Props> = ({ data, periodLabel }) => (
  <ReportPage title="Informe Histórico" subtitle={periodLabel}>
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

    <DataTable
      title="Detalle Mensual"
      columns={[
        { header: 'Mes', accessor: 'month', flex: 2 },
        { header: 'Servicios', accessor: (r) => formatNumber(r.services), flex: 2 },
        { header: 'Custodios', accessor: (r) => formatNumber(r.custodians), flex: 2 },
        { header: 'Engagement', accessor: (r) => r.engagement.toFixed(2), flex: 2 },
      ]}
      data={data.monthlyEvolution}
    />
  </ReportPage>
);
