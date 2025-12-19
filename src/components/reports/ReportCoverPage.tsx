import React from 'react';
import { HistoricalReportData } from '@/types/reports';
import { FileText, Calendar, Building2, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ReportCoverPageProps {
  data: HistoricalReportData;
}

export function ReportCoverPage({ data }: ReportCoverPageProps) {
  const generatedDate = new Date(data.generatedAt);
  
  // Count included modules
  const includedModules = [
    data.cpa && 'CPA',
    data.ltv && 'LTV',
    data.retention && 'Retención',
    data.engagement && 'Engagement',
    data.supplyGrowth && 'Crecimiento Supply',
    data.conversion && 'Conversión',
    data.capacity && 'Capacidad',
    data.operational && 'Operacional',
    data.projections && 'Proyecciones',
  ].filter(Boolean);

  return (
    <div className="report-cover min-h-[90vh] flex flex-col justify-center items-center text-center bg-background p-8 print:break-after-page">
      {/* Logo/Brand Area */}
      <div className="mb-8">
        <div className="w-20 h-20 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
          <FileText className="h-10 w-10 text-primary" />
        </div>
      </div>

      {/* Main Title */}
      <div className="space-y-4 mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
          Informe Histórico
        </h1>
        <h2 className="text-2xl md:text-3xl font-medium text-primary">
          {data.periodLabel}
        </h2>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          Análisis integral de métricas operativas, financieras y de crecimiento
        </p>
      </div>

      {/* Report Metadata */}
      <div className="w-full max-w-lg space-y-6">
        {/* Modules Included */}
        <div className="bg-muted/30 rounded-xl p-6 text-left">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Módulos Incluidos
          </h3>
          <div className="flex flex-wrap gap-2">
            {includedModules.map((module, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full font-medium"
              >
                {module}
              </span>
            ))}
          </div>
        </div>

        {/* Generation Info */}
        <div className="grid grid-cols-2 gap-4 text-left">
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Calendar className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wider font-medium">Fecha de Generación</span>
            </div>
            <p className="font-semibold">
              {format(generatedDate, "d 'de' MMMM, yyyy", { locale: es })}
            </p>
            <p className="text-sm text-muted-foreground">
              {format(generatedDate, 'HH:mm')} hrs
            </p>
          </div>
          
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Building2 className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wider font-medium">Granularidad</span>
            </div>
            <p className="font-semibold capitalize">
              {data.config.granularity === 'year' ? 'Anual' : 
               data.config.granularity === 'month' ? 'Mensual' :
               data.config.granularity === 'week' ? 'Semanal' : 'Diario'}
            </p>
            <p className="text-sm text-muted-foreground">
              {data.config.year}
            </p>
          </div>
        </div>
      </div>

      {/* Confidentiality Notice */}
      <div className="mt-12 flex items-center gap-2 text-xs text-muted-foreground">
        <Shield className="h-3 w-3" />
        <span>Documento confidencial • Solo para uso interno</span>
      </div>

      {/* Version */}
      <p className="mt-4 text-xs text-muted-foreground/60">
        v1.0 • Dashboard Ejecutivo
      </p>
    </div>
  );
}
