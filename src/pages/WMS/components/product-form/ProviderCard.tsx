
import { UseFormRegister, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck } from 'lucide-react';
import type { ProductoInventario, Proveedor } from '@/types/wms';

interface ProviderCardProps {
  register: UseFormRegister<ProductoInventario>;
  watch: UseFormWatch<ProductoInventario>;
  setValue: UseFormSetValue<ProductoInventario>;
  proveedores?: Proveedor[];
}

export const ProviderCard = ({
  register,
  watch,
  setValue,
  proveedores
}: ProviderCardProps) => {
  return (
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
  );
};
