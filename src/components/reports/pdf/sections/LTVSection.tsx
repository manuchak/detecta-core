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
import type { LTVReportData } from '@/types/reports';

interface Props { data: LTVReportData; periodLabel: string; logoBase64?: string | null }

export const LTVSection: React.FC<Props> = ({ data, periodLabel, logoBase64 }) => {
  const chartData = data.quarterlyData.map(q => ({
    label: q.quarter,
    value: q.ltvPromedio,
  }));

  return (
    <ReportPage title="Informe Histórico" subtitle={periodLabel} logoBase64={logoBase64}>
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

      {chartData.length > 0 && (
        <View style={{ marginVertical: 8 }}>
          <PDFBarChart data={chartData} title="LTV Trimestral" barColor={PDF_COLORS.info} height={180} />
        </View>
      )}

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
          { header: 'LTV', accessor: (r) => formatCurrency(r.ltvPromedio), flex: 2, align: 'right' },
          { header: 'Custodios', accessor: (r) => formatNumber(r.custodiosPromedio), flex: 2, align: 'right' },
          { header: 'Ingresos', accessor: (r) => formatCurrency(r.ingresosTotales), flex: 2, align: 'right' },
        ]}
        data={data.quarterlyData}
      />
    </ReportPage>
  );
};
