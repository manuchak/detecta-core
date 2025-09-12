import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { format } from 'date-fns';

interface PDFExportOptions {
  filename?: string;
  quality?: number;
  format?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
}

export const exportToPDF = async (
  elementId: string,
  options: PDFExportOptions = {}
) => {
  const {
    filename = `reporte-clientes-${format(new Date(), 'yyyy-MM-dd')}`,
    quality = 0.95,
    format: pdfFormat = 'a4',
    orientation = 'portrait'
  } = options;

  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with id "${elementId}" not found`);
    }

    // Show loading state
    const originalCursor = document.body.style.cursor;
    document.body.style.cursor = 'wait';

    // Create canvas from element
    const canvas = await html2canvas(element, {
      scale: 2, // Higher resolution
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      removeContainer: true,
      ignoreElements: (element) => {
        // Ignore certain elements like buttons that shouldn't be in PDF
        return element.classList.contains('pdf-ignore');
      }
    });

    // Calculate PDF dimensions
    const imgWidth = pdfFormat === 'a4' ? 210 : 216; // mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Create PDF
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: pdfFormat,
      compress: true
    });

    // Add company header
    pdf.setFontSize(20);
    pdf.setTextColor(235, 0, 0); // Corporate red
    pdf.text('Reporte de Análisis de Clientes', 20, 20);
    
    pdf.setFontSize(12);
    pdf.setTextColor(25, 25, 25); // Corporate black
    pdf.text(`Generado el ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 20, 30);

    // Add the canvas as image
    const imgData = canvas.toDataURL('image/png', quality);
    
    // Check if content fits on one page
    const pdfHeight = pdfFormat === 'a4' ? 297 : 279; // mm
    const availableHeight = pdfHeight - 40; // Leave space for header and margins
    
    if (imgHeight <= availableHeight) {
      // Single page
      pdf.addImage(imgData, 'PNG', 20, 40, imgWidth - 40, imgHeight);
    } else {
      // Multiple pages
      let yPosition = 40;
      const pageHeight = availableHeight;
      let remainingHeight = imgHeight;
      let sourceY = 0;
      
      while (remainingHeight > 0) {
        const currentPageHeight = Math.min(pageHeight, remainingHeight);
        const sourceHeight = (currentPageHeight / imgHeight) * canvas.height;
        
        // Create a temporary canvas for this page section
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sourceHeight;
        const pageCtx = pageCanvas.getContext('2d');
        
        if (pageCtx) {
          pageCtx.drawImage(
            canvas, 
            0, sourceY, canvas.width, sourceHeight,
            0, 0, canvas.width, sourceHeight
          );
          
          const pageImgData = pageCanvas.toDataURL('image/png', quality);
          pdf.addImage(pageImgData, 'PNG', 20, yPosition, imgWidth - 40, currentPageHeight);
        }
        
        remainingHeight -= currentPageHeight;
        sourceY += sourceHeight;
        
        if (remainingHeight > 0) {
          pdf.addPage();
          yPosition = 20; // Reset position for new page, less space needed as no main header
        }
      }
    }

    // Add footer
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(153, 153, 153); // Corporate gray
      pdf.text(
        `Página ${i} de ${totalPages} • Dashboard Ejecutivo`, 
        20, 
        pdfFormat === 'a4' ? 290 : 272
      );
    }

    // Save the PDF
    pdf.save(`${filename}.pdf`);

    // Reset cursor
    document.body.style.cursor = originalCursor;

    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    document.body.style.cursor = 'default';
    throw error;
  }
};

export const exportClientAnalyticsToPDF = async (clientName?: string) => {
  const filename = clientName 
    ? `analisis-cliente-${clientName.toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}`
    : `analisis-clientes-${format(new Date(), 'yyyy-MM-dd')}`;

  return exportToPDF('client-analytics-content', {
    filename,
    quality: 0.9,
    format: 'a4',
    orientation: 'portrait'
  });
};