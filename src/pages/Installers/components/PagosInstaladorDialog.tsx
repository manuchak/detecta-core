import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DollarSign, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Clock, 
  CreditCard,
  Calendar,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useInstaladorData } from '@/hooks/useInstaladorData';

interface PagosInstaladorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instalador: any;
}

export const PagosInstaladorDialog: React.FC<PagosInstaladorDialogProps> = ({
  open,
  onOpenChange,
  instalador
}) => {
  const { fetchPagos, createPago, aprobarPago } = useInstaladorData();
  const [loading, setLoading] = useState(false);
  const [pagos, setPagos] = useState<any[]>([]);
  const [showNewPagoForm, setShowNewPagoForm] = useState(false);
  
  const [newPago, setNewPago] = useState({
    programacion_id: '',
    concepto: '',
    monto: 0,
    moneda: 'MXN',
    metodo_pago: '',
    observaciones: ''
  });

  useEffect(() => {
    if (instalador && open) {
      loadPagos();
    }
  }, [instalador, open]);

  const loadPagos = async () => {
    if (!instalador) return;
    
    try {
      setLoading(true);
      const data = await fetchPagos(instalador.id);
      setPagos(data);
    } catch (error) {
      console.error('Error loading pagos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePago = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instalador) return;

    try {
      setLoading(true);
      const pagoData = {
        ...newPago,
        instalador_id: instalador.id,
        estado_pago: 'pendiente'
      };

      await createPago(pagoData);
      
      // Reset form
      setNewPago({
        programacion_id: '',
        concepto: '',
        monto: 0,
        moneda: 'MXN',
        metodo_pago: '',
        observaciones: ''
      });
      setShowNewPagoForm(false);
      
      // Reload pagos
      await loadPagos();
    } catch (error) {
      console.error('Error creating pago:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAprobarPago = async (pagoId: string) => {
    try {
      setLoading(true);
      await aprobarPago(pagoId, 'Pago aprobado por coordinador');
      await loadPagos();
    } catch (error) {
      console.error('Error approving pago:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    const variants = {
      'pendiente': { variant: 'secondary' as const, className: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'aprobado': { variant: 'secondary' as const, className: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      'pagado': { variant: 'secondary' as const, className: 'bg-green-100 text-green-800', icon: CheckCircle },
      'rechazado': { variant: 'secondary' as const, className: 'bg-red-100 text-red-800', icon: XCircle },
      'cancelado': { variant: 'secondary' as const, className: 'bg-gray-100 text-gray-800', icon: XCircle }
    };

    const config = variants[estado as keyof typeof variants] || variants['pendiente'];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {estado.charAt(0).toUpperCase() + estado.slice(1)}
      </Badge>
    );
  };

  const totalPagos = pagos.reduce((sum, pago) => sum + pago.monto, 0);
  const pagosPendientes = pagos.filter(p => p.estado_pago === 'pendiente').length;
  const pagosAprobados = pagos.filter(p => p.estado_pago === 'aprobado').length;
  const pagosPagados = pagos.filter(p => p.estado_pago === 'pagado').length;

  if (!instalador) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Control de Pagos - {instalador.nombre_completo}
          </DialogTitle>
          <DialogDescription>
            Gestiona los pagos y facturación del instalador.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumen de pagos */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Pagos</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalPagos.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Monto total acumulado</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{pagosPendientes}</div>
                <p className="text-xs text-muted-foreground">Pagos por aprobar</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aprobados</CardTitle>
                <CheckCircle className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{pagosAprobados}</div>
                <p className="text-xs text-muted-foreground">Pagos aprobados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pagados</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{pagosPagados}</div>
                <p className="text-xs text-muted-foreground">Pagos completados</p>
              </CardContent>
            </Card>
          </div>

          {/* Formulario para nuevo pago */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Registrar Nuevo Pago</CardTitle>
                <Button 
                  onClick={() => setShowNewPagoForm(!showNewPagoForm)}
                  variant={showNewPagoForm ? "outline" : "default"}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {showNewPagoForm ? 'Cancelar' : 'Nuevo Pago'}
                </Button>
              </div>
            </CardHeader>
            
            {showNewPagoForm && (
              <CardContent>
                <form onSubmit={handleCreatePago} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="concepto">Concepto *</Label>
                      <Input
                        id="concepto"
                        value={newPago.concepto}
                        onChange={(e) => setNewPago(prev => ({ ...prev, concepto: e.target.value }))}
                        placeholder="Instalación GPS - Servicio #123"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="programacion_id">ID Programación</Label>
                      <Input
                        id="programacion_id"
                        value={newPago.programacion_id}
                        onChange={(e) => setNewPago(prev => ({ ...prev, programacion_id: e.target.value }))}
                        placeholder="UUID de la programación"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="monto">Monto *</Label>
                      <Input
                        id="monto"
                        type="number"
                        step="0.01"
                        min="0"
                        value={newPago.monto}
                        onChange={(e) => setNewPago(prev => ({ ...prev, monto: parseFloat(e.target.value) || 0 }))}
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="moneda">Moneda</Label>
                      <Select value={newPago.moneda} onValueChange={(value) => setNewPago(prev => ({ ...prev, moneda: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar moneda" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MXN">MXN - Pesos Mexicanos</SelectItem>
                          <SelectItem value="USD">USD - Dólares</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="metodo_pago">Método de Pago</Label>
                      <Select value={newPago.metodo_pago} onValueChange={(value) => setNewPago(prev => ({ ...prev, metodo_pago: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar método" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="transferencia">Transferencia Bancaria</SelectItem>
                          <SelectItem value="cheque">Cheque</SelectItem>
                          <SelectItem value="efectivo">Efectivo</SelectItem>
                          <SelectItem value="deposito">Depósito</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="observaciones">Observaciones</Label>
                    <Textarea
                      id="observaciones"
                      value={newPago.observaciones}
                      onChange={(e) => setNewPago(prev => ({ ...prev, observaciones: e.target.value }))}
                      placeholder="Observaciones sobre el pago..."
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowNewPagoForm(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Registrando...' : 'Registrar Pago'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            )}
          </Card>

          {/* Lista de pagos */}
          <Card>
            <CardHeader>
              <CardTitle>Historial de Pagos</CardTitle>
            </CardHeader>
            <CardContent>
              {pagos.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay pagos registrados</h3>
                  <p className="text-muted-foreground">Este instalador aún no tiene pagos en el sistema.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Concepto</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagos.map((pago) => (
                      <TableRow key={pago.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{format(new Date(pago.created_at), 'dd/MM/yyyy', { locale: es })}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{pago.concepto}</p>
                            {pago.observaciones && (
                              <p className="text-sm text-muted-foreground">{pago.observaciones}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            ${pago.monto.toLocaleString()} {pago.moneda}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getEstadoBadge(pago.estado_pago)}
                        </TableCell>
                        <TableCell>
                          {pago.metodo_pago && (
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4 text-muted-foreground" />
                              <span className="capitalize">{pago.metodo_pago}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {pago.estado_pago === 'pendiente' && (
                            <Button
                              size="sm"
                              onClick={() => handleAprobarPago(pago.id)}
                              disabled={loading}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Aprobar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};