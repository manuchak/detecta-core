import React, { useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Printer, X, AlertCircle, RefreshCw } from 'lucide-react';
import { useSIERCPReport } from '@/hooks/useSIERCPReport';
import { SIERCPPrintableReport } from '@/components/evaluation/SIERCPPrintableReport';
import type { EvaluacionPsicometrica } from '@/hooks/useEvaluacionesPsicometricas';
import { format } from 'date-fns';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evaluation: EvaluacionPsicometrica;
  candidateName?: string;
}

const scoreMapping: { key: keyof EvaluacionPsicometrica; name: string }[] = [
  { key: 'score_integridad', name: 'Integridad Moral' },
  { key: 'score_psicopatia', name: 'Indicadores de Psicopatía' },
  { key: 'score_violencia', name: 'Tendencia a la Violencia' },
  { key: 'score_agresividad', name: 'Control de Impulsos' },
  { key: 'score_afrontamiento', name: 'Afrontamiento al Estrés' },
  { key: 'score_veracidad', name: 'Escala de Veracidad' },
  { key: 'score_entrevista', name: 'Entrevista Estructurada' },
];

export function SIERCPReportDialog({ open, onOpenChange, evaluation, candidateName }: Props) {
  const { loading, report, error, generateReport, clearReport } = useSIERCPReport();
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && !report && !loading) {
      const moduleScores = scoreMapping
        .filter(m => evaluation[m.key] != null)
        .map(m => {
          const score = evaluation[m.key] as number;
          return { name: m.name, score, maxScore: 100, percentage: score };
        });

      const riskFlags = evaluation.risk_flags || [];

      generateReport({
        globalScore: evaluation.score_global,
        moduleScores,
        riskFlags,
        candidateName,
        evaluationDate: evaluation.fecha_evaluacion,
      });
    }
  }, [open]);

  const handleClose = () => {
    onOpenChange(false);
    clearReport();
  };

  const handlePrint = () => {
    if (!reportRef.current) return;
    
    const name = candidateName || 'Candidato';
    const date = format(new Date(evaluation.fecha_evaluacion), 'yyyy-MM-dd');
    const title = `Informe_SIERCP_${name.replace(/\s+/g, '_')}_${date}`;
    
    // Collect all stylesheets from current document
    const styleSheets = Array.from(document.styleSheets);
    let cssText = '';
    styleSheets.forEach(sheet => {
      try {
        const rules = Array.from(sheet.cssRules);
        rules.forEach(rule => { cssText += rule.cssText + '\n'; });
      } catch {
        // Cross-origin sheets - include via link
        if (sheet.href) {
          cssText += `@import url("${sheet.href}");\n`;
        }
      }
    });
    
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>${cssText}</style>
          <style>
            body { margin: 0; padding: 20px; background: white; }
            .siercp-report { display: block !important; }
            @media print {
              @page { size: A4 portrait; margin: 15mm; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>${reportRef.current.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    
    // Wait for styles to load then print
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const handleRetry = () => {
    clearReport();
    const moduleScores = scoreMapping
      .filter(m => evaluation[m.key] != null)
      .map(m => {
        const score = evaluation[m.key] as number;
        return { name: m.name, score, maxScore: 100, percentage: score };
      });

    generateReport({
      globalScore: evaluation.score_global,
      moduleScores,
      riskFlags: evaluation.risk_flags || [],
      candidateName,
      evaluationDate: evaluation.fecha_evaluacion,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto print:max-w-none print:max-h-none print:overflow-visible">
        <DialogHeader className="print:hidden">
          <DialogTitle className="flex items-center justify-between">
            <span>Informe Profesional SIERCP</span>
            <div className="flex items-center gap-2">
              {report && (
                <Button size="sm" variant="outline" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-1" />
                  Imprimir / PDF
                </Button>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">Generando informe profesional con IA...</p>
            <p className="text-muted-foreground text-xs">Esto puede tomar 10-15 segundos</p>
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p className="text-destructive font-medium">Error al generar el informe</p>
            <p className="text-muted-foreground text-sm text-center max-w-md">{error}</p>
            <Button variant="outline" onClick={handleRetry}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Reintentar
            </Button>
          </div>
        )}

        {report && !loading && (
          <div ref={reportRef}>
            <SIERCPPrintableReport report={report} candidateName={candidateName} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
