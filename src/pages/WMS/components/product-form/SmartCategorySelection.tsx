
import { useEffect } from 'react';
import { UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Sparkles, Info } from 'lucide-react';
import type { ProductoInventario, Categoria, MarcaGPS, ModeloGPS } from '@/types/wms';

interface SmartCategorySelectionProps {
  categorias?: Categoria[];
  marcasGPS?: MarcaGPS[];
  modelosDisponibles: ModeloGPS[];
  modelosGPS?: ModeloGPS[];
  autoFilledFields: string[];
  setValue: UseFormSetValue<ProductoInventario>;
  watch: UseFormWatch<ProductoInventario>;
}

export const SmartCategorySelection = ({
  categorias,
  marcasGPS,
  modelosDisponibles,
  modelosGPS,
  autoFilledFields,
  setValue,
  watch
}: SmartCategorySelectionProps) => {
  const watchedCategoriaId = watch('categoria_id');
  const watchedMarcaGPS = watch('marca_gps_id');
  const watchedModeloGPS = watch('modelo_gps_id');

  // Check if selected category is GPS
  const selectedCategoria = categorias?.find(cat => cat.id === watchedCategoriaId);
  const isGPSCategory = selectedCategoria?.nombre?.toLowerCase().includes('gps') || 
                       selectedCategoria?.codigo?.toLowerCase().includes('gps');

  const selectedModelo = modelosGPS?.find(m => m.id === watchedModeloGPS);

  return (
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
                  value={watchedMarcaGPS || ''}
                  onValueChange={(value) => setValue('marca_gps_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar marca" />
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
                  value={watchedModeloGPS || ''}
                  onValueChange={(value) => setValue('modelo_gps_id', value)}
                  disabled={!watchedMarcaGPS}
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
                            <span className="text-xs text-muted-foreground ml-auto">
                              ${modelo.precio_referencia_usd}
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
  );
};
