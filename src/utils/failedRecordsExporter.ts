import * as XLSX from 'xlsx';
import { FailedRecord } from '@/services/custodianServicesImportService';

export const exportFailedRecordsToExcel = (
  failedRecords: FailedRecord[],
  filename: string = 'registros_fallidos'
): void => {
  if (failedRecords.length === 0) {
    console.warn('No failed records to export');
    return;
  }

  // Create array with error info + original data columns
  const dataWithErrors = failedRecords.map(record => ({
    FILA_ORIGINAL: record.rowIndex,
    ERROR: record.error,
    ...record.originalData
  }));

  // Create workbook and worksheet
  const ws = XLSX.utils.json_to_sheet(dataWithErrors);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Registros Fallidos');

  // Auto-size columns for better readability
  const colWidths = Object.keys(dataWithErrors[0] || {}).map(key => ({
    wch: Math.max(key.length, 15)
  }));
  ws['!cols'] = colWidths;

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().split('T')[0];
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9_-]/g, '_');
  
  // Download the file
  XLSX.writeFile(wb, `${sanitizedFilename}_${timestamp}.xlsx`);
};
