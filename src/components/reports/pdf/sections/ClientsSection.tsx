import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { ReportPage } from '@/components/pdf/ReportPage';
import { SectionHeader } from '@/components/pdf/SectionHeader';
import { FieldGroup } from '@/components/pdf/FieldGroup';
import { DataTable } from '@/components/pdf/DataTable';
import { InsightBox } from '@/components/pdf/InsightBox';
import { PDFPieChart } from '@/components/pdf/charts';
import { PDF_COLORS } from '@/components/pdf/tokens';
import { formatCurrency, formatNumber, formatPercent } from '../formatUtils';
import type { ClientsReportData } from '@/types/reports';

interface Props { data: ClientsReportData; periodLabel: string; logoBase64?: string | null }

export const ClientsSection: React.FC<Props> = ({ data, periodLabel, logoBase64 }) => {
  const hhi = data.clientConcentration.hhi;
  const hhiLevel = hhi < 1500 ? 'Baja' : hhi < 2500 ? 'Moderada' : 'Alta';

  const foraneo = data.serviceTypeAnalysis?.foraneo;
  const local = data.serviceTypeAnalysis?.local;
  const totalGMV = (foraneo?.gmv || 0) + (local?.gmv || 0);

  // Donut chart: top 5 clients vs rest
  const top5Gmv = data.topClients?.slice(0, 5).reduce((s, c) => s + c.gmv, 0) || 0;
  const restGmv = (data.summary.totalGMV || 0) - top5Gmv;
  const pieData = [
    ...(data.topClients?.slice(0, 5).map(c => ({
      label: c.name.substring(0, 12),
      value: c.gmv,
    })) || []),
    ...(restGmv > 0 ? [{ label: 'Otros', value: restGmv }] : []),
  ];

  return (
    <ReportPage title="Informe Histórico" subtitle={periodLabel} logoBase64={logoBase64}>
      <SectionHeader title="Análisis de Clientes" />

      <FieldGroup
        title="Resumen General"
        fields={[
          ['Total Clientes', formatNumber(data.summary.totalClients)],
          ['Clientes Activos', formatNumber(data.summary.activeClients)],
          ['Nuevos Clientes (Período)', formatNumber(data.summary.newClientsThisPeriod)],
          ['GMV Total', formatCurrency(data.summary.totalGMV)],
          ['Servicios Prom./Cliente', data.summary.avgServicesPerClient.toFixed(1)],
          ['GMV Prom./Cliente', formatCurrency(data.summary.avgGmvPerClient)],
        ]}
      />

      {/* Concentration donut */}
      {pieData.length > 0 && (
        <View wrap={false} style={{ alignItems: 'center', marginVertical: 8 }}>
          <PDFPieChart data={pieData} title="Concentración de Ingresos" innerRadius={30} width={300} height={220} />
        </View>
      )}

      <SectionHeader title="Concentración de Ingresos" />
      <InsightBox
        text={`Top 5% genera ${formatPercent(data.clientConcentration.top5Percent)} del GMV | Top 10% genera ${formatPercent(data.clientConcentration.top10Percent)} | HHI: ${formatNumber(hhi)} (${hhiLevel})`}
        positive={hhi < 2500}
        color={hhi < 1500 ? PDF_COLORS.success : hhi < 2500 ? PDF_COLORS.warning : PDF_COLORS.danger}
      />

      {data.topClients && data.topClients.length > 0 && (
        <DataTable
          title="Top 10 Clientes por GMV"
          columns={[
            { header: '#', accessor: (r) => r.rank.toString(), width: 16 },
            { header: 'Cliente', accessor: (r) => r.name.substring(0, 22), flex: 3 },
            { header: 'Servicios', accessor: (r) => formatNumber(r.services), flex: 1, align: 'right' },
            { header: 'GMV', accessor: (r) => formatCurrency(r.gmv), flex: 1.5, align: 'right' },
            { header: 'AOV', accessor: (r) => formatCurrency(r.aov), flex: 1.5, align: 'right' },
            { header: 'Compl.', accessor: (r) => formatPercent(r.completionRate), flex: 1, align: 'right' },
          ]}
          data={data.topClients.slice(0, 10)}
        />
      )}

      {data.serviceTypeAnalysis && (
        <DataTable
          title="Análisis por Tipo de Servicio"
          columns={[
            { header: 'Tipo', accessor: 'tipo', flex: 1.5 },
            { header: 'Servicios', accessor: 'servicios', flex: 1, align: 'right' },
            { header: 'GMV', accessor: 'gmv', flex: 1.5, align: 'right' },
            { header: '% GMV', accessor: 'pctGmv', flex: 1, align: 'right' },
            { header: 'Valor Prom.', accessor: 'avgVal', flex: 1.5, align: 'right' },
          ]}
          data={[
            {
              tipo: 'Foráneo',
              servicios: formatNumber(foraneo?.count || 0),
              gmv: formatCurrency(foraneo?.gmv || 0),
              pctGmv: totalGMV > 0 ? formatPercent((foraneo?.gmv || 0) / totalGMV * 100) : '0%',
              avgVal: formatCurrency(foraneo?.avgValue || 0),
            },
            {
              tipo: 'Local',
              servicios: formatNumber(local?.count || 0),
              gmv: formatCurrency(local?.gmv || 0),
              pctGmv: totalGMV > 0 ? formatPercent((local?.gmv || 0) / totalGMV * 100) : '0%',
              avgVal: formatCurrency(local?.avgValue || 0),
            },
          ]}
        />
      )}

      {data.atRiskClients && data.atRiskClients.length > 0 && (
        <DataTable
          title="Clientes en Riesgo (>30 días sin servicio)"
          columns={[
            { header: 'Cliente', accessor: (r) => r.name.substring(0, 30), flex: 3 },
            { header: 'GMV Histórico', accessor: (r) => formatCurrency(r.historicalGmv), flex: 2, align: 'right' },
            { header: 'Días Sin Servicio', accessor: (r) => r.daysSinceLastService.toString(), flex: 1.5, align: 'right' },
          ]}
          data={data.atRiskClients.slice(0, 10)}
        />
      )}
    </ReportPage>
  );
};
