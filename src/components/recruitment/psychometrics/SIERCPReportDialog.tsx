import React, { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Printer, AlertCircle, RefreshCw, Download } from 'lucide-react';
import { useSIERCPReport } from '@/hooks/useSIERCPReport';
import { SIERCPPrintableReport } from '@/components/evaluation/SIERCPPrintableReport';
import type { EvaluacionPsicometrica } from '@/hooks/useEvaluacionesPsicometricas';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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

function buildModuleScores(evaluation: EvaluacionPsicometrica) {
  return scoreMapping
    .filter(m => evaluation[m.key] != null)
    .map(m => {
      const score = evaluation[m.key] as number;
      return { name: m.name, score, maxScore: 100, percentage: score };
    });
}

export function SIERCPReportDialog({ open, onOpenChange, evaluation, candidateName }: Props) {
  const { loading, report, error, generateReport, saveReport, loadReport, clearReport } = useSIERCPReport();
  const [pdfLoading, setPdfLoading] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!open) return;
    
    // If there's a saved report in DB, load it instantly
    if (evaluation.ai_report && !report && !loading) {
      loadReport(evaluation.ai_report);
      return;
    }

    // If no saved report and no current report, generate
    if (!evaluation.ai_report && !report && !loading) {
      handleGenerate();
    }
  }, [open]);

  const handleGenerate = async () => {
    const generated = await generateReport({
      globalScore: evaluation.score_global,
      moduleScores: buildModuleScores(evaluation),
      riskFlags: evaluation.risk_flags || [],
      candidateName,
      evaluationDate: evaluation.fecha_evaluacion,
    });

    // Save to DB after successful generation
    if (generated) {
      await saveReport(evaluation.id, generated);
      queryClient.invalidateQueries({ queryKey: ['siercp-invitations-all'] });
      queryClient.invalidateQueries({ queryKey: ['evaluaciones-psicometricas'] });
      queryClient.invalidateQueries({ queryKey: ['evaluacion-psicometrica-latest'] });
    }
  };

  const handleRegenerate = async () => {
    clearReport();
    const generated = await generateReport({
      globalScore: evaluation.score_global,
      moduleScores: buildModuleScores(evaluation),
      riskFlags: evaluation.risk_flags || [],
      candidateName,
      evaluationDate: evaluation.fecha_evaluacion,
    });

    if (generated) {
      await saveReport(evaluation.id, generated);
      queryClient.invalidateQueries({ queryKey: ['siercp-invitations-all'] });
      queryClient.invalidateQueries({ queryKey: ['evaluaciones-psicometricas'] });
      queryClient.invalidateQueries({ queryKey: ['evaluacion-psicometrica-latest'] });
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    clearReport();
  };

  const getReportTitle = () => {
    const name = candidateName || 'Candidato';
    const date = format(new Date(evaluation.fecha_evaluacion), 'yyyy-MM-dd');
    return `Informe_SIERCP_${name.replace(/\s+/g, '_')}_${date}`;
  };

  /** Inline SVG computed styles so they survive cloning to a new window */
  const inlineSvgStyles = (container: HTMLElement) => {
    const svgs = container.querySelectorAll('svg');
    svgs.forEach(svg => {
      // Serialize each SVG properly
      const computed = window.getComputedStyle(svg);
      svg.setAttribute('width', computed.width);
      svg.setAttribute('height', computed.height);
      
      // Inline styles on all SVG children
      const elements = svg.querySelectorAll('*');
      elements.forEach(el => {
        const cs = window.getComputedStyle(el);
        const important = ['fill', 'stroke', 'stroke-width', 'opacity', 'transform', 
          'font-size', 'font-family', 'font-weight', 'text-anchor', 'dominant-baseline',
          'color', 'stop-color', 'stop-opacity', 'stroke-dasharray', 'stroke-linecap'];
        important.forEach(prop => {
          const val = cs.getPropertyValue(prop);
          if (val && val !== 'none' && val !== 'normal' && val !== '0') {
            (el as HTMLElement).style.setProperty(prop, val);
          }
        });
      });
    });
  };

  const handlePrint = () => {
    if (!reportRef.current) return;
    
    const title = getReportTitle();
    
    // Clone the report node
    const clone = reportRef.current.cloneNode(true) as HTMLElement;
    
    // Inline SVG computed styles on the ORIGINAL (computed styles only exist there)
    // then re-clone
    inlineSvgStyles(reportRef.current);
    const styledClone = reportRef.current.cloneNode(true) as HTMLElement;
    
    // Collect CSS from stylesheets
    let cssText = '';
    Array.from(document.styleSheets).forEach(sheet => {
      try {
        Array.from(sheet.cssRules).forEach(rule => { cssText += rule.cssText + '\n'; });
      } catch {
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
            body { margin: 0; padding: 20px; background: white; color: black; }
            .siercp-report { display: block !important; }
            svg { max-width: 100%; }
            @media print {
              @page { size: A4 portrait; margin: 12mm; }
              body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>${styledClone.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    
    // Wait for fonts/styles to load before printing
    printWindow.onload = () => {
      setTimeout(() => { printWindow.print(); }, 600);
    };
    // Fallback if onload doesn't fire
    setTimeout(() => { printWindow.print(); }, 1200);
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    setPdfLoading(true);
    
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const usableWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * usableWidth) / canvas.width;
      
      let yOffset = margin;
      let remainingHeight = imgHeight;
      
      // Multi-page support
      while (remainingHeight > 0) {
        const sliceHeight = Math.min(remainingHeight, pageHeight - margin * 2);
        pdf.addImage(imgData, 'PNG', margin, yOffset - (imgHeight - remainingHeight), usableWidth, imgHeight);
        remainingHeight -= sliceHeight;
        if (remainingHeight > 0) {
          pdf.addPage();
          yOffset = margin;
        }
      }
      
      pdf.save(`${getReportTitle()}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto print:max-w-none print:max-h-none print:overflow-visible">
        <DialogHeader className="print:hidden">
          <DialogTitle className="flex items-center justify-between">
            <span>Informe Profesional SIERCP</span>
            <div className="flex items-center gap-2">
              {report && !loading && (
                <>
                  <Button size="sm" variant="ghost" onClick={handleRegenerate}>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Regenerar
                  </Button>
                  <Button size="sm" variant="outline" onClick={handlePrint}>
                    <Printer className="h-4 w-4 mr-1" />
                    Imprimir
                  </Button>
                  <Button size="sm" variant="default" onClick={handleDownloadPDF} disabled={pdfLoading}>
                    {pdfLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}
                    Descargar PDF
                  </Button>
                </>
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
            <Button variant="outline" onClick={handleGenerate}>
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
