import React from 'react';
import { ReportPage } from '@/components/pdf/ReportPage';
import { SectionHeader } from '@/components/pdf/SectionHeader';
import { FieldGroup } from '@/components/pdf/FieldGroup';
import { DataTable } from '@/components/pdf/DataTable';
import { formatNumber, formatPercent } from '../formatUtils';
import type { ProjectionsReportData } from '@/types/reports';

interface Props { data: ProjectionsReportData; periodLabel: string }

export const ProjectionsSection: React.FC<Props> = ({ data, periodLabel }) => (
  <ReportPage title="Informe Histórico" subtitle={periodLabel}>
    <SectionHeader title="Proyecciones" />

    <FieldGroup
      title="Precisión del Modelo"
      fields={[
        ['MAPE Promedio', formatPercent(data.modelPrecision.mapePromedio)],
        ['Desviación Estándar', formatPercent(data.modelPrecision.desviacionEstandar)],
      ]}
    />

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
        { header: 'Forecast', accessor: (r) => formatNumber(r.forecast), flex: 1.5 },
        { header: 'Real', accessor: (r) => formatNumber(r.real), flex: 1.5 },
        { header: 'Dif.', accessor: (r) => formatNumber(r.difference), flex: 1.5 },
        { header: 'MAPE', accessor: (r) => formatPercent(r.mape), flex: 1.5 },
      ]}
      data={data.forecastVsReal}
    />
  </ReportPage>
);
