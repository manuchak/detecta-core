import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { ReportPage } from '@/components/pdf/ReportPage';
import { SectionHeader } from '@/components/pdf/SectionHeader';
import { FieldGroup } from '@/components/pdf/FieldGroup';
import { DataTable } from '@/components/pdf/DataTable';
import { PDF_COLORS } from '@/components/pdf/tokens';
import { formatCurrency, formatNumber, formatPercent } from '../formatUtils';
import type { ClientsReportData } from '@/types/reports';

interface Props { data: ClientsReportData; periodLabel: string }

export const ClientsSection: React.FC<Props> = ({ data, periodLabel }) => {
  const hhi = data.clientConcentration.hhi;
  const hhiLevel = hhi < 1500 ? 'Baja' : hhi < 2500 ? 'Moderada' : 'Alta';

  const foraneo = data.serviceTypeAnalysis?.foraneo;
  const local = data.serviceTypeAnalysis?.local;
  const totalGMV = (foraneo?.gmv || 0) + (local?.gmv || 0);

  return (
    <ReportPage title="Informe Histórico" subtitle={periodLabel}>
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

      {/* Concentration Box */}
      <SectionHeader title="Concentración de Ingresos" />
      <View
        style={{
          padding: 10,
          backgroundColor: PDF_COLORS.backgroundSubtle,
          borderWidth: 0.5,
          borderColor: PDF_COLORS.border,
          borderRadius: 2,
          marginBottom: 10,
        }}
      >
        <Text style={{ fontSize: 8, color: PDF_COLORS.gray, marginBottom: 4 }}>ANÁLISIS DE CONCENTRACIÓN</Text>
        <Text style={{ fontSize: 9, color: PDF_COLORS.black, marginBottom: 2 }}>
          Top 5% de clientes genera: {formatPercent(data.clientConcentration.top5Percent)} del GMV
        </Text>
        <Text style={{ fontSize: 9, color: PDF_COLORS.black, marginBottom: 2 }}>
          Top 10% de clientes genera: {formatPercent(data.clientConcentration.top10Percent)} del GMV
        </Text>
        <Text style={{ fontSize: 9, color: PDF_COLORS.black }}>
          Índice HHI: {formatNumber(hhi)} (Concentración {hhiLevel})
        </Text>
      </View>

      {data.topClients && data.topClients.length > 0 && (
        <DataTable
          title="Top 10 Clientes por GMV"
          columns={[
            { header: '#', accessor: (r) => r.rank.toString(), width: 16 },
            { header: 'Cliente', accessor: (r) => r.name.substring(0, 22), flex: 3 },
            { header: 'Servicios', accessor: (r) => formatNumber(r.services), flex: 1 },
            { header: 'GMV', accessor: (r) => formatCurrency(r.gmv), flex: 1.5 },
            { header: 'AOV', accessor: (r) => formatCurrency(r.aov), flex: 1.5 },
            { header: 'Compl.', accessor: (r) => formatPercent(r.completionRate), flex: 1 },
          ]}
          data={data.topClients.slice(0, 10)}
        />
      )}

      {data.serviceTypeAnalysis && (
        <DataTable
          title="Análisis por Tipo de Servicio"
          columns={[
            { header: 'Tipo', accessor: 'tipo', flex: 1.5 },
            { header: 'Servicios', accessor: 'servicios', flex: 1 },
            { header: 'GMV', accessor: 'gmv', flex: 1.5 },
            { header: '% GMV', accessor: 'pctGmv', flex: 1 },
            { header: 'Valor Prom.', accessor: 'avgVal', flex: 1.5 },
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
            { header: 'GMV Histórico', accessor: (r) => formatCurrency(r.historicalGmv), flex: 2 },
            { header: 'Días Sin Servicio', accessor: (r) => r.daysSinceLastService.toString(), flex: 1.5 },
          ]}
          data={data.atRiskClients.slice(0, 10)}
        />
      )}
    </ReportPage>
  );
};
