
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
    // Limpiar campos UUID vacíos convirtiéndolos a null
    const cleanedData = {
      ...data,
      proveedor_id: data.proveedor_id || null,
      categoria_id: data.categoria_id || null,
      marca_gps_id: data.marca_gps_id || null,
      modelo_gps_id: data.modelo_gps_id || null,
    };

    if (producto) {
      updateProducto.mutate({ ...cleanedData, id: producto.id }, {
        onSuccess: () => onClose()
      });
    } else {
      createProducto.mutate(cleanedData, {
        onSuccess: () => onClose()
      });
    }
  };

  const modelosDisponibles = selectedMarcaGPS && modelosPorMarca ? 
    modelosPorMarca[selectedMarcaGPS] || [] : [];

  const handleCategorySelect = (categoria: any) => {
    console.log('Categoría seleccionada:', categoria);
  };

  const handleGPSSelect = (marca: any, modelo: any) => {
    console.log('GPS seleccionado:', marca, modelo);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Package className="h-6 w-6" />
            <div>
              <span className="text-2xl font-bold">
                {producto ? `Editar: ${producto.nombre}` : 'Nuevo Producto'}
              </span>
              <p className="text-sm text-muted-foreground font-normal">
                {isGPSCategory ? 'Formulario inteligente con datos GPS precargados' : 'Información completa del producto'}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-12 gap-6">
            
            {/* Columna Principal - Información Básica */}
            <div className="col-span-8 space-y-6">
              
              <SmartCategorySelection
                watch={watch}
                setValue={setValue}
                onCategorySelect={handleCategorySelect}
                onGPSSelect={handleGPSSelect}
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

              <ConfigurationCard
                watch={watch}
                setValue={setValue}
                autoFilledFields={autoFilledFields}
              />

            </div>

            {/* Sidebar - Pricing, Stock y Provider */}
            <div className="col-span-4 space-y-6">
              
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

              {/* Submit Actions */}
              <div className="sticky top-4">
                <div className="bg-muted/50 border rounded-lg p-4 space-y-3">
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={createProducto.isPending || updateProducto.isPending}
                  >
                    {createProducto.isPending || updateProducto.isPending ? 'Guardando...' : 
                     producto ? 'Actualizar Producto' : 'Crear Producto'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full" 
                    onClick={onClose}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
