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
import { FileText, Calendar, Clock } from 'lucide-react';

interface ReportPreviewProps {
  data: HistoricalReportData;
}

export function ReportPreview({ data }: ReportPreviewProps) {
  const generatedDate = new Date(data.generatedAt).toLocaleString('es-MX', {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  return (
    <div className="space-y-8 p-6 bg-background" id="report-preview">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Informe Histórico Detallado</h1>
            <p className="text-lg text-muted-foreground">{data.periodLabel}</p>
          </div>
        </div>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Período: {data.periodLabel}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            Generado: {generatedDate}
          </span>
        </div>
      </div>

      {/* Table of Contents */}
      <div className="bg-muted/30 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Contenido del Informe</h3>
        <ul className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
          {data.cpa && <li><a href="#cpa-section" className="text-primary hover:underline">• CPA</a></li>}
          {data.ltv && <li><a href="#ltv-section" className="text-primary hover:underline">• LTV</a></li>}
          {data.retention && <li><a href="#retention-section" className="text-primary hover:underline">• Retención</a></li>}
          {data.engagement && <li><a href="#engagement-section" className="text-primary hover:underline">• Engagement</a></li>}
          {data.supplyGrowth && <li><a href="#supply-growth-section" className="text-primary hover:underline">• Crecimiento Supply</a></li>}
          {data.conversion && <li><a href="#conversion-section" className="text-primary hover:underline">• Conversión</a></li>}
          {data.capacity && <li><a href="#capacity-section" className="text-primary hover:underline">• Capacidad</a></li>}
          {data.operational && <li><a href="#operational-section" className="text-primary hover:underline">• Operacional</a></li>}
          {data.projections && <li><a href="#projections-section" className="text-primary hover:underline">• Proyecciones</a></li>}
        </ul>
      </div>

      {/* Report Sections */}
      {data.cpa && <CPAReportSection data={data.cpa} />}
      {data.ltv && <LTVReportSection data={data.ltv} />}
      {data.retention && <RetentionReportSection data={data.retention} />}
      {data.engagement && <EngagementReportSection data={data.engagement} />}
      {data.supplyGrowth && <SupplyGrowthReportSection data={data.supplyGrowth} />}
      {data.conversion && <ConversionReportSection data={data.conversion} />}
      {data.capacity && <CapacityReportSection data={data.capacity} />}
      {data.operational && <OperationalReportSection data={data.operational} />}
      {data.projections && <ProjectionsReportSection data={data.projections} />}

      {/* Footer */}
      <div className="border-t border-border pt-6 text-center text-sm text-muted-foreground">
        <p>Informe generado automáticamente • {generatedDate}</p>
        <p>Los datos incluidos son sin omisiones ni resúmenes que pierdan información</p>
      </div>
    </div>
  );
}
