import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ReportPageWrapperProps {
  children: React.ReactNode;
  sectionTitle: string;
  sectionNumber: number;
  periodLabel: string;
  reportName?: string;
  generatedAt?: Date;
  forcePageBreak?: boolean;
}

export function ReportPageWrapper({ 
  children, 
  sectionTitle, 
  sectionNumber,
  periodLabel,
  reportName = 'Informe Histórico',
  generatedAt = new Date(),
  forcePageBreak = true
}: ReportPageWrapperProps) {
  return (
    <div className={`report-page-wrapper ${forcePageBreak ? 'print:break-before-page' : ''}`}>
      {/* Section Header */}
      <div className="report-page-header report-section-header flex justify-between items-center pb-3 mb-6 border-b-2 border-primary">
        <div className="flex items-center gap-3">
          {/* Section Number Badge */}
          <div className="report-section-number w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
            {sectionNumber}
          </div>
          {/* Section Title */}
          <h2 className="report-section-title text-lg font-semibold text-foreground">
            {sectionTitle}
          </h2>
        </div>
        
        {/* Period Badge */}
        <span className="report-period-badge text-xs px-3 py-1 bg-muted text-muted-foreground rounded-full">
          {periodLabel}
        </span>
      </div>

      {/* Content */}
      <div className="report-page-content">
        {children}
      </div>

      {/* Page Footer */}
      <div className="report-page-footer mt-8 pt-3 border-t border-border flex justify-between items-center text-[10px] text-muted-foreground print:mt-auto">
        <span>{reportName} • {periodLabel}</span>
        <span>Generado: {format(generatedAt, "d MMM yyyy, HH:mm", { locale: es })}</span>
      </div>
    </div>
  );
}
