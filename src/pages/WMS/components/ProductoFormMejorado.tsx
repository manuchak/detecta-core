
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { useProductosInventario } from '@/hooks/useProductosInventario';
import { useCategorias } from '@/hooks/useCategorias';
import { useMarcasGPS } from '@/hooks/useMarcasGPS';
import { useModelosGPS } from '@/hooks/useModelosGPS';
import { useProveedores } from '@/hooks/useProveedores';
import type { ProductoInventario } from '@/types/wms';
import { Package } from 'lucide-react';

// Import new components
import { SmartCategorySelection } from './product-form/SmartCategorySelection';
import { BasicInfoCard } from './product-form/BasicInfoCard';
import { TechnicalSpecsCard } from './product-form/TechnicalSpecsCard';
import { ConfigurationCard } from './product-form/ConfigurationCard';
import { PricingStockCard } from './product-form/PricingStockCard';
import { ProviderCard } from './product-form/ProviderCard';

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
                  
                  <SmartCategorySelection
                    categorias={categorias}
                    marcasGPS={marcasGPS}
                    modelosDisponibles={modelosDisponibles}
                    modelosGPS={modelosGPS}
                    autoFilledFields={autoFilledFields}
                    setValue={setValue}
                    watch={watch}
                  />

                  <BasicInfoCard
                    register={register}
                    errors={errors}
                    autoFilledFields={autoFilledFields}
                  />

                  <TechnicalSpecsCard
                    register={register}
                    autoFilledFields={autoFilledFields}
                  />
                </div>

                {/* Columna Lateral - Configuración y Precios */}
                <div className="col-span-4 space-y-6">
                  
                  <ConfigurationCard
                    watch={watch}
                    setValue={setValue}
                    autoFilledFields={autoFilledFields}
                  />

                  <PricingStockCard
                    register={register}
                    watch={watch}
                    autoFilledFields={autoFilledFields}
                  />

                  <ProviderCard
                    register={register}
                    watch={watch}
                    setValue={setValue}
                    proveedores={proveedores}
                  />
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
