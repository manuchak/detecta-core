import React from 'react';
import { CoverPage } from '@/components/pdf/CoverPage';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { HistoricalReportConfig, HistoricalReportData } from '@/types/reports';

const MODULE_NAMES: Record<string, string> = {
  cpa: 'CPA',
  ltv: 'LTV',
  retention: 'Retención',
  engagement: 'Engagement',
  supply_growth: 'Crecimiento',
  conversion: 'Conversión',
  capacity: 'Capacidad',
  operational: 'Operacional',
  projections: 'Proyecciones',
  clients: 'Clientes',
};

const GRANULARITY_MAP: Record<string, string> = {
  monthly: 'Mensual',
  quarterly: 'Trimestral',
  yearly: 'Anual',
  year: 'Anual',
  month: 'Mensual',
  week: 'Semanal',
  day: 'Diario',
};

interface Props {
  config: HistoricalReportConfig;
  data: HistoricalReportData;
}

export const HistoricalCoverPage: React.FC<Props> = ({ config, data }) => {
  const now = new Date();
  const moduleCount = config.modules.length;
  const moduleSummary =
    config.modules
      .slice(0, 4)
      .map((m) => MODULE_NAMES[m] ?? m)
      .join(', ') + (moduleCount > 4 ? ` +${moduleCount - 4} más` : '');

  return (
    <CoverPage
      title="Informe Histórico"
      subtitle="Detallado"
      period={data.periodLabel}
      metadata={[
        ['Fecha de generación:', format(now, "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })],
        ['Módulos incluidos:', moduleSummary],
        ['Granularidad:', GRANULARITY_MAP[config.granularity] ?? 'Anual'],
        ['Clasificación:', 'Uso Interno - Confidencial'],
      ]}
    />
  );
};
