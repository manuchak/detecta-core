import { format } from 'date-fns';
import React from 'react';
import type { HistoricalReportConfig, HistoricalReportData } from '@/types/reports';

/**
 * Export a Historical Report as PDF using @react-pdf/renderer.
 * Maintains the same public API: exportHistoricalReportToPDF(config, data)
 * Uses dynamic imports to keep the main bundle lean.
 */
export const exportHistoricalReportToPDF = async (
  config: HistoricalReportConfig,
  data: HistoricalReportData
): Promise<boolean> => {
  try {
    document.body.style.cursor = 'wait';

    // Dynamic imports for code-splitting
    const [{ pdf }, { HistoricalReportDocument }] = await Promise.all([
      import('@react-pdf/renderer'),
      import('@/components/reports/pdf/HistoricalReportDocument'),
    ]);

    const doc = React.createElement(HistoricalReportDocument, { config, data }) as any;
    const blob = await pdf(doc).toBlob();

    // Download
    const generatedAt = new Date();
    const filename = `informe-historico-${config.year}${config.month ? `-${String(config.month).padStart(2, '0')}` : ''}-${format(generatedAt, 'yyyyMMdd-HHmm')}.pdf`;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    document.body.style.cursor = 'default';
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    document.body.style.cursor = 'default';
    throw error;
  }
};
