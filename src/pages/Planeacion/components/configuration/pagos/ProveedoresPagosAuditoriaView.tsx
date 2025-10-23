import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useProveedoresArmados } from '@/hooks/useProveedoresArmados';
import useProveedoresPagos, { ProveedorPagoRecord } from '@/hooks/useProveedoresPagos';
import { ProveedorFinancialSummaryCard } from './ProveedorFinancialSummaryCard';
import { PagosDataTable } from './PagosDataTable';
import { RegistrarPagoDialog } from './RegistrarPagoDialog';
import { RegistrarPagoMasivoDialog } from './RegistrarPagoMasivoDialog';
import { Download, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export function ProveedoresPagosAuditoriaView() {
  const [selectedProveedor, setSelectedProveedor] = useState<string>('todos');
  const [selectedServicio, setSelectedServicio] = useState<ProveedorPagoRecord | null>(null);
  const [showPagoDialog, setShowPagoDialog] = useState(false);
  const [showPagoMasivoDialog, setShowPagoMasivoDialog] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { proveedores, loading: loadingProveedores } = useProveedoresArmados();
  const {
    serviciosConPagos,
    loading: loadingPagos,
    registrarPago,
    registrarPagosMasivos,
    getResumenFinanciero,
  } = useProveedoresPagos(selectedProveedor === 'todos' ? undefined : selectedProveedor);

  const filteredServicios = selectedProveedor === 'todos'
    ? serviciosConPagos
    : serviciosConPagos.filter(s => s.proveedor_id === selectedProveedor);

  const resumen = getResumenFinanciero(selectedProveedor === 'todos' ? undefined : selectedProveedor);

  const handleRegistrarPago = (servicio: ProveedorPagoRecord) => {
    setSelectedServicio(servicio);
    setShowPagoDialog(true);
  };

  const handleVerDetalle = (servicio: ProveedorPagoRecord) => {
    toast.info('Detalle del servicio', {
      description: `Servicio: ${servicio.servicio_id} - ${servicio.estado_pago}`,
    });
  };

  const handlePagoMasivo = () => {
    if (selectedIds.length === 0) {
      toast.error('Seleccione al menos un servicio pendiente');
      return;
    }
    setShowPagoMasivoDialog(true);
  };

  const selectedServiciosForMassive = filteredServicios.filter(s => selectedIds.includes(s.id));

  const handleExportExcel = () => {
    toast.info('Exportando a Excel...', {
      description: 'Esta función estará disponible próximamente',
    });
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Proveedor</Label>
              <Select value={selectedProveedor} onValueChange={setSelectedProveedor}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los Proveedores</SelectItem>
                  {proveedores.map((proveedor) => (
                    <SelectItem key={proveedor.id} value={proveedor.id}>
                      {proveedor.nombre_empresa}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <ProveedorFinancialSummaryCard resumen={resumen} loading={loadingPagos} />

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            onClick={handlePagoMasivo}
            disabled={selectedIds.length === 0}
            size="lg"
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Pagar Seleccionados ({selectedIds.length})
          </Button>
        </div>
        <Button variant="outline" onClick={handleExportExcel}>
          <Download className="h-4 w-4 mr-2" />
          Exportar Excel
        </Button>
      </div>

      {/* Services Table */}
      <Card>
        <CardHeader>
          <CardTitle>Servicios Completados ({filteredServicios.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <PagosDataTable
            servicios={filteredServicios}
            loading={loadingPagos}
            onRegistrarPago={handleRegistrarPago}
            onVerDetalle={handleVerDetalle}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
          />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <RegistrarPagoDialog
        open={showPagoDialog}
        onOpenChange={setShowPagoDialog}
        servicio={selectedServicio}
        onConfirm={registrarPago}
      />

      <RegistrarPagoMasivoDialog
        open={showPagoMasivoDialog}
        onOpenChange={setShowPagoMasivoDialog}
        servicios={selectedServiciosForMassive}
        onConfirm={registrarPagosMasivos}
      />
    </div>
  );
}
