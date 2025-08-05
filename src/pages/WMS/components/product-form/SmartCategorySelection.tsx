
import { UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw } from 'lucide-react';
import { useCategorias } from '@/hooks/useCategorias';
import { useMarcasGPS } from '@/hooks/useMarcasGPS';
import { useModelosGPS } from '@/hooks/useModelosGPS';
import type { ProductoInventario, CategoriaProducto } from '@/types/wms';

interface SmartCategorySelectionProps {
  watch: UseFormWatch<ProductoInventario>;
  setValue: UseFormSetValue<ProductoInventario>;
  onCategorySelect: (categoria: CategoriaProducto) => void;
  onGPSSelect: (marca: any, modelo: any) => void;
}

export const SmartCategorySelection = ({
  watch,
  setValue,
  onCategorySelect,
  onGPSSelect
}: SmartCategorySelectionProps) => {
  const { categorias } = useCategorias();
  const { marcas: marcasGPS } = useMarcasGPS();
  const { modelos: modelosGPS, refreshModelos } = useModelosGPS();

  const selectedMarcaId = watch('marca_gps_id');
  const selectedCategoriaId = watch('categoria_id');
  const modelosFiltrados = modelosGPS?.filter(m => m.marca_id === selectedMarcaId);

  // Check if selected category is GPS
  const selectedCategoria = categorias?.find(cat => cat.id === selectedCategoriaId);
  const isGPSCategory = selectedCategoria?.nombre?.toLowerCase().includes('gps') || 
                       selectedCategoria?.codigo?.toLowerCase().includes('gps');

  return (
    <div className={`grid gap-4 ${isGPSCategory ? 'grid-cols-3' : 'grid-cols-1'}`}>
      <div>
        <Label htmlFor="categoria_id">Categoría</Label>
        <Select
          value={watch('categoria_id') || ''}
          onValueChange={(value) => {
            setValue('categoria_id', value);
            const categoria = categorias?.find(c => c.id === value);
            if (categoria) {
              onCategorySelect(categoria);
            }
          }}
        >
          <SelectTrigger className="bg-background border-border">
            <SelectValue placeholder="Seleccionar categoría" />
          </SelectTrigger>
          <SelectContent className="bg-background border-border z-50">
            {categorias?.map((categoria) => (
              <SelectItem key={categoria.id} value={categoria.id}>
                {categoria.nombre}
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
              value={watch('marca_gps_id') || ''}
              onValueChange={(value) => {
                setValue('marca_gps_id', value);
                setValue('modelo_gps_id', ''); // Reset modelo when marca changes
              }}
             >
               <SelectTrigger className="bg-background border-border">
                 <SelectValue placeholder="Seleccionar marca" />
               </SelectTrigger>
               <SelectContent className="bg-background border-border z-50">
                 {marcasGPS?.map((marca) => (
                   <SelectItem key={marca.id} value={marca.id}>
                     <div className="flex items-center gap-2">
                       <span>{marca.nombre}</span>
                     </div>
                   </SelectItem>
                 ))}
               </SelectContent>
            </Select>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="modelo_gps_id">Modelo GPS</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={refreshModelos}
                className="h-6 px-2"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
            <Select
              value={watch('modelo_gps_id') || ''}
              onValueChange={(value) => {
                setValue('modelo_gps_id', value);
                const marca = marcasGPS?.find(m => m.id === selectedMarcaId);
                const modelo = modelosFiltrados?.find(m => m.id === value);
                if (marca && modelo) {
                  onGPSSelect(marca, modelo);
                }
              }}
              disabled={!selectedMarcaId}
            >
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="Seleccionar modelo" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border z-50">
                {modelosFiltrados?.map((modelo) => (
                  <SelectItem key={modelo.id} value={modelo.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{modelo.nombre}</span>
                      {modelo.precio_referencia_usd && (
                        <span className="text-xs text-gray-500 ml-2">
                          ${modelo.precio_referencia_usd} USD
                        </span>
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
  );
};
