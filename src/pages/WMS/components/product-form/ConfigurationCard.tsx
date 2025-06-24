
import { UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Settings } from 'lucide-react';
import type { ProductoInventario } from '@/types/wms';

interface ConfigurationCardProps {
  watch: UseFormWatch<ProductoInventario>;
  setValue: UseFormSetValue<ProductoInventario>;
  autoFilledFields: string[];
}

export const ConfigurationCard = ({
  watch,
  setValue,
  autoFilledFields
}: ConfigurationCardProps) => {
  return (
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
            value={watch('garantia_meses') || ''}
            onChange={(e) => setValue('garantia_meses', parseInt(e.target.value) || 0)}
          />
        </div>
      </CardContent>
    </Card>
  );
};
