import React from 'react';
import { Document, View, Text } from '@react-pdf/renderer';
import { ReportPage, SectionHeader, DataTable, KPIRow, PDF_COLORS } from '@/components/pdf';
import type { DataTableColumn } from '@/components/pdf/DataTable';
import type { ClientDashboardMetrics, ClientTableData, ClientMetrics } from '@/hooks/useClientAnalytics';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ClientAnalyticsPDFDocumentProps {
  logoBase64: string | null;
  dateRange: { from: Date; to: Date };
  dateLabel: string;
  /** Dashboard metrics (champions) */
  clientMetrics: ClientDashboardMetrics | null;
  /** Top 15 table data */
  tableData: ClientTableData[];
  /** Individual client detail (only when a client is selected) */
  clientAnalytics?: ClientMetrics | null;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

const fmtM = (n: number) => `$${(n / 1_000_000).toFixed(1)}M`;

const fmtPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;

// ── Page 1: Dashboard ──────────────────────────────────────────────────────

const DashboardPage: React.FC<{
  logoBase64: string | null;
  dateLabel: string;
  clientMetrics: ClientDashboardMetrics;
  tableData: ClientTableData[];
}> = ({ logoBase64, dateLabel, clientMetrics, tableData }) => {
  const kpiItems = [
    {
      label: '🏆 Mayor GMV',
      value: fmtM(clientMetrics.highestGMV.gmv),
      trend: clientMetrics.highestGMV.clientName,
      accentColor: PDF_COLORS.red,
    },
    {
      label: '📦 Más Servicios',
      value: String(clientMetrics.mostServices.services),
      trend: clientMetrics.mostServices.clientName,
      accentColor: PDF_COLORS.info,
    },
    {
      label: '💰 Mejor AOV',
      value: fmt(clientMetrics.topAOV.aov),
      trend: clientMetrics.topAOV.clientName,
      accentColor: PDF_COLORS.success,
    },
    {
      label: '✅ Mejor Cumplimiento',
      value: `${clientMetrics.bestCompletion.completionRate.toFixed(1)}%`,
      trend: clientMetrics.bestCompletion.clientName,
      accentColor: PDF_COLORS.warning,
    },
  ];

  const top15 = tableData.slice(0, 15);

  const clientColumns: DataTableColumn[] = [
    { header: '#', accessor: (_r, i) => String(i + 1), width: 16, align: 'center' },
    { header: 'Cliente', accessor: 'clientName', flex: 3 },
    { header: 'Svcs', accessor: (r) => String(r.currentServices), width: 30, align: 'right' },
    { header: 'GMV', accessor: (r) => fmtM(r.currentGMV), width: 48, align: 'right' },
    { header: 'AOV', accessor: (r) => fmt(r.currentAOV), width: 58, align: 'right' },
    { header: 'Cumpl.', accessor: (r) => `${r.completionRate}%`, width: 38, align: 'right' },
    { header: 'ΔGMV', accessor: (r) => fmtPct(r.gmvGrowth), width: 42, align: 'right' },
    { header: 'Días sin svc', accessor: (r) => r.daysSinceLastService >= 999 ? 'N/D' : String(r.daysSinceLastService), width: 50, align: 'right' },
  ];

  const foraneoRow = {
    tipo: 'Foráneo (>100 km)',
    servicios: String(clientMetrics.serviceTypeAnalysis.foraneo.count),
    pct: `${clientMetrics.serviceTypeAnalysis.foraneoPercentage.toFixed(1)}%`,
    avgVal: fmt(clientMetrics.serviceTypeAnalysis.foraneo.avgValue),
  };
  const localRow = {
    tipo: 'Local (≤100 km)',
    servicios: String(clientMetrics.serviceTypeAnalysis.local.count),
    pct: `${(100 - clientMetrics.serviceTypeAnalysis.foraneoPercentage).toFixed(1)}%`,
    avgVal: fmt(clientMetrics.serviceTypeAnalysis.local.avgValue),
  };

  const typeColumns: DataTableColumn[] = [
    { header: 'Tipo', accessor: 'tipo', flex: 2 },
    { header: 'Servicios', accessor: 'servicios', flex: 1, align: 'right' },
    { header: '% del Total', accessor: 'pct', flex: 1, align: 'right' },
    { header: 'Valor Promedio', accessor: 'avgVal', flex: 1, align: 'right' },
  ];

  return (
    <ReportPage
      title="ANÁLISIS DE CLIENTES"
      subtitle={dateLabel}
      logoBase64={logoBase64}
      footerText="Confidencial – Solo para uso interno"
    >
      <SectionHeader title="Champions del Período" />
      <KPIRow items={kpiItems} />

      <SectionHeader title={`Top ${Math.min(top15.length, 15)} Clientes por GMV`} />
      <DataTable columns={clientColumns} data={top15} striped />

      <SectionHeader title="Análisis Foráneo vs Local" />
      <DataTable columns={typeColumns} data={[foraneoRow, localRow]} striped={false} />
    </ReportPage>
  );
};

// ── Page 2: Individual Client Detail ──────────────────────────────────────

const ClientDetailPage1: React.FC<{
  logoBase64: string | null;
  dateLabel: string;
  analytics: ClientMetrics;
}> = ({ logoBase64, dateLabel, analytics }) => {
  const kpiItems = [
    {
      label: 'Servicios Totales',
      value: String(analytics.totalServices),
      trend: `${analytics.servicesPerMonth.toFixed(1)}/mes`,
      accentColor: PDF_COLORS.info,
    },
    {
      label: 'GMV Total',
      value: fmtM(analytics.totalGMV),
      trend: `AOV: ${fmt(analytics.averageAOV)}`,
      accentColor: PDF_COLORS.red,
    },
    {
      label: 'Cumplimiento',
      value: `${analytics.completionRate}%`,
      trend: `${analytics.completedServices} completados`,
      trendUp: analytics.completionRate >= 80,
      accentColor: analytics.completionRate >= 80 ? PDF_COLORS.success : PDF_COLORS.warning,
    },
    {
      label: 'KM Promedio',
      value: `${analytics.averageKm} km`,
      trend: `Total: ${analytics.totalKm.toLocaleString('es-MX')} km`,
      accentColor: PDF_COLORS.locationBlue,
    },
  ];

  const activityData = [
    { campo: 'Primer Servicio', valor: analytics.firstService },
    { campo: 'Último Servicio', valor: analytics.lastService },
    { campo: 'Servicios Completados', valor: String(analytics.completedServices) },
    { campo: 'Servicios Cancelados', valor: String(analytics.cancelledServices) },
  ];

  const activityCols: DataTableColumn[] = [
    { header: 'Campo', accessor: 'campo', flex: 1 },
    { header: 'Valor', accessor: 'valor', flex: 1 },
  ];

  const typeCols: DataTableColumn[] = [
    { header: 'Tipo de Servicio', accessor: 'type', flex: 2 },
    { header: 'Cantidad', accessor: (r) => String(r.count), flex: 1, align: 'right' },
    { header: '% del Total', accessor: (r) => `${r.percentage}%`, flex: 1, align: 'right' },
  ];

  return (
    <ReportPage
      title={`ANÁLISIS: ${analytics.clientName.toUpperCase()}`}
      subtitle={dateLabel}
      logoBase64={logoBase64}
      footerText="Confidencial – Solo para uso interno"
    >
      <SectionHeader title="KPIs Principales" />
      <KPIRow items={kpiItems} />

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <SectionHeader title="Actividad Temporal" />
          <DataTable columns={activityCols} data={activityData} striped={false} />
        </View>
        <View style={{ flex: 1 }}>
          <SectionHeader title="Tipos de Servicio" />
          <DataTable columns={typeCols} data={analytics.serviceTypes} />
        </View>
      </View>
    </ReportPage>
  );
};

const ClientDetailPage2: React.FC<{
  logoBase64: string | null;
  dateLabel: string;
  analytics: ClientMetrics;
}> = ({ logoBase64, dateLabel, analytics }) => {
  const trendCols: DataTableColumn[] = [
    { header: 'Mes', accessor: 'month', flex: 2 },
    { header: 'Servicios', accessor: (r) => String(r.services), flex: 1, align: 'right' },
    { header: 'GMV', accessor: (r) => fmtM(r.gmv), flex: 1, align: 'right' },
    { header: 'AOV', accessor: (r) => r.services > 0 ? fmt(r.gmv / r.services) : '-', flex: 1, align: 'right' },
  ];

  const custodianCols: DataTableColumn[] = [
    { header: 'Custodio', accessor: 'custodian', flex: 3 },
    { header: 'Servicios', accessor: (r) => String(r.services), flex: 1, align: 'right' },
    { header: 'Cumplimiento', accessor: (r) => `${r.completionRate.toFixed(1)}%`, flex: 1, align: 'right' },
    { header: 'KM Promedio', accessor: (r) => `${r.averageKm.toFixed(0)} km`, flex: 1, align: 'right' },
  ];

  return (
    <ReportPage
      title={`ANÁLISIS: ${analytics.clientName.toUpperCase()}`}
      subtitle={dateLabel}
      logoBase64={logoBase64}
      footerText="Confidencial – Solo para uso interno"
    >
      <SectionHeader title="Tendencia Mensual (Últimos 12 meses)" />
      <DataTable columns={trendCols} data={analytics.monthlyTrend} striped />

      <SectionHeader title="Performance por Custodio" />
      <DataTable columns={custodianCols} data={analytics.custodianPerformance} striped />
    </ReportPage>
  );
};

// ── Main Document ──────────────────────────────────────────────────────────

export const ClientAnalyticsPDFDocument: React.FC<ClientAnalyticsPDFDocumentProps> = ({
  logoBase64,
  dateRange,
  dateLabel,
  clientMetrics,
  tableData,
  clientAnalytics,
}) => {
  return (
    <Document
      title={clientAnalytics ? `Análisis Cliente: ${clientAnalytics.clientName}` : 'Análisis de Clientes'}
      author="Detecta"
      subject="Reporte Ejecutivo - Análisis de Clientes"
    >
      {/* Dashboard page always shown */}
      {clientMetrics && (
        <DashboardPage
          logoBase64={logoBase64}
          dateLabel={dateLabel}
          clientMetrics={clientMetrics}
          tableData={tableData}
        />
      )}

      {/* Detail pages only when a client is selected */}
      {clientAnalytics && (
        <>
          <ClientDetailPage1
            logoBase64={logoBase64}
            dateLabel={dateLabel}
            analytics={clientAnalytics}
          />
          <ClientDetailPage2
            logoBase64={logoBase64}
            dateLabel={dateLabel}
            analytics={clientAnalytics}
          />
        </>
      )}
    </Document>
  );
};
