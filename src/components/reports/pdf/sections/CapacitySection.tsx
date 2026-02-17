import React from 'react';
import { View } from '@react-pdf/renderer';
import { ReportPage } from '@/components/pdf/ReportPage';
import { SectionHeader } from '@/components/pdf/SectionHeader';
import { FieldGroup } from '@/components/pdf/FieldGroup';
import { PDFGaugeChart } from '@/components/pdf/charts';
import { PDF_COLORS } from '@/components/pdf/tokens';
import { formatNumber, formatPercent } from '../formatUtils';
import type { CapacityReportData } from '@/types/reports';

interface Props { data: CapacityReportData; periodLabel: string; logoBase64?: string | null }

export const CapacitySection: React.FC<Props> = ({ data, periodLabel, logoBase64 }) => (
  <ReportPage title="Informe Histórico" subtitle={periodLabel} logoBase64={logoBase64}>
    <SectionHeader title="Capacidad Operativa" />

    <FieldGroup
      title="Capacidad Actual"
      fields={[
        ['Custodios Totales', formatNumber(data.currentCapacity.totalCustodians)],
        ['Disponibles', formatNumber(data.currentCapacity.availableToday)],
        ['Retornando Foráneo', formatNumber(data.currentCapacity.unavailable.returningFromForeign)],
        ['En Ruta', formatNumber(data.currentCapacity.unavailable.currentlyOnRoute)],
      ]}
    />

    {/* Gauge chart for utilization */}
    <View wrap={false} style={{ alignItems: 'center', marginVertical: 10 }}>
      <PDFGaugeChart
        value={data.utilizationMetrics.current}
        label="Utilización Actual"
        size={140}
      />
    </View>

    <FieldGroup
      title="Capacidad por Tipo"
      fields={[
        ['Locales (≤50km)', formatNumber(data.capacityByServiceType.local)],
        ['Regionales (51-200km)', formatNumber(data.capacityByServiceType.regional)],
        ['Foráneos (>200km)', formatNumber(data.capacityByServiceType.foraneo)],
      ]}
    />

    <FieldGroup
      title="Utilización"
      fields={[
        ['Actual', formatPercent(data.utilizationMetrics.current)],
        ['Objetivo', formatPercent(data.utilizationMetrics.healthy)],
        ['Máximo Seguro', formatPercent(data.utilizationMetrics.maxSafe)],
      ]}
    />

    <FieldGroup
      title="Eficiencia de Flota"
      fields={[
        ['Custodios Disponibles', formatNumber(data.fleetEfficiency.availableCustodians)],
        ['Servicios/Custodio/Mes', data.fleetEfficiency.servicesPerCustodianMonth.toFixed(1)],
        ['Eficiencia Operativa', formatPercent(data.fleetEfficiency.operationalEfficiency)],
      ]}
    />
  </ReportPage>
);
