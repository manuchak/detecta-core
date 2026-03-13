import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  FileText, 
  Download, 
  Mail, 
  Calendar,
  ArrowUpCircle,
  ArrowDownCircle
} from 'lucide-react';
import { AgingData } from '../../hooks/useCuentasPorCobrar';
import { useEstadoCuenta, Movimiento } from '../../hooks/useFacturasCliente';
import { formatCurrency } from '@/utils/formatUtils';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import jsPDF from 'jspdf';

interface EstadoCuentaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente: AgingData | null;
}

export function EstadoCuentaModal({
  open,
  onOpenChange,
  cliente,
}: EstadoCuentaModalProps) {
  const [fechaInicio, setFechaInicio] = useState(
    format(startOfMonth(subMonths(new Date(), 2)), 'yyyy-MM-dd')
  );
  const [fechaFin, setFechaFin] = useState(
    format(endOfMonth(new Date()), 'yyyy-MM-dd')
  );

  const { data, isLoading } = useEstadoCuenta(
    cliente?.cliente_id,
    fechaInicio,
    fechaFin
  );

  const { totalCargos, totalAbonos } = useMemo(() => {
    const movimientos = data?.movimientos || [];
    let cargos = 0;
    let abonos = 0;
    for (const m of movimientos) {
      cargos += m.cargo || 0;
      abonos += m.abono || 0;
    }
    return { totalCargos: cargos, totalAbonos: abonos };
  }, [data?.movimientos]);

  const handleExportPDF = async () => {
    if (!cliente || !data) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Load logo
    let logoImg: HTMLImageElement | null = null;
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject();
        img.src = '/detecta-isotipo.png';
      });
      logoImg = img;
    } catch { /* logo optional */ }

    // Header bar
    doc.setFillColor(25, 25, 25); // #191919
    doc.rect(0, 0, pageWidth, 18, 'F');
    // Red accent line
    doc.setFillColor(235, 0, 0); // #EB0000
    doc.rect(0, 18, pageWidth, 2, 'F');

    // Logo in header
    if (logoImg) {
      doc.addImage(logoImg, 'PNG', 8, 3, 12, 12);
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('ESTADO DE CUENTA', logoImg ? 24 : 10, 12);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(format(new Date(), 'dd/MM/yyyy'), pageWidth - 10, 12, { align: 'right' });
    
    // Reset text color
    doc.setTextColor(25, 25, 25);

    // Company info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Detecta Security Services', 20, 30);
    doc.text(`Fecha de emisión: ${format(new Date(), 'dd/MM/yyyy')}`, 20, 37);
    
    // Client info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Cliente:', 20, 50);
    doc.setFont('helvetica', 'normal');
    doc.text(cliente.cliente_nombre || 'Sin nombre', 50, 50);
    doc.text(`RFC: ${cliente.cliente_rfc || 'N/A'}`, 20, 57);
    doc.text(`Período: ${format(new Date(fechaInicio), 'dd/MM/yyyy')} - ${format(new Date(fechaFin), 'dd/MM/yyyy')}`, 20, 64);
    
    // Summary box
    doc.setFillColor(245, 245, 245);
    doc.rect(20, 72, pageWidth - 40, 20, 'F');
    doc.setDrawColor(235, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(20, 72, 20, 92); // Left red accent
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(25, 25, 25);
    doc.text('RESUMEN', 25, 81);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Cargos: ${formatCurrency(totalCargos)}`, 25, 88);
    doc.text(`Total Abonos: ${formatCurrency(totalAbonos)}`, 90, 88);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(235, 0, 0);
    doc.text(`Saldo Actual: ${formatCurrency(data.saldoFinal)}`, 155, 88);
    
    // Movements table header
    let yPos = 105;
    doc.setFillColor(25, 25, 25); // #191919
    doc.setTextColor(255, 255, 255);
    doc.rect(20, yPos - 7, pageWidth - 40, 10, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Fecha', 25, yPos);
    doc.text('Concepto', 50, yPos);
    doc.text('Referencia', 95, yPos);
    doc.text('Cargo', 130, yPos);
    doc.text('Abono', 155, yPos);
    doc.text('Saldo', 180, yPos);
    
    // Movements
    doc.setTextColor(25, 25, 25);
    doc.setFont('helvetica', 'normal');
    yPos += 10;
    
    data.movimientos.forEach((mov, index) => {
      if (yPos > 270) {
        doc.addPage();
        // Repeat header bar on new pages
        doc.setFillColor(25, 25, 25);
        doc.rect(0, 0, pageWidth, 8, 'F');
        doc.setFillColor(235, 0, 0);
        doc.rect(0, 8, pageWidth, 1.5, 'F');
        yPos = 20;
      }
      
      // Alternate row colors
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(20, yPos - 5, pageWidth - 40, 8, 'F');
      }
      
      doc.setTextColor(25, 25, 25);
      doc.text(format(new Date(mov.fecha), 'dd/MM/yy'), 25, yPos);
      doc.text(mov.concepto.substring(0, 20), 50, yPos);
      doc.text(mov.referencia.substring(0, 15), 95, yPos);
      doc.setTextColor(mov.cargo > 0 ? 235 : 25, mov.cargo > 0 ? 0 : 25, mov.cargo > 0 ? 0 : 25);
      doc.text(mov.cargo > 0 ? formatCurrency(mov.cargo) : '-', 130, yPos);
      doc.setTextColor(25, 25, 25);
      doc.text(mov.abono > 0 ? formatCurrency(mov.abono) : '-', 155, yPos);
      doc.setFont('helvetica', 'bold');
      doc.text(formatCurrency(mov.saldo), 180, yPos);
      doc.setFont('helvetica', 'normal');
      
      yPos += 8;
    });
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Documento generado el ${format(new Date(), 'dd/MM/yyyy HH:mm')} — Detecta Core`,
      pageWidth / 2,
      285,
      { align: 'center' }
    );
    
    // Save
    const filename = `estado_cuenta_${cliente.cliente_nombre?.replace(/\s+/g, '_').substring(0, 20) || 'cliente'}_${format(new Date(), 'yyyyMMdd')}.pdf`;
    doc.save(filename);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Estado de Cuenta
          </DialogTitle>
          <DialogDescription>
            {cliente?.cliente_nombre} - RFC: {cliente?.cliente_rfc || 'N/A'}
          </DialogDescription>
        </DialogHeader>

        {/* Date Filters */}
        <div className="flex items-center gap-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Label className="text-sm whitespace-nowrap">Período:</Label>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="h-8 w-36"
              />
              <span className="text-muted-foreground">a</span>
              <Input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="h-8 w-36"
              />
            </div>
          </div>
          <div className="flex-1" />
          <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={isLoading || !data}>
            <Download className="h-4 w-4 mr-1.5" />
            Exportar PDF
          </Button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-4 gap-3 py-4">
          <div className="p-3 rounded-lg bg-muted/50 border">
            <p className="text-xs text-muted-foreground mb-1">Total Cargos</p>
            <p className="text-lg font-bold text-red-600">{formatCurrency(totalCargos)}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 border">
            <p className="text-xs text-muted-foreground mb-1">Total Abonos</p>
            <p className="text-lg font-bold text-emerald-600">{formatCurrency(totalAbonos)}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 border">
            <p className="text-xs text-muted-foreground mb-1"># Movimientos</p>
            <p className="text-lg font-bold">{data?.movimientos.length || 0}</p>
          </div>
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
            <p className="text-xs text-muted-foreground mb-1">Saldo Actual</p>
            <p className="text-lg font-bold text-primary">{formatCurrency(data?.saldoFinal || 0)}</p>
          </div>
        </div>

        {/* Movements Table */}
        <ScrollArea className="flex-1 border rounded-lg">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (data?.movimientos.length || 0) === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No hay movimientos en el período seleccionado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="w-[100px]">Fecha</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead className="text-right">Cargo</TableHead>
                  <TableHead className="text-right">Abono</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.movimientos.map((mov, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-sm">
                      {format(new Date(mov.fecha), 'dd/MM/yy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {mov.tipo === 'cargo' ? (
                          <ArrowUpCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <ArrowDownCircle className="h-4 w-4 text-emerald-500" />
                        )}
                        <span>{mov.concepto}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {mov.referencia}
                    </TableCell>
                    <TableCell className="text-right font-medium text-red-600">
                      {mov.cargo > 0 ? formatCurrency(mov.cargo) : '-'}
                    </TableCell>
                    <TableCell className="text-right font-medium text-emerald-600">
                      {mov.abono > 0 ? formatCurrency(mov.abono) : '-'}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(mov.saldo)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
