
import { UseFormRegister } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CircuitBoard } from 'lucide-react';
import type { ProductoInventario } from '@/types/wms';

interface TechnicalSpecsCardProps {
  register: UseFormRegister<ProductoInventario>;
  autoFilledFields: string[];
}

export const TechnicalSpecsCard = ({
  register,
  autoFilledFields
}: TechnicalSpecsCardProps) => {
  return (
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
  );
};
