import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { useCSQuejas } from '@/hooks/useCSQuejas';
import { useCSCapas } from '@/hooks/useCSCapa';
import { useCSTouchpoints } from '@/hooks/useCSTouchpoints';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

export function CSExportButton() {
  const { data: quejas } = useCSQuejas();
  const { data: capas } = useCSCapas();
  const { data: touchpoints } = useCSTouchpoints();
  const [exporting, setExporting] = useState(false);

  const exportQuejasExcel = () => {
    if (!quejas?.length) { toast.error('Sin datos de quejas para exportar'); return; }
    setExporting(true);
    try {
      const rows = quejas.map(q => ({
        'No. Queja': q.numero_queja,
        'Cliente': q.cliente?.nombre || '',
        'Tipo': q.tipo,
        'Severidad': q.severidad,
        'Estado': q.estado,
        'Canal': q.canal_entrada,
        'Descripción': q.descripcion,
        'Causa Raíz': q.causa_raiz || '',
        'Acción Correctiva': q.accion_correctiva || '',
        'SLA Respuesta (h)': q.sla_respuesta_horas,
        'SLA Resolución (h)': q.sla_resolucion_horas,
        'Fecha Creación': format(new Date(q.created_at), 'dd/MM/yyyy HH:mm'),
        'Fecha Resolución': q.fecha_resolucion ? format(new Date(q.fecha_resolucion), 'dd/MM/yyyy HH:mm') : '',
        'CSAT': q.calificacion_cierre || '',
        'SLA Cumplido': q.fecha_resolucion ? (
          ((new Date(q.fecha_resolucion).getTime() - new Date(q.created_at).getTime()) / (1000*60*60)) <= q.sla_resolucion_horas ? 'Sí' : 'No'
        ) : 'Pendiente',
      }));
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Quejas');
      XLSX.writeFile(wb, `CS_Quejas_${format(new Date(), 'yyyyMMdd')}.xlsx`);
      toast.success('Reporte de quejas exportado');
    } finally { setExporting(false); }
  };

  const exportCAPAsExcel = () => {
    if (!capas?.length) { toast.error('Sin datos de CAPAs para exportar'); return; }
    setExporting(true);
    try {
      const rows = capas.map(c => ({
        'No. CAPA': c.numero_capa,
        'Cliente': c.cliente?.nombre || '',
        'Tipo': c.tipo,
        'Estado': c.estado,
        'No Conformidad': c.descripcion_no_conformidad,
        'Causa Raíz': c.analisis_causa_raiz || '',
        'Acción Inmediata': c.accion_inmediata || '',
        'Acción Correctiva': c.accion_correctiva || '',
        'Acción Preventiva': c.accion_preventiva || '',
        'Fecha Target': c.fecha_implementacion ? format(new Date(c.fecha_implementacion), 'dd/MM/yyyy') : '',
        'Eficacia Verificada': c.eficacia_verificada ? 'Sí' : 'No',
        'Fecha Creación': format(new Date(c.created_at), 'dd/MM/yyyy'),
      }));
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'CAPAs');
      XLSX.writeFile(wb, `CS_CAPAs_${format(new Date(), 'yyyyMMdd')}.xlsx`);
      toast.success('Reporte de CAPAs exportado');
    } finally { setExporting(false); }
  };

  const exportTouchpointsExcel = () => {
    if (!touchpoints?.length) { toast.error('Sin datos de touchpoints para exportar'); return; }
    setExporting(true);
    try {
      const rows = touchpoints.map(t => ({
        'Tipo': t.tipo,
        'Dirección': t.direccion,
        'Resumen': t.resumen,
        'Contacto': t.contacto_nombre || '',
        'Duración (min)': t.duracion_minutos || '',
        'Siguiente Acción': t.siguiente_accion || '',
        'Fecha': format(new Date(t.created_at), 'dd/MM/yyyy HH:mm'),
      }));
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Touchpoints');
      XLSX.writeFile(wb, `CS_Touchpoints_${format(new Date(), 'yyyyMMdd')}.xlsx`);
      toast.success('Reporte de touchpoints exportado');
    } finally { setExporting(false); }
  };

  const exportQuejasPDF = () => {
    if (!quejas?.length) { toast.error('Sin datos para exportar'); return; }
    setExporting(true);
    try {
      const doc = new jsPDF({ orientation: 'landscape' });
      doc.setFontSize(16);
      doc.text('Reporte de Quejas — Customer Success', 14, 20);
      doc.setFontSize(10);
      doc.text(`Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}`, 14, 28);
      doc.text(`Total: ${quejas.length} quejas`, 14, 34);

      const cerradas = quejas.filter(q => q.fecha_resolucion);
      const enSLA = cerradas.filter(q => {
        const h = (new Date(q.fecha_resolucion!).getTime() - new Date(q.created_at).getTime()) / (1000*60*60);
        return h <= q.sla_resolucion_horas;
      });
      const sla = cerradas.length ? Math.round((enSLA.length / cerradas.length) * 100) : 100;
      doc.text(`SLA Compliance: ${sla}%`, 14, 40);

      let y = 50;
      // Headers
      doc.setFontSize(8);
      doc.setFont(undefined!, 'bold');
      ['No.', 'Cliente', 'Tipo', 'Severidad', 'Estado', 'SLA', 'Fecha'].forEach((h, i) => {
        doc.text(h, 14 + i * 40, y);
      });
      doc.setFont(undefined!, 'normal');
      y += 6;

      quejas.forEach(q => {
        if (y > 190) { doc.addPage(); y = 20; }
        const slaOk = q.fecha_resolucion
          ? ((new Date(q.fecha_resolucion).getTime() - new Date(q.created_at).getTime()) / (1000*60*60)) <= q.sla_resolucion_horas ? '✓' : '✗'
          : '⏳';
        const row = [
          q.numero_queja,
          (q.cliente?.nombre || '').substring(0, 20),
          q.tipo.substring(0, 15),
          q.severidad,
          q.estado,
          slaOk,
          format(new Date(q.created_at), 'dd/MM/yy'),
        ];
        row.forEach((cell, i) => {
          doc.text(String(cell), 14 + i * 40, y);
        });
        y += 5;
      });

      doc.save(`CS_Quejas_${format(new Date(), 'yyyyMMdd')}.pdf`);
      toast.success('PDF de quejas generado');
    } finally { setExporting(false); }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={exporting} className="gap-1.5">
          <Download className="h-4 w-4" />
          {exporting ? 'Exportando...' : 'Exportar'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportQuejasExcel} className="gap-2">
          <FileSpreadsheet className="h-4 w-4" /> Quejas (Excel)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportQuejasPDF} className="gap-2">
          <FileText className="h-4 w-4" /> Quejas (PDF)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={exportCAPAsExcel} className="gap-2">
          <FileSpreadsheet className="h-4 w-4" /> CAPAs (Excel)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={exportTouchpointsExcel} className="gap-2">
          <FileSpreadsheet className="h-4 w-4" /> Touchpoints (Excel)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
