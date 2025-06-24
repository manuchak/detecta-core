
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
import { Plus, Trash2, Package } from 'lucide-react';
import { useProveedores } from '@/hooks/useProveedores';
import { useProductosInventario } from '@/hooks/useProductosInventario';
import { useOrdenesCompra } from '@/hooks/useOrdenesCompra';
import { useToast } from '@/hooks/use-toast';
import type { OrdenCompra, DetalleOrdenCompra } from '@/types/wms';

interface OrdenCompraDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orden?: OrdenCompra | null;
  onClose: () => void;
}

interface DetalleFormData {
  producto_id: string;
  cantidad_solicitada: number;
  precio_unitario: number;
  descuento_porcentaje: number;
  notas?: string;
}

interface OrdenFormData {
  proveedor_id: string;
  fecha_entrega_esperada: string;
  notas?: string;
  terminos_pago?: string;
}

export const OrdenCompraDialog = ({
  open,
  onOpenChange,
  orden,
  onClose
}: OrdenCompraDialogProps) => {
  const { toast } = useToast();
  const { data: proveedores } = useProveedores();
  const { data: productos } = useProductosInventario();
  const { createOrden } = useOrdenesCompra();
  
  const [detalles, setDetalles] = useState<DetalleFormData[]>([]);
  
  const { register, handleSubmit, watch, setValue, reset } = useForm<OrdenFormData>();

  const agregarDetalle = () => {
    setDetalles([...detalles, {
      producto_id: '',
      cantidad_solicitada: 1,
      precio_unitario: 0,
      descuento_porcentaje: 0,
      notas: ''
    }]);
  };

  const eliminarDetalle = (index: number) => {
    setDetalles(detalles.filter((_, i) => i !== index));
  };

  const actualizarDetalle = (index: number, campo: keyof DetalleFormData, valor: any) => {
    const nuevosDetalles = [...detalles];
    nuevosDetalles[index] = { ...nuevosDetalles[index], [campo]: valor };
    setDetalles(nuevosDetalles);
  };

  const calcularSubtotal = (detalle: DetalleFormData) => {
    const subtotal = detalle.cantidad_solicitada * detalle.precio_unitario;
    const descuento = subtotal * (detalle.descuento_porcentaje / 100);
    return subtotal - descuento;
  };

  const calcularTotales = () => {
    const subtotal = detalles.reduce((sum, detalle) => sum + calcularSubtotal(detalle), 0);
    const impuestos = subtotal * 0.16; // IVA 16%
    const total = subtotal + impuestos;
    return { subtotal, impuestos, total };
  };

  const onSubmit = async (data: OrdenFormData) => {
    if (detalles.length === 0) {
      toast({
        title: "Error",
        description: "Debe agregar al menos un producto a la orden.",
        variant: "destructive",
      });
      return;
    }

    try {
      const totales = calcularTotales();
      
      await createOrden.mutateAsync({
        proveedor_id: data.proveedor_id,
        fecha_orden: new Date().toISOString().split('T')[0],
        fecha_entrega_esperada: data.fecha_entrega_esperada || undefined,
        estado: 'borrador',
        subtotal: totales.subtotal,
        impuestos: totales.impuestos,
        total: totales.total,
        moneda: 'MXN',
        terminos_pago: data.terminos_pago,
        notas: data.notas,
        creado_por: (await supabase.auth.getUser()).data.user?.id
      });

      reset();
      setDetalles([]);
      onClose();
    } catch (error) {
      console.error('Error creating orden:', error);
    }
  };

  const totales = calcularTotales();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {orden ? 'Editar Orden de Compra' : 'Nueva Orden de Compra'}
          </DialogTitle>
          <DialogDescription>
            {orden ? 'Modifica los detalles de la orden de compra' : 'Crea una nueva orden de compra para reabastecer inventario'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Información general */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información General</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="proveedor_id">Proveedor *</Label>
                <Select
                  value={watch('proveedor_id') || ''}
                  onValueChange={(value) => setValue('proveedor_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {proveedores?.map((proveedor) => (
                      <SelectItem key={proveedor.id} value={proveedor.id}>
                        <div>
                          <p className="font-medium">{proveedor.nombre}</p>
                          <p className="text-sm text-gray-500">{proveedor.email}</p>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="fecha_entrega_esperada">Fecha Entrega Esperada</Label>
                <Input
                  id="fecha_entrega_esperada"
                  type="date"
                  {...register('fecha_entrega_esperada')}
                />
              </div>

              <div>
                <Label htmlFor="terminos_pago">Términos de Pago</Label>
                <Select
                  value={watch('terminos_pago') || ''}
                  onValueChange={(value) => setValue('terminos_pago', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar términos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contado">Contado</SelectItem>
                    <SelectItem value="15_dias">15 días</SelectItem>
                    <SelectItem value="30_dias">30 días</SelectItem>
                    <SelectItem value="45_dias">45 días</SelectItem>
                    <SelectItem value="60_dias">60 días</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notas">Notas</Label>
                <Textarea
                  id="notas"
                  {...register('notas')}
                  placeholder="Notas adicionales sobre la orden..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Productos */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Productos</CardTitle>
              <Button type="button" onClick={agregarDetalle} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Producto
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {detalles.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No hay productos agregados</p>
                  <p className="text-sm">Haz clic en "Agregar Producto" para comenzar</p>
                </div>
              ) : (
                detalles.map((detalle, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-6 gap-4 items-end">
                      <div className="col-span-2">
                        <Label>Producto</Label>
                        <Select
                          value={detalle.producto_id}
                          onValueChange={(value) => {
                            actualizarDetalle(index, 'producto_id', value);
                            const producto = productos?.find(p => p.id === value);
                            if (producto?.precio_compra_promedio) {
                              actualizarDetalle(index, 'precio_unitario', producto.precio_compra_promedio);
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar producto" />
                          </SelectTrigger>
                          <SelectContent>
                            {productos?.map((producto) => (
                              <SelectItem key={producto.id} value={producto.id}>
                                <div>
                                  <p className="font-medium">{producto.nombre}</p>
                                  <p className="text-sm text-gray-500">{producto.codigo_producto}</p>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Cantidad</Label>
                        <Input
                          type="number"
                          min="1"
                          value={detalle.cantidad_solicitada}
                          onChange={(e) => actualizarDetalle(index, 'cantidad_solicitada', parseInt(e.target.value) || 1)}
                        />
                      </div>

                      <div>
                        <Label>Precio Unitario</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={detalle.precio_unitario}
                          onChange={(e) => actualizarDetalle(index, 'precio_unitario', parseFloat(e.target.value) || 0)}
                        />
                      </div>

                      <div>
                        <Label>Descuento %</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={detalle.descuento_porcentaje}
                          onChange={(e) => actualizarDetalle(index, 'descuento_porcentaje', parseFloat(e.target.value) || 0)}
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <div>
                          <Label>Subtotal</Label>
                          <div className="text-lg font-medium">
                            ${calcularSubtotal(detalle).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => eliminarDetalle(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>

          {/* Totales */}
          {detalles.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-end">
                  <div className="w-80 space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${totales.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>IVA (16%):</span>
                      <span>${totales.impuestos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span>${totales.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createOrden.isPending || detalles.length === 0}>
              {createOrden.isPending ? 'Creando...' : 'Crear Orden'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
