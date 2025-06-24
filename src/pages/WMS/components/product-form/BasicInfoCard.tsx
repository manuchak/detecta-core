
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package } from 'lucide-react';
import type { ProductoInventario } from '@/types/wms';

interface BasicInfoCardProps {
  register: UseFormRegister<ProductoInventario>;
  errors: FieldErrors<ProductoInventario>;
  autoFilledFields: string[];
}

export const BasicInfoCard = ({
  register,
  errors,
  autoFilledFields
}: BasicInfoCardProps) => {
  return (
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
  );
};
