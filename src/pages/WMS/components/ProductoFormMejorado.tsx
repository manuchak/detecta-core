
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useProductosInventario } from '@/hooks/useProductosInventario';
import { useCategorias } from '@/hooks/useCategorias';
import { useMarcasGPS } from '@/hooks/useMarcasGPS';
import { useModelosGPS } from '@/hooks/useModelosGPS';
import { useProveedores } from '@/hooks/useProveedores';
import type { ProductoInventario } from '@/types/wms';
import { 
  Package, 
  Zap, 
  CircuitBoard, 
  DollarSign, 
  Settings, 
  Truck, 
  CheckCircle,
  Sparkles,
  Info
} from 'lucide-react';

interface ProductoFormMejoradoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  producto?: ProductoInventario | null;
  onClose: () => void;
}

export const ProductoFormMejorado = ({ open, onOpenChange, producto, onClose }: ProductoFormMejoradoProps) => {
  const [selectedMarcaGPS, setSelectedMarcaGPS] = useState<string>('');
  const [autoFilledFields, setAutoFilledFields] = useState<string[]>([]);
  
  const { createProducto, updateProducto } = useProductosInventario();
  const { categorias } = useCategorias();
  const { marcas: marcasGPS } = useMarcasGPS();
  const { modelos: modelosGPS, modelosPorMarca } = useModelosGPS();
  const { proveedores } = useProveedores();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<ProductoInventario>();

  const watchedCategoriaId = watch('categoria_id');
  const watchedMarcaGPS = watch('marca_gps_id');
  const watchedModeloGPS = watch('modelo_gps_id');

  // Check if selected category is GPS
  const selectedCategoria = categorias?.find(cat => cat.id === watchedCategoriaId);
  const isGPSCategory = selectedCategoria?.nombre?.toLowerCase().includes('gps') || 
                       selectedCategoria?.codigo?.toLowerCase().includes('gps');

  useEffect(() => {
    if (producto) {
      reset(producto);
      setSelectedMarcaGPS(producto.marca_gps_id || '');
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
        modelo_gps_id: '',
        proveedor_id: '',
        peso_kg: 0,
        consumo_energia_mw: 0,
        frecuencia_transmision_hz: 0,
        certificaciones: [],
        compatibilidad_vehiculos: []
      });
      setSelectedMarcaGPS('');
    }
  }, [producto, reset]);

  // Auto-fill fields when GPS model is selected
  useEffect(() => {
    if (watchedModeloGPS) {
      const selectedModelo = modelosGPS?.find(m => m.id === watchedModeloGPS);
      if (selectedModelo) {
        const filledFields: string[] = [];
        
        // Auto-fill marca from GPS model
        if (selectedModelo.marca?.nombre) {
          setValue('marca', selectedModelo.marca.nombre);
          filledFields.push('marca');
        }
        
        // Auto-fill modelo
        setValue('modelo', selectedModelo.nombre);
        filledFields.push('modelo');
        
        // Auto-fill technical specs if available
        if (selectedModelo.peso_gramos) {
          setValue('peso_kg', selectedModelo.peso_gramos / 1000);
          filledFields.push('peso_kg');
        }
        
        if (selectedModelo.dimensiones) {
          setValue('dimensiones', selectedModelo.dimensiones);
          filledFields.push('dimensiones');
        }
        
        if (selectedModelo.temperatura_operacion) {
          setValue('temperatura_operacion', selectedModelo.temperatura_operacion);
          filledFields.push('temperatura_operacion');
        }
        
        if (selectedModelo.alimentacion_externa) {
          setValue('voltaje_operacion', selectedModelo.alimentacion_externa);
          filledFields.push('voltaje_operacion');
        }
        
        if (selectedModelo.precio_referencia_usd) {
          setValue('precio_compra_promedio', selectedModelo.precio_referencia_usd);
          setValue('precio_venta_sugerido', selectedModelo.precio_referencia_usd * 1.3); // 30% markup
          filledFields.push('precio_compra_promedio', 'precio_venta_sugerido');
        }
        
        // Set serialized for GPS devices
        setValue('es_serializado', true);
        setValue('requiere_configuracion', true);
        filledFields.push('es_serializado', 'requiere_configuracion');
        
        setAutoFilledFields(filledFields);
        
        // Clear after 3 seconds
        setTimeout(() => setAutoFilledFields([]), 3000);
      }
    }
  }, [watchedModeloGPS, modelosGPS, setValue]);

  useEffect(() => {
    if (watchedMarcaGPS !== selectedMarcaGPS) {
      setSelectedMarcaGPS(watchedMarcaGPS || '');
      setValue('modelo_gps_id', '');
    }
  }, [watchedMarcaGPS, selectedMarcaGPS, setValue]);

  // Clear GPS fields when category is not GPS
  useEffect(() => {
    if (!isGPSCategory) {
      setValue('marca_gps_id', '');
      setValue('modelo_gps_id', '');
      setSelectedMarcaGPS('');
    }
  }, [isGPSCategory, setValue]);

  const onSubmit = (data: ProductoInventario) => {
    if (producto) {
      updateProducto.mutate({ ...data, id: producto.id }, {
        onSuccess: () => onClose()
      });
    } else {
      createProducto.mutate(data, {
        onSuccess: () => onClose()
      });
    }
  };

  const modelosDisponibles = selectedMarcaGPS && modelosPorMarca ? 
    modelosPorMarca[selectedMarcaGPS] || [] : [];

  const selectedModelo = modelosGPS?.find(m => m.id === watchedModeloGPS);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-start justify-center p-4">
          <div className="w-full max-w-6xl bg-background rounded-lg shadow-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                <Package className="h-6 w-6" />
                <div>
                  <h1 className="text-2xl font-bold">
                    {producto ? `Editar: ${producto.nombre}` : 'Nuevo Producto'}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {isGPSCategory ? 'Formulario inteligente con datos GPS precargados' : 'Información completa del producto'}
                  </p>
                </div>
              </div>
              <Button variant="ghost" onClick={onClose}>✕</Button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6">
              <div className="grid grid-cols-12 gap-6">
                
                {/* Columna Principal - Información Básica */}
                <div className="col-span-8 space-y-6">
                  
                  {/* Smart Category & GPS Selection */}
                  <Card className="relative">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-blue-500" />
                        Selección Inteligente
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="categoria_id">Categoría *</Label>
                          <Select
                            value={watchedCategoriaId || ''}
                            onValueChange={(value) => setValue('categoria_id', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                            <SelectContent>
                              {categorias?.map((categoria) => (
                                <SelectItem key={categoria.id} value={categoria.id}>
                                  <div className="flex items-center gap-2">
                                    {categoria.nombre}
                                    {categoria.codigo && (
                                      <Badge variant="outline" className="text-xs">{categoria.codigo}</Badge>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {isGPSCategory && (
                          <>
                            <div>
                              <Label htmlFor="marca_gps_id">Marca GPS</Label>
                              <Select
                                value={watchedMarcaGPS || ''}
                                onValueChange={(value) => setValue('marca_gps_id', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar marca" />
                                </SelectTrigger>
                                <SelectContent>
                                  {marcasGPS?.map((marca) => (
                                    <SelectItem key={marca.id} value={marca.id}>
                                      <div className="flex items-center gap-2">
                                        {marca.nombre}
                                        {marca.soporte_wialon && (
                                          <Badge variant="secondary" className="text-xs">Wialon</Badge>
                                        )}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label htmlFor="modelo_gps_id">Modelo GPS</Label>
                              <Select
                                value={watchedModeloGPS || ''}
                                onValueChange={(value) => setValue('modelo_gps_id', value)}
                                disabled={!selectedMarcaGPS}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar modelo" />
                                </SelectTrigger>
                                <SelectContent>
                                  {modelosDisponibles.map((modelo) => (
                                    <SelectItem key={modelo.id} value={modelo.id}>
                                      <div className="flex items-center gap-2">
                                        {modelo.nombre}
                                        {modelo.precio_referencia_usd && (
                                          <Badge variant="outline" className="text-xs">
                                            ${modelo.precio_referencia_usd}
                                          </Badge>
                                        )}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Auto-filled notification */}
                      {autoFilledFields.length > 0 && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-green-800 text-sm">
                            ✨ Campos completados automáticamente: {autoFilledFields.join(', ')}
                          </span>
                        </div>
                      )}

                      {/* GPS Model Info Panel */}
                      {selectedModelo && (
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                            <Info className="h-4 w-4" />
                            Especificaciones {selectedModelo.nombre}
                          </h4>
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div><span className="font-medium">Tipo:</span> {selectedModelo.tipo_dispositivo}</div>
                            <div><span className="font-medium">Precisión:</span> {selectedModelo.gps_precision}</div>
                            <div><span className="font-medium">Peso:</span> {selectedModelo.peso_gramos}g</div>
                            <div><span className="font-medium">Dimensiones:</span> {selectedModelo.dimensiones}</div>
                          </div>
                          {selectedModelo.conectividad && selectedModelo.conectividad.length > 0 && (
                            <div className="mt-3">
                              <span className="font-medium text-blue-900">Conectividad:</span>
                              <div className="flex gap-1 mt-1">
                                {selectedModelo.conectividad.map((conn, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs bg-blue-100 text-blue-800">
                                    {conn}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Basic Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Información Básica
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className={autoFilledFields.includes('nombre') ? 'relative' : ''}>
                          <Label htmlFor="nombre">Nombre del Producto *</Label>
                          <Input
                            id="nombre"
                            {...register('nombre', { required: 'Nombre requerido' })}
                            placeholder="Ej: GPS Tracker Professional"
                            className={autoFilledFields.includes('nombre') ? 'bg-green-50 border-green-300' : ''}
                          />
                          {errors.nombre && (
                            <span className="text-sm text-red-500">{errors.nombre.message}</span>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="codigo_producto">Código del Producto *</Label>
                          <Input
                            id="codigo_producto"
                            {...register('codigo_producto', { required: 'Código requerido' })}
                            placeholder="Ej: GPS-001"
                          />
                          {errors.codigo_producto && (
                            <span className="text-sm text-red-500">{errors.codigo_producto.message}</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="descripcion">Descripción</Label>
                        <Textarea
                          id="descripcion"
                          {...register('descripcion')}
                          placeholder="Descripción detallada del producto..."
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className={autoFilledFields.includes('marca') ? 'relative' : ''}>
                          <Label htmlFor="marca">Marca</Label>
                          <Input
                            id="marca"
                            {...register('marca')}
                            placeholder="Ej: Teltonika"
                            className={autoFilledFields.includes('marca') ? 'bg-green-50 border-green-300' : ''}
                          />
                        </div>
                        <div className={autoFilledFields.includes('modelo') ? 'relative' : ''}>
                          <Label htmlFor="modelo">Modelo</Label>
                          <Input
                            id="modelo"
                            {...register('modelo')}
                            placeholder="Ej: FMB920"
                            className={autoFilledFields.includes('modelo') ? 'bg-green-50 border-green-300' : ''}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Technical Specifications */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CircuitBoard className="h-5 w-5" />
                        Especificaciones Técnicas
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-4 gap-4">
                        <div className={autoFilledFields.includes('peso_kg') ? 'relative' : ''}>
                          <Label htmlFor="peso_kg">Peso (kg)</Label>
                          <Input
                            id="peso_kg"
                            type="number"
                            step="0.001"
                            {...register('peso_kg', { valueAsNumber: true })}
                            placeholder="0.000"
                            className={autoFilledFields.includes('peso_kg') ? 'bg-green-50 border-green-300' : ''}
                          />
                        </div>
                        <div className={autoFilledFields.includes('dimensiones') ? 'relative' : ''}>
                          <Label htmlFor="dimensiones">Dimensiones</Label>
                          <Input
                            id="dimensiones"
                            {...register('dimensiones')}
                            placeholder="L x W x H mm"
                            className={autoFilledFields.includes('dimensiones') ? 'bg-green-50 border-green-300' : ''}
                          />
                        </div>
                        <div className={autoFilledFields.includes('voltaje_operacion') ? 'relative' : ''}>
                          <Label htmlFor="voltaje_operacion">Voltaje</Label>
                          <Input
                            id="voltaje_operacion"
                            {...register('voltaje_operacion')}
                            placeholder="12V-24V"
                            className={autoFilledFields.includes('voltaje_operacion') ? 'bg-green-50 border-green-300' : ''}
                          />
                        </div>
                        <div className={autoFilledFields.includes('temperatura_operacion') ? 'relative' : ''}>
                          <Label htmlFor="temperatura_operacion">Temperatura</Label>
                          <Input
                            id="temperatura_operacion"
                            {...register('temperatura_operacion')}
                            placeholder="-40°C a +85°C"
                            className={autoFilledFields.includes('temperatura_operacion') ? 'bg-green-50 border-green-300' : ''}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="consumo_energia_mw">Consumo (mW)</Label>
                          <Input
                            id="consumo_energia_mw"
                            type="number"
                            {...register('consumo_energia_mw', { valueAsNumber: true })}
                            placeholder="1000"
                          />
                        </div>
                        <div>
                          <Label htmlFor="frecuencia_transmision_hz">Frecuencia (Hz)</Label>
                          <Input
                            id="frecuencia_transmision_hz"
                            type="number"
                            {...register('frecuencia_transmision_hz', { valueAsNumber: true })}
                            placeholder="900000000"
                          />
                        </div>
                        <div>
                          <Label htmlFor="codigo_barras">Código de Barras</Label>
                          <Input
                            id="codigo_barras"
                            {...register('codigo_barras')}
                            placeholder="EAN-13 o UPC"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Columna Lateral - Configuración y Precios */}
                <div className="col-span-4 space-y-6">
                  
                  {/* Status y Configuración */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Configuración
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="activo">Producto Activo</Label>
                          <Switch
                            id="activo"
                            checked={watch('activo')}
                            onCheckedChange={(checked) => setValue('activo', checked)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="es_serializado" className={autoFilledFields.includes('es_serializado') ? 'text-green-700' : ''}>
                            Serializado
                          </Label>
                          <Switch
                            id="es_serializado"
                            checked={watch('es_serializado')}
                            onCheckedChange={(checked) => setValue('es_serializado', checked)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="requiere_configuracion" className={autoFilledFields.includes('requiere_configuracion') ? 'text-green-700' : ''}>
                            Requiere Config.
                          </Label>
                          <Switch
                            id="requiere_configuracion"
                            checked={watch('requiere_configuracion')}
                            onCheckedChange={(checked) => setValue('requiere_configuracion', checked)}
                          />
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <Label htmlFor="unidad_medida">Unidad de Medida</Label>
                        <Select
                          value={watch('unidad_medida') || 'pieza'}
                          onValueChange={(value) => setValue('unidad_medida', value)}
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

                      <div>
                        <Label htmlFor="garantia_meses">Garantía (meses)</Label>
                        <Input
                          id="garantia_meses"
                          type="number"
                          {...register('garantia_meses', { valueAsNumber: true })}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Precios y Stock */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Precios y Stock
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className={autoFilledFields.includes('precio_compra_promedio') ? 'relative' : ''}>
                        <Label htmlFor="precio_compra_promedio">Precio Compra</Label>
                        <Input
                          id="precio_compra_promedio"
                          type="number"
                          step="0.01"
                          {...register('precio_compra_promedio', { valueAsNumber: true })}
                          placeholder="0.00"
                          className={autoFilledFields.includes('precio_compra_promedio') ? 'bg-green-50 border-green-300' : ''}
                        />
                      </div>

                      <div className={autoFilledFields.includes('precio_venta_sugerido') ? 'relative' : ''}>
                        <Label htmlFor="precio_venta_sugerido">Precio Venta</Label>
                        <Input
                          id="precio_venta_sugerido"
                          type="number"
                          step="0.01"
                          {...register('precio_venta_sugerido', { valueAsNumber: true })}
                          placeholder="0.00"
                          className={autoFilledFields.includes('precio_venta_sugerido') ? 'bg-green-50 border-green-300' : ''}
                        />
                      </div>

                      <Separator />

                      <div>
                        <Label htmlFor="stock_minimo">Stock Mínimo</Label>
                        <Input
                          id="stock_minimo"
                          type="number"
                          {...register('stock_minimo', { valueAsNumber: true })}
                        />
                      </div>

                      <div>
                        <Label htmlFor="stock_maximo">Stock Máximo</Label>
                        <Input
                          id="stock_maximo"
                          type="number"
                          {...register('stock_maximo', { valueAsNumber: true })}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Proveedor */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Truck className="h-5 w-5" />
                        Proveedor
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="proveedor_id">Proveedor Principal</Label>
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
                                {proveedor.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="ubicacion_almacen">Ubicación Almacén</Label>
                        <Input
                          id="ubicacion_almacen"
                          {...register('ubicacion_almacen')}
                          placeholder="Ej: A-1-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="color">Color</Label>
                        <Input
                          id="color"
                          {...register('color')}
                          placeholder="Negro, Blanco, etc."
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {producto ? 'Actualizar Producto' : 'Crear Producto'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
