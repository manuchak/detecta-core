import { format } from 'date-fns';
import React from 'react';
import type { HistoricalReportConfig, HistoricalReportData } from '@/types/reports';

/** Detecta logo URL for PDF embedding */
const LOGO_URL = '/detecta-logo.png';

/**
 * Export a Historical Report as PDF using @react-pdf/renderer.
 * Loads the company logo and passes it through to all pages.
 */
export const exportHistoricalReportToPDF = async (
  config: HistoricalReportConfig,
  data: HistoricalReportData
): Promise<boolean> => {
  try {
    document.body.style.cursor = 'wait';

    // Dynamic imports for code-splitting
    const [{ pdf }, { HistoricalReportDocument }, { loadImageAsBase64 }] = await Promise.all([
      import('@react-pdf/renderer'),
      import('@/components/reports/pdf/HistoricalReportDocument'),
      import('@/components/pdf/utils'),
    ]);

    // Load logo
    let logoBase64: string | null = null;
    try {
      logoBase64 = await loadImageAsBase64(LOGO_URL);
    } catch {
      console.warn('Could not load logo for PDF');
    }

    const doc = React.createElement(HistoricalReportDocument, { config, data, logoBase64 }) as any;
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
