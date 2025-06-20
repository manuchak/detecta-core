
import { useState, useEffect } from 'react';
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
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useProductosInventario } from '@/hooks/useProductosInventario';
import { useCategorias } from '@/hooks/useCategorias';
import { useMarcasGPS } from '@/hooks/useMarcasGPS';
import { useModelosGPS } from '@/hooks/useModelosGPS';
import type { ProductoInventario } from '@/types/wms';

interface ProductoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  producto?: ProductoInventario | null;
  onClose: () => void;
}

export const ProductoDialog = ({ open, onOpenChange, producto, onClose }: ProductoDialogProps) => {
  const [isEditing, setIsEditing] = useState(!producto);
  const [selectedMarcaGPS, setSelectedMarcaGPS] = useState<string>('');
  
  const { createProducto, updateProducto } = useProductosInventario();
  const { categorias } = useCategorias();
  const { marcas: marcasGPS } = useMarcasGPS();
  const { modelos: modelosGPS, modelosPorMarca } = useModelosGPS();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<ProductoInventario>();

  const watchedMarcaGPS = watch('marca_gps_id');

  useEffect(() => {
    if (producto) {
      reset(producto);
      setSelectedMarcaGPS(producto.marca_gps_id || '');
      setIsEditing(false);
    } else {
      reset({
        codigo_producto: '',
        nombre: '',
        descripcion: '',
        categoria_id: '',
        marca: '',
        modelo: '',
        unidad_medida: 'pieza',
        precio_compra_promedio: 0,
        precio_venta_sugerido: 0,
        stock_minimo: 5,
        stock_maximo: 100,
        es_serializado: false,
        requiere_configuracion: false,
        garantia_meses: 12,
        activo: true,
        marca_gps_id: '',
        modelo_gps_id: ''
      });
      setSelectedMarcaGPS('');
      setIsEditing(true);
    }
  }, [producto, reset]);

  useEffect(() => {
    if (watchedMarcaGPS !== selectedMarcaGPS) {
      setSelectedMarcaGPS(watchedMarcaGPS || '');
      // Reset modelo cuando cambia la marca
      setValue('modelo_gps_id', '');
    }
  }, [watchedMarcaGPS, selectedMarcaGPS, setValue]);

  const onSubmit = (data: ProductoInventario) => {
    if (producto && !isEditing) {
      setIsEditing(true);
      return;
    }

    const mutation = producto ? updateProducto : createProducto;
    
    mutation.mutate(producto ? { ...data, id: producto.id } : data, {
      onSuccess: () => {
        onClose();
        setIsEditing(false);
      }
    });
  };

  const modelosDisponibles = selectedMarcaGPS && modelosPorMarca ? 
    modelosPorMarca[selectedMarcaGPS] || [] : [];

  const selectedModelo = modelosGPS?.find(m => m.id === watch('modelo_gps_id'));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {producto ? (isEditing ? 'Editar Producto' : 'Detalles del Producto') : 'Nuevo Producto'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Complete la información del producto de inventario' : 'Información detallada del producto'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="general" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="gps">GPS</TabsTrigger>
              <TabsTrigger value="precios">Precios</TabsTrigger>
              <TabsTrigger value="configuracion">Configuración</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="codigo_producto">Código del Producto *</Label>
                  <Input
                    id="codigo_producto"
                    {...register('codigo_producto', { required: 'Código requerido' })}
                    disabled={!isEditing}
                  />
                  {errors.codigo_producto && (
                    <span className="text-sm text-red-500">{errors.codigo_producto.message}</span>
                  )}
                </div>

                <div>
                  <Label htmlFor="categoria_id">Categoría</Label>
                  <Select
                    value={watch('categoria_id') || ''}
                    onValueChange={(value) => setValue('categoria_id', value)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias?.map((categoria) => (
                        <SelectItem key={categoria.id} value={categoria.id}>
                          {categoria.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="nombre">Nombre del Producto *</Label>
                <Input
                  id="nombre"
                  {...register('nombre', { required: 'Nombre requerido' })}
                  disabled={!isEditing}
                />
                {errors.nombre && (
                  <span className="text-sm text-red-500">{errors.nombre.message}</span>
                )}
              </div>

              <div>
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  {...register('descripcion')}
                  disabled={!isEditing}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="marca">Marca</Label>
                  <Input
                    id="marca"
                    {...register('marca')}
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <Label htmlFor="modelo">Modelo</Label>
                  <Input
                    id="modelo"
                    {...register('modelo')}
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <Label htmlFor="unidad_medida">Unidad de Medida</Label>
                  <Select
                    value={watch('unidad_medida') || 'pieza'}
                    onValueChange={(value) => setValue('unidad_medida', value)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pieza">Pieza</SelectItem>
                      <SelectItem value="kit">Kit</SelectItem>
                      <SelectItem value="caja">Caja</SelectItem>
                      <SelectItem value="metro">Metro</SelectItem>
                      <SelectItem value="rollo">Rollo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="gps" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="marca_gps_id">Marca GPS</Label>
                  <Select
                    value={watch('marca_gps_id') || ''}
                    onValueChange={(value) => setValue('marca_gps_id', value)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar marca GPS" />
                    </SelectTrigger>
                    <SelectContent>
                      {marcasGPS?.map((marca) => (
                        <SelectItem key={marca.id} value={marca.id}>
                          {marca.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="modelo_gps_id">Modelo GPS</Label>
                  <Select
                    value={watch('modelo_gps_id') || ''}
                    onValueChange={(value) => setValue('modelo_gps_id', value)}
                    disabled={!isEditing || !selectedMarcaGPS}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar modelo GPS" />
                    </SelectTrigger>
                    <SelectContent>
                      {modelosDisponibles.map((modelo) => (
                        <SelectItem key={modelo.id} value={modelo.id}>
                          {modelo.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedModelo && (
                <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                  <h4 className="font-medium">Especificaciones del Modelo GPS</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Tipo:</span> {selectedModelo.tipo_dispositivo}
                    </div>
                    <div>
                      <span className="font-medium">Precisión GPS:</span> {selectedModelo.gps_precision}
                    </div>
                    <div>
                      <span className="font-medium">Conectividad:</span>
                      <div className="flex gap-1 mt-1">
                        {selectedModelo.conectividad?.map((conn, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">{conn}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Alimentación:</span> {selectedModelo.alimentacion_externa}
                    </div>
                    <div>
                      <span className="font-medium">Dimensiones:</span> {selectedModelo.dimensiones}
                    </div>
                    <div>
                      <span className="font-medium">Peso:</span> {selectedModelo.peso_gramos}g
                    </div>
                    <div>
                      <span className="font-medium">Resistencia:</span> {selectedModelo.resistencia_agua}
                    </div>
                    <div>
                      <span className="font-medium">Precio Ref. USD:</span> ${selectedModelo.precio_referencia_usd}
                    </div>
                  </div>
                  
                  {selectedModelo.sensores_soportados && selectedModelo.sensores_soportados.length > 0 && (
                    <div>
                      <span className="font-medium">Sensores:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedModelo.sensores_soportados.map((sensor, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">{sensor}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="precios" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="precio_compra_promedio">Precio de Compra Promedio</Label>
                  <Input
                    id="precio_compra_promedio"
                    type="number"
                    step="0.01"
                    {...register('precio_compra_promedio', { valueAsNumber: true })}
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <Label htmlFor="precio_venta_sugerido">Precio de Venta Sugerido</Label>
                  <Input
                    id="precio_venta_sugerido"
                    type="number"
                    step="0.01"
                    {...register('precio_venta_sugerido', { valueAsNumber: true })}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stock_minimo">Stock Mínimo</Label>
                  <Input
                    id="stock_minimo"
                    type="number"
                    {...register('stock_minimo', { valueAsNumber: true })}
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <Label htmlFor="stock_maximo">Stock Máximo</Label>
                  <Input
                    id="stock_maximo"
                    type="number"
                    {...register('stock_maximo', { valueAsNumber: true })}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="configuracion" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ubicacion_almacen">Ubicación en Almacén</Label>
                  <Input
                    id="ubicacion_almacen"
                    {...register('ubicacion_almacen')}
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <Label htmlFor="garantia_meses">Garantía (meses)</Label>
                  <Input
                    id="garantia_meses"
                    type="number"
                    {...register('garantia_meses', { valueAsNumber: true })}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="es_serializado"
                    checked={watch('es_serializado')}
                    onCheckedChange={(checked) => setValue('es_serializado', checked)}
                    disabled={!isEditing}
                  />
                  <Label htmlFor="es_serializado">Producto Serializado</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="requiere_configuracion"
                    checked={watch('requiere_configuracion')}
                    onCheckedChange={(checked) => setValue('requiere_configuracion', checked)}
                    disabled={!isEditing}
                  />
                  <Label htmlFor="requiere_configuracion">Requiere Configuración</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="activo"
                    checked={watch('activo')}
                    onCheckedChange={(checked) => setValue('activo', checked)}
                    disabled={!isEditing}
                  />
                  <Label htmlFor="activo">Producto Activo</Label>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {producto ? (isEditing ? 'Guardar Cambios' : 'Editar') : 'Crear Producto'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
