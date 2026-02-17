import React from 'react';
import { View } from '@react-pdf/renderer';
import { ReportPage } from '@/components/pdf/ReportPage';
import { SectionHeader } from '@/components/pdf/SectionHeader';
import { FieldGroup } from '@/components/pdf/FieldGroup';
import { DataTable } from '@/components/pdf/DataTable';
import { PDFPieChart, PDFHorizontalBarChart } from '@/components/pdf/charts';
import { Text } from '@react-pdf/renderer';
import { PDF_COLORS } from '@/components/pdf/tokens';
import { formatCurrency, formatNumber, formatPercent } from '../formatUtils';
import type { OperationalReportData } from '@/types/reports';

interface Props { data: OperationalReportData; periodLabel: string; logoBase64?: string | null }

export const OperationalSection: React.FC<Props> = ({ data, periodLabel, logoBase64 }) => {
  const pieData = [
    { label: 'Completados', value: data.services.completed, color: PDF_COLORS.success },
    { label: 'Cancelados', value: data.services.cancelled, color: PDF_COLORS.danger },
    { label: 'Pendientes', value: data.services.pending, color: PDF_COLORS.warning },
  ].filter(d => d.value > 0);

  const topClientsChart = data.topClients.slice(0, 5).map(c => ({
    label: c.name.substring(0, 16),
    value: c.gmv,
    color: PDF_COLORS.red,
  }));

  return (
    <ReportPage title="Informe Histórico" subtitle={periodLabel} logoBase64={logoBase64}>
      <SectionHeader title="Operacional" />

      <FieldGroup
        title="Servicios"
        fields={[
          ['Total', formatNumber(data.services.total)],
          ['Completados', `${formatNumber(data.services.completed)} (${formatPercent(data.services.completedPercent)})`],
          ['Cancelados', `${formatNumber(data.services.cancelled)} (${formatPercent(data.services.cancelledPercent)})`],
          ['Pendientes', `${formatNumber(data.services.pending)} (${formatPercent(data.services.pendingPercent)})`],
        ]}
      />

      {/* Pie chart of services distribution */}
      {pieData.length > 0 && (
        <View style={{ alignItems: 'center', marginVertical: 8 }}>
          <PDFPieChart data={pieData} title="Distribución de Servicios" width={280} height={200} />
        </View>
      )}

      <FieldGroup
        title="GMV"
        fields={[
          ['Total', formatCurrency(data.gmv.total)],
          ['AOV', formatCurrency(data.gmv.aov)],
        ]}
      />

      {/* Top clients horizontal bar chart */}
      {topClientsChart.length > 0 && (
        <View style={{ marginVertical: 8 }}>
          <PDFHorizontalBarChart data={topClientsChart} title="Top 5 Clientes por GMV" barColor={PDF_COLORS.red} />
        </View>
      )}

      <DataTable
        title="Top 10 Custodios por Cobro"
        columns={[
          { header: '#', accessor: (r) => r.rank.toString(), width: 18 },
          { header: 'Nombre', accessor: (r) => r.name.substring(0, 16), flex: 2 },
          { header: 'Svcs', accessor: (r) => formatNumber(r.services), flex: 1, align: 'right' },
          { header: 'Meses', accessor: (r) => r.mesesActivos.toString(), flex: 1, align: 'right' },
          { header: 'Cobro', accessor: (r) => formatCurrency(r.costoCustodio), flex: 1.5, align: 'right' },
          { header: 'Prom/Mes', accessor: (r) => formatCurrency(r.promedioCostoMes), flex: 1.5, align: 'right' },
          { header: 'Margen', accessor: (r) => formatCurrency(r.margen), flex: 1.5, align: 'right' },
        ]}
        data={data.topCustodians}
      />

      <Text style={{ fontSize: 8, color: PDF_COLORS.gray, marginBottom: 4, paddingHorizontal: 4 }}>
        Solo custodios con datos de costo registrados
      </Text>

      <DataTable
        title="Top 10 Clientes"
        columns={[
          { header: '#', accessor: (r) => r.rank.toString(), width: 18 },
          { header: 'Cliente', accessor: (r) => r.name.substring(0, 22), flex: 3 },
          { header: 'Servicios', accessor: (r) => formatNumber(r.services), flex: 1.5, align: 'right' },
          { header: 'GMV', accessor: (r) => formatCurrency(r.gmv), flex: 2, align: 'right' },
          { header: 'AOV', accessor: (r) => formatCurrency(r.aov), flex: 1.5, align: 'right' },
        ]}
        data={data.topClients}
      />
    </ReportPage>
  );
};
