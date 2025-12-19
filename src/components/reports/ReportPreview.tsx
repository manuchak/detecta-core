import React from 'react';
import { HistoricalReportData } from '@/types/reports';
import {
  CPAReportSection,
  LTVReportSection,
  RetentionReportSection,
  EngagementReportSection,
  SupplyGrowthReportSection,
  ConversionReportSection,
  CapacityReportSection,
  OperationalReportSection,
  ProjectionsReportSection,
} from '@/components/reports';
import { ReportCoverPage } from './ReportCoverPage';
import { ExecutiveSummary } from './ExecutiveSummary';
import { ReportTableOfContents } from './ReportTableOfContents';
import { ReportPageWrapper } from './ReportPageWrapper';
import '@/styles/report-print.css';

interface ReportPreviewProps {
  data: HistoricalReportData;
}

export function ReportPreview({ data }: ReportPreviewProps) {
  const generatedDate = new Date(data.generatedAt);

  // Build section list with numbers
  const sections: { key: string; title: string; component: React.ReactNode }[] = [];
  
  if (data.cpa) {
    sections.push({ key: 'cpa', title: 'Costo por Adquisición (CPA)', component: <CPAReportSection data={data.cpa} /> });
  }
  if (data.ltv) {
    sections.push({ key: 'ltv', title: 'Lifetime Value (LTV)', component: <LTVReportSection data={data.ltv} /> });
  }
  if (data.retention) {
    sections.push({ key: 'retention', title: 'Retención de Custodios', component: <RetentionReportSection data={data.retention} /> });
  }
  if (data.engagement) {
    sections.push({ key: 'engagement', title: 'Engagement', component: <EngagementReportSection data={data.engagement} /> });
  }
  if (data.supplyGrowth) {
    sections.push({ key: 'supplyGrowth', title: 'Crecimiento Supply', component: <SupplyGrowthReportSection data={data.supplyGrowth} /> });
  }
  if (data.conversion) {
    sections.push({ key: 'conversion', title: 'Tasa de Conversión', component: <ConversionReportSection data={data.conversion} /> });
  }
  if (data.capacity) {
    sections.push({ key: 'capacity', title: 'Capacidad Operativa', component: <CapacityReportSection data={data.capacity} /> });
  }
  if (data.operational) {
    sections.push({ key: 'operational', title: 'Métricas Operacionales', component: <OperationalReportSection data={data.operational} /> });
  }
  if (data.projections) {
    sections.push({ key: 'projections', title: 'Proyecciones', component: <ProjectionsReportSection data={data.projections} /> });
  }

  return (
    <div className="bg-background print:bg-white" id="report-preview">
      {/* Page 1: Cover Page */}
      <ReportCoverPage data={data} />

      {/* Page 2: Executive Summary */}
      <ExecutiveSummary data={data} />

      {/* Page 3: Table of Contents */}
      <ReportTableOfContents data={data} />

      {/* Report Sections with Page Wrappers */}
      {sections.map((section, index) => (
        <ReportPageWrapper
          key={section.key}
          sectionTitle={section.title}
          sectionNumber={index + 1}
          periodLabel={data.periodLabel}
          generatedAt={generatedDate}
          forcePageBreak={true}
        >
          <div id={`${section.key}-section`}>
            {section.component}
          </div>
        </ReportPageWrapper>
      ))}

      {/* Footer */}
      <div className="border-t border-border pt-6 pb-8 text-center text-sm text-muted-foreground print:break-before-page">
        <div className="space-y-2">
          <p className="font-medium">— Fin del Informe —</p>
          <p>Informe generado automáticamente • {generatedDate.toLocaleString('es-MX', { dateStyle: 'full', timeStyle: 'short' })}</p>
          <p className="text-xs">Los datos incluidos son sin omisiones ni resúmenes que pierdan información</p>
        </div>
      </div>
    </div>
  );
}
