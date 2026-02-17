import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import React from 'react';
import type { ClientDashboardMetrics, ClientTableData, ClientMetrics } from '@/hooks/useClientAnalytics';

const LOGO_URL = '/detecta-logo.png';

export interface ClientAnalyticsPDFData {
  dateRange: { from: Date; to: Date };
  dateLabel: string;
  clientMetrics: ClientDashboardMetrics | null;
  tableData: ClientTableData[];
  clientAnalytics?: ClientMetrics | null;
}

/**
 * Export the Client Analytics dashboard as a native React PDF document.
 * Uses already-loaded in-memory data — no additional queries.
 */
export const exportClientAnalyticsPDF = async (
  data: ClientAnalyticsPDFData,
  clientName?: string
): Promise<boolean> => {
  try {
    document.body.style.cursor = 'wait';

    const [{ pdf }, { ClientAnalyticsPDFDocument }, { loadImageAsBase64 }, { registerPDFFonts }] =
      await Promise.all([
        import('@react-pdf/renderer'),
        import('./ClientAnalyticsPDFDocument'),
        import('@/components/pdf/utils'),
        import('@/components/pdf/fontSetup'),
      ]);

    registerPDFFonts();

    let logoBase64: string | null = null;
    try {
      logoBase64 = await loadImageAsBase64(LOGO_URL);
    } catch {
      console.warn('No se pudo cargar el logo para el PDF');
    }

    const doc = React.createElement(ClientAnalyticsPDFDocument, {
      logoBase64,
      dateRange: data.dateRange,
      dateLabel: data.dateLabel,
      clientMetrics: data.clientMetrics,
      tableData: data.tableData,
      clientAnalytics: data.clientAnalytics,
    }) as any;

    const blob = await pdf(doc).toBlob();

    const slug = clientName
      ? clientName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      : 'dashboard';

    const filename = `analisis-clientes-${slug}-${format(new Date(), 'yyyyMMdd-HHmm')}.pdf`;

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
