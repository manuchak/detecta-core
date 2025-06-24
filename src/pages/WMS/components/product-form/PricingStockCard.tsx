
import { UseFormRegister, UseFormWatch } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { DollarSign } from 'lucide-react';
import type { ProductoInventario } from '@/types/wms';

interface PricingStockCardProps {
  register: UseFormRegister<ProductoInventario>;
  watch: UseFormWatch<ProductoInventario>;
  autoFilledFields: string[];
}

export const PricingStockCard = ({
  register,
  watch,
  autoFilledFields
}: PricingStockCardProps) => {
  return (
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
  );
};
