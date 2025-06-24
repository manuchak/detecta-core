
import { UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const { data: categorias } = useCategorias();
  const { data: marcasGPS } = useMarcasGPS();
  const { data: modelosGPS } = useModelosGPS();

  const selectedMarcaId = watch('marca_gps_id');
  const modelosFiltrados = modelosGPS?.filter(m => m.marca_id === selectedMarcaId);

  return (
    <div className="grid grid-cols-3 gap-4">
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

      <div>
        <Label htmlFor="marca_gps_id">Marca GPS</Label>
        <Select
          value={watch('marca_gps_id') || ''}
          onValueChange={(value) => {
            setValue('marca_gps_id', value);
            setValue('modelo_gps_id', ''); // Reset modelo when marca changes
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar marca" />
          </SelectTrigger>
          <SelectContent>
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
        <Label htmlFor="modelo_gps_id">Modelo GPS</Label>
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
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar modelo" />
          </SelectTrigger>
          <SelectContent>
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
    </div>
  );
};
