import React from 'react';
import { Document } from '@react-pdf/renderer';
import { HistoricalCoverPage } from './HistoricalCoverPage';
import { HistoricalExecutiveSummary } from './HistoricalExecutiveSummary';
import { HistoricalTableOfContents } from './HistoricalTableOfContents';
import { CPASection } from './sections/CPASection';
import { LTVSection } from './sections/LTVSection';
import { RetentionSection } from './sections/RetentionSection';
import { EngagementSection } from './sections/EngagementSection';
import { SupplyGrowthSection } from './sections/SupplyGrowthSection';
import { ConversionSection } from './sections/ConversionSection';
import { CapacitySection } from './sections/CapacitySection';
import { OperationalSection } from './sections/OperationalSection';
import { ProjectionsSection } from './sections/ProjectionsSection';
import { ClientsSection } from './sections/ClientsSection';
import type { HistoricalReportConfig, HistoricalReportData } from '@/types/reports';

interface Props {
  config: HistoricalReportConfig;
  data: HistoricalReportData;
}

const SECTION_MAP: Record<string, React.FC<{ data: any; periodLabel: string }>> = {
  cpa: CPASection,
  ltv: LTVSection,
  retention: RetentionSection,
  engagement: EngagementSection,
  supply_growth: SupplyGrowthSection,
  conversion: ConversionSection,
  capacity: CapacitySection,
  operational: OperationalSection,
  projections: ProjectionsSection,
  clients: ClientsSection,
};

const DATA_KEY_MAP: Record<string, string> = {
  cpa: 'cpa',
  ltv: 'ltv',
  retention: 'retention',
  engagement: 'engagement',
  supply_growth: 'supplyGrowth',
  conversion: 'conversion',
  capacity: 'capacity',
  operational: 'operational',
  projections: 'projections',
  clients: 'clients',
};

export const HistoricalReportDocument: React.FC<Props> = ({ config, data }) => (
  <Document>
    <HistoricalCoverPage config={config} data={data} />
    <HistoricalExecutiveSummary data={data} />
    <HistoricalTableOfContents config={config} />
    {config.modules.map((module) => {
      const Component = SECTION_MAP[module];
      const sectionData = (data as any)[DATA_KEY_MAP[module]];
      if (!Component || !sectionData) return null;
      return <Component key={module} data={sectionData} periodLabel={data.periodLabel} />;
    })}
  </Document>
);
