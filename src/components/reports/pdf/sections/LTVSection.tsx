import React from 'react';
import { ReportPage } from '@/components/pdf/ReportPage';
import { SectionHeader } from '@/components/pdf/SectionHeader';
import { FieldGroup } from '@/components/pdf/FieldGroup';
import { DataTable } from '@/components/pdf/DataTable';
import { Text } from '@react-pdf/renderer';
import { PDF_COLORS } from '@/components/pdf/tokens';
import { formatCurrency, formatNumber, formatPercent } from '../formatUtils';
import type { LTVReportData } from '@/types/reports';

interface Props { data: LTVReportData; periodLabel: string }

export const LTVSection: React.FC<Props> = ({ data, periodLabel }) => (
  <ReportPage title="Informe Histórico" subtitle={periodLabel}>
    <SectionHeader title="LTV - Lifetime Value" />
    <Text style={{ fontSize: 9, color: PDF_COLORS.gray, marginBottom: 8, paddingHorizontal: 4 }}>{data.formula}</Text>

    <FieldGroup
      title="Datos del Período"
      fields={[
        ['Custodios Activos', formatNumber(data.yearlyData.totalCustodios)],
        ['Ingresos Totales', formatCurrency(data.yearlyData.ingresosTotales)],
        ['Ingreso/Custodio', formatCurrency(data.yearlyData.ingresoPromedioPorCustodio)],
        ['LTV General', formatCurrency(data.yearlyData.ltvGeneral)],
        ['Tiempo Vida Promedio', `${data.tiempoVidaPromedio} meses`],
      ]}
    />

    <FieldGroup
      title="Comparativo MoM"
      fields={[
        ['LTV Actual', formatCurrency(data.momComparison.ltvActual)],
        ['LTV Mes Anterior', formatCurrency(data.momComparison.ltvMesAnterior)],
        ['Cambio Absoluto', formatCurrency(data.momComparison.cambioAbsoluto)],
        ['Cambio Relativo', formatPercent(data.momComparison.cambioRelativo)],
      ]}
    />

    <DataTable
      title="Análisis Trimestral"
      columns={[
        { header: 'Trimestre', accessor: 'quarter', flex: 2 },
        { header: 'LTV', accessor: (r) => formatCurrency(r.ltvPromedio), flex: 2 },
        { header: 'Custodios', accessor: (r) => formatNumber(r.custodiosPromedio), flex: 2 },
        { header: 'Ingresos', accessor: (r) => formatCurrency(r.ingresosTotales), flex: 2 },
      ]}
      data={data.quarterlyData}
    />
  </ReportPage>
);
