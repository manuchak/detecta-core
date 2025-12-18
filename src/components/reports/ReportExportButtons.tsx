import { Button } from '@/components/ui/button';
import { FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { exportHistoricalReportToPDF } from '@/utils/historicalReportPdfExporter';
import { exportHistoricalReportToExcel } from '@/utils/historicalReportExcelExporter';
import type { HistoricalReportConfig, HistoricalReportData } from '@/types/reports';

interface ReportExportButtonsProps {
  config: HistoricalReportConfig;
  data: HistoricalReportData | null;
  disabled?: boolean;
}

export function ReportExportButtons({ config, data, disabled }: ReportExportButtonsProps) {
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  const handleExportPDF = async () => {
    if (!data) {
      toast.error('No hay datos para exportar');
      return;
    }

    setExportingPDF(true);
    try {
      await exportHistoricalReportToPDF(config, data);
      toast.success('PDF generado exitosamente');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Error al generar el PDF');
    } finally {
      setExportingPDF(false);
    }
  };

  const handleExportExcel = async () => {
    if (!data) {
      toast.error('No hay datos para exportar');
      return;
    }

    setExportingExcel(true);
    try {
      await exportHistoricalReportToExcel(config, data);
      toast.success('Excel generado exitosamente');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast.error('Error al generar el Excel');
    } finally {
      setExportingExcel(false);
    }
  };

  const isDisabled = disabled || !data;

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={handleExportPDF}
        disabled={isDisabled || exportingPDF}
        className="gap-2"
      >
        {exportingPDF ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
        Exportar PDF
      </Button>
      
      <Button
        variant="outline"
        onClick={handleExportExcel}
        disabled={isDisabled || exportingExcel}
        className="gap-2"
      >
        {exportingExcel ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="h-4 w-4" />
        )}
        Exportar Excel
      </Button>
    </div>
  );
}
