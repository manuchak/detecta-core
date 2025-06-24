
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, XCircle, Truck } from 'lucide-react';
import { useOrdenesCompra } from '@/hooks/useOrdenesCompra';
import { useToast } from '@/hooks/use-toast';
import type { OrdenCompra } from '@/types/wms';

interface RecepcionMercanciaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orden?: OrdenCompra | null;
  onClose: () => void;
}

interface RecepcionDetalle {
  detalle_id: string;
  producto_nombre: string;
  cantidad_solicitada: number;
  cantidad_recibida: number;
  estado_producto: 'bueno' | 'dañado' | 'defectuoso';
  notas?: string;
}

export const RecepcionMercanciaDialog = ({
  open,
  onOpenChange,
  orden,
  onClose
}: RecepcionMercanciaDialogProps) => {
  const { toast } = useToast();
  const { recibirOrden } = useOrdenesCompra();
  
  const [detallesRecepcion, setDetallesRecepcion] = useState<RecepcionDetalle[]>([]);
  const [notasGenerales, setNotasGenerales] = useState('');

  // Inicializar detalles cuando se abre el diálogo
  useState(() => {
    if (orden?.detalles) {
      setDetallesRecepcion(
        orden.detalles.map(detalle => ({
          detalle_id: detalle.id,
          producto_nombre: detalle.producto?.nombre || '',
          cantidad_solicitada: detalle.cantidad_solicitada,
          cantidad_recibida: detalle.cantidad_solicitada, // Por defecto, recibir todo
          estado_producto: 'bueno' as const,
          notas: ''
        }))
      );
    }
  });

  const actualizarDetalle = (index: number, campo: keyof RecepcionDetalle, valor: any) => {
    const nuevosDetalles = [...detallesRecepcion];
    nuevosDetalles[index] = { ...nuevosDetalles[index], [campo]: valor };
    setDetallesRecepcion(nuevosDetalles);
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'bueno':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'dañado':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'defectuoso':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const onSubmit = async () => {
    if (!orden) return;

    try {
      await recibirOrden.mutateAsync({
        ordenId: orden.id,
        detallesRecepcion: detallesRecepcion.map(detalle => ({
          detalle_id: detalle.detalle_id,
          cantidad_recibida: detalle.cantidad_recibida,
          estado_producto: detalle.estado_producto,
          notas: detalle.notas
        }))
      });

      toast({
        title: "Recepción completada",
        description: "La mercancía ha sido recibida e ingresada al inventario correctamente.",
      });

      onClose();
    } catch (error) {
      console.error('Error processing reception:', error);
      toast({
        title: "Error",
        description: "No se pudo procesar la recepción de mercancía.",
        variant: "destructive",
      });
    }
  };

  const totalEsperado = detallesRecepcion.reduce((sum, d) => sum + d.cantidad_solicitada, 0);
  const totalRecibido = detallesRecepcion.reduce((sum, d) => sum + d.cantidad_recibida, 0);
  const tieneProblemas = detallesRecepcion.some(d => 
    d.cantidad_recibida !== d.cantidad_solicitada || 
    d.estado_producto !== 'bueno'
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Recepción de Mercancía
          </DialogTitle>
          <DialogDescription>
            Orden: {orden?.numero_orden} - Proveedor: {orden?.proveedor?.nombre}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumen */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumen de Recepción</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{totalEsperado}</p>
                  <p className="text-sm text-gray-500">Productos Esperados</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{totalRecibido}</p>
                  <p className="text-sm text-gray-500">Productos Recibidos</p>
                </div>
                <div>
                  <Badge className={tieneProblemas ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}>
                    {tieneProblemas ? 'Con Diferencias' : 'Sin Problemas'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detalles de productos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Verificación de Productos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {detallesRecepcion.map((detalle, index) => (
                <Card key={detalle.detalle_id} className="p-4">
                  <div className="grid grid-cols-6 gap-4 items-center">
                    <div className="col-span-2">
                      <Label className="font-medium">{detalle.producto_nombre}</Label>
                      <p className="text-sm text-gray-500">
                        Esperado: {detalle.cantidad_solicitada} unidades
                      </p>
                    </div>

                    <div>
                      <Label>Cantidad Recibida</Label>
                      <Input
                        type="number"
                        min="0"
                        max={detalle.cantidad_solicitada}
                        value={detalle.cantidad_recibida}
                        onChange={(e) => actualizarDetalle(index, 'cantidad_recibida', parseInt(e.target.value) || 0)}
                      />
                    </div>

                    <div>
                      <Label>Estado</Label>
                      <Select
                        value={detalle.estado_producto}
                        onValueChange={(value) => actualizarDetalle(index, 'estado_producto', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bueno">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              Bueno
                            </div>
                          </SelectItem>
                          <SelectItem value="dañado">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-yellow-500" />
                              Dañado
                            </div>
                          </SelectItem>
                          <SelectItem value="defectuoso">
                            <div className="flex items-center gap-2">
                              <XCircle className="h-4 w-4 text-red-500" />
                              Defectuoso
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2">
                      <Label>Notas</Label>
                      <Input
                        placeholder="Observaciones..."
                        value={detalle.notas || ''}
                        onChange={(e) => actualizarDetalle(index, 'notas', e.target.value)}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </CardContent>
          </Card>

          {/* Notas generales */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notas de Recepción</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Notas generales sobre la recepción..."
                value={notasGenerales}
                onChange={(e) => setNotasGenerales(e.target.value)}
                rows={3}
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={onSubmit} 
            disabled={recibirOrden.isPending}
            className={tieneProblemas ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
          >
            {recibirOrden.isPending ? 'Procesando...' : 'Confirmar Recepción'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
