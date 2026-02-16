import React from 'react';
import { ReportPage } from '@/components/pdf/ReportPage';
import { SectionHeader } from '@/components/pdf/SectionHeader';
import { FieldGroup } from '@/components/pdf/FieldGroup';
import { DataTable } from '@/components/pdf/DataTable';
import { formatNumber, formatPercent } from '../formatUtils';
import type { SupplyGrowthReportData } from '@/types/reports';

interface Props { data: SupplyGrowthReportData; periodLabel: string }

export const SupplyGrowthSection: React.FC<Props> = ({ data, periodLabel }) => (
  <ReportPage title="Informe Histórico" subtitle={periodLabel}>
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

    <FieldGroup
      title="Insights"
      fields={[
        ['Mejor Mes', `${data.summary.mejorMes.mes} (${formatPercent(data.summary.mejorMes.crecimiento)})`],
        ['Peor Mes', `${data.summary.peorMes.mes} (${formatPercent(data.summary.peorMes.crecimiento)})`],
      ]}
    />

    <DataTable
      title="Detalle Mensual"
      columns={[
        { header: 'Mes', accessor: 'monthName', flex: 2 },
        { header: 'Activos', accessor: (r) => formatNumber(r.custodiosActivos), flex: 1.5 },
        { header: 'Nuevos', accessor: (r) => formatNumber(r.custodiosNuevos), flex: 1.5 },
        { header: 'Perdidos', accessor: (r) => formatNumber(r.custodiosPerdidos), flex: 1.5 },
        { header: 'Crec.', accessor: (r) => formatPercent(r.crecimientoPorcentual), flex: 1.5 },
      ]}
      data={data.monthlyData}
    />
  </ReportPage>
);
