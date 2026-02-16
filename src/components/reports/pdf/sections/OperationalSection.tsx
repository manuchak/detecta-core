import React from 'react';
import { ReportPage } from '@/components/pdf/ReportPage';
import { SectionHeader } from '@/components/pdf/SectionHeader';
import { FieldGroup } from '@/components/pdf/FieldGroup';
import { DataTable } from '@/components/pdf/DataTable';
import { Text } from '@react-pdf/renderer';
import { PDF_COLORS } from '@/components/pdf/tokens';
import { formatCurrency, formatNumber, formatPercent } from '../formatUtils';
import type { OperationalReportData } from '@/types/reports';

interface Props { data: OperationalReportData; periodLabel: string }

export const OperationalSection: React.FC<Props> = ({ data, periodLabel }) => (
  <ReportPage title="Informe Histórico" subtitle={periodLabel}>
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

    <FieldGroup
      title="GMV"
      fields={[
        ['Total', formatCurrency(data.gmv.total)],
        ['AOV', formatCurrency(data.gmv.aov)],
      ]}
    />

    <DataTable
      title="Top 10 Custodios por Cobro"
      columns={[
        { header: '#', accessor: (r) => r.rank.toString(), width: 18 },
        { header: 'Nombre', accessor: (r) => r.name.substring(0, 16), flex: 2 },
        { header: 'Svcs', accessor: (r) => formatNumber(r.services), flex: 1 },
        { header: 'Meses', accessor: (r) => r.mesesActivos.toString(), flex: 1 },
        { header: 'Cobro', accessor: (r) => formatCurrency(r.costoCustodio), flex: 1.5 },
        { header: 'Prom/Mes', accessor: (r) => formatCurrency(r.promedioCostoMes), flex: 1.5 },
        { header: 'Margen', accessor: (r) => formatCurrency(r.margen), flex: 1.5 },
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
        { header: 'Servicios', accessor: (r) => formatNumber(r.services), flex: 1.5 },
        { header: 'GMV', accessor: (r) => formatCurrency(r.gmv), flex: 2 },
        { header: 'AOV', accessor: (r) => formatCurrency(r.aov), flex: 1.5 },
      ]}
      data={data.topClients}
    />
  </ReportPage>
);
