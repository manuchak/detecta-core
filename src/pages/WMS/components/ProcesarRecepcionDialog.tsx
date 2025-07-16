import { useState, useEffect } from 'react';
import { Package, Check, X, AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRecepciones } from '@/hooks/useRecepciones';
import type { RecepcionMercancia, DetalleRecepcion } from '@/types/wms';

interface ProcesarRecepcionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recepcion: RecepcionMercancia;
}

interface DetalleRecepcionForm extends Partial<DetalleRecepcion> {
  temp_id: string;
  cantidad_recibida: number;
  estado_producto: 'bueno' | 'dañado' | 'defectuoso';
  notas?: string;
}

export const ProcesarRecepcionDialog = ({ open, onOpenChange, recepcion }: ProcesarRecepcionDialogProps) => {
  const [detalles, setDetalles] = useState<DetalleRecepcionForm[]>([]);
  const [observacionesGenerales, setObservacionesGenerales] = useState('');
  const { procesarRecepcion } = useRecepciones();

  useEffect(() => {
    if (recepcion.orden_compra?.detalles) {
      // Inicializar detalles basados en la orden de compra
      const detallesIniciales = recepcion.orden_compra.detalles.map((detalle, index) => ({
        temp_id: `temp_${index}`,
        producto_id: detalle.producto_id,
        cantidad_esperada: detalle.cantidad_solicitada,
        cantidad_recibida: detalle.cantidad_solicitada, // Por defecto, esperamos recibir todo
        estado_producto: 'bueno' as const,
        precio_unitario: detalle.precio_unitario,
        subtotal_esperado: detalle.subtotal || 0,
        notas: '',
        // Incluir datos del producto para mostrar
        producto: detalle.producto
      }));
      setDetalles(detallesIniciales);
    }
  }, [recepcion]);

  const handleCantidadChange = (tempId: string, cantidad: number) => {
    setDetalles(prev => prev.map(detalle => 
      detalle.temp_id === tempId 
        ? { 
            ...detalle, 
            cantidad_recibida: cantidad,
            subtotal_recibido: cantidad * (detalle.precio_unitario || 0)
          }
        : detalle
    ));
  };

  const handleEstadoChange = (tempId: string, estado: 'bueno' | 'dañado' | 'defectuoso') => {
    setDetalles(prev => prev.map(detalle => 
      detalle.temp_id === tempId ? { ...detalle, estado_producto: estado } : detalle
    ));
  };

  const handleNotasChange = (tempId: string, notas: string) => {
    setDetalles(prev => prev.map(detalle => 
      detalle.temp_id === tempId ? { ...detalle, notas } : detalle
    ));
  };

  const onSubmit = async () => {
    try {
      const detallesParaProcesar = detalles.map(detalle => ({
        producto_id: detalle.producto_id!,
        cantidad_esperada: detalle.cantidad_esperada!,
        cantidad_recibida: detalle.cantidad_recibida,
        estado_producto: detalle.estado_producto,
        precio_unitario: detalle.precio_unitario,
        subtotal_esperado: detalle.subtotal_esperado,
        subtotal_recibido: detalle.subtotal_recibido,
        notas: detalle.notas
      }));

      await procesarRecepcion.mutateAsync({
        recepcionId: recepcion.id,
        detalles: detallesParaProcesar
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error al procesar recepción:', error);
    }
  };

  const getTotalEsperado = () => {
    return detalles.reduce((sum, detalle) => sum + (detalle.subtotal_esperado || 0), 0);
  };

  const getTotalRecibido = () => {
    return detalles.reduce((sum, detalle) => sum + (detalle.subtotal_recibido || 0), 0);
  };

  const getDiferencias = () => {
    return detalles.filter(detalle => 
      detalle.cantidad_recibida !== detalle.cantidad_esperada || 
      detalle.estado_producto !== 'bueno'
    ).length;
  };

  const getEstadoBadge = (estado: string) => {
    const variants = {
      bueno: 'bg-green-100 text-green-800',
      dañado: 'bg-yellow-100 text-yellow-800',
      defectuoso: 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={variants[estado as keyof typeof variants]}>
        {estado}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Procesar Recepción - {recepcion.numero_recepcion}
          </DialogTitle>
          <DialogDescription>
            Registra las cantidades recibidas y el estado de cada producto. Las diferencias se marcarán automáticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Total Esperado</p>
                    <p className="text-lg font-bold">${getTotalEsperado().toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Total Recibido</p>
                    <p className="text-lg font-bold">${getTotalRecibido().toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium">Diferencias</p>
                    <p className="text-lg font-bold">{getDiferencias()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium">Items</p>
                    <p className="text-lg font-bold">{detalles.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detalles */}
          <Card>
            <CardHeader>
              <CardTitle>Detalles de Recepción</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Esperado</TableHead>
                      <TableHead>Recibido</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Diferencia</TableHead>
                      <TableHead>Notas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detalles.map((detalle) => {
                      const diferencia = detalle.cantidad_recibida - (detalle.cantidad_esperada || 0);
                      return (
                        <TableRow key={detalle.temp_id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{detalle.producto?.nombre}</p>
                              <p className="text-sm text-muted-foreground">{detalle.producto?.sku}</p>
                            </div>
                          </TableCell>
                          <TableCell>{detalle.cantidad_esperada}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={detalle.cantidad_recibida}
                              onChange={(e) => handleCantidadChange(detalle.temp_id, parseInt(e.target.value) || 0)}
                              className="w-20"
                              min="0"
                            />
                          </TableCell>
                          <TableCell>
                            <Select 
                              value={detalle.estado_producto} 
                              onValueChange={(value: 'bueno' | 'dañado' | 'defectuoso') => 
                                handleEstadoChange(detalle.temp_id, value)
                              }
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="bueno">Bueno</SelectItem>
                                <SelectItem value="dañado">Dañado</SelectItem>
                                <SelectItem value="defectuoso">Defectuoso</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className={diferencia !== 0 ? 'font-medium text-yellow-600' : ''}>
                                {diferencia > 0 ? '+' : ''}{diferencia}
                              </span>
                              {diferencia !== 0 && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input
                              value={detalle.notas || ''}
                              onChange={(e) => handleNotasChange(detalle.temp_id, e.target.value)}
                              placeholder="Observaciones..."
                              className="w-32"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Observaciones Generales */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Observaciones Generales</label>
            <Textarea
              value={observacionesGenerales}
              onChange={(e) => setObservacionesGenerales(e.target.value)}
              placeholder="Observaciones sobre la recepción completa..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={onSubmit} 
            disabled={procesarRecepcion.isPending}
            className="gap-2"
          >
            {procesarRecepcion.isPending ? (
              'Procesando...'
            ) : (
              <>
                <Check className="h-4 w-4" />
                Completar Recepción
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};