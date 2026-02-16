import React from 'react';
import { ReportPage } from '@/components/pdf/ReportPage';
import { SectionHeader } from '@/components/pdf/SectionHeader';
import { FieldGroup } from '@/components/pdf/FieldGroup';
import { formatNumber, formatPercent } from '../formatUtils';
import type { CapacityReportData } from '@/types/reports';

interface Props { data: CapacityReportData; periodLabel: string }

export const CapacitySection: React.FC<Props> = ({ data, periodLabel }) => (
  <ReportPage title="Informe Histórico" subtitle={periodLabel}>
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
