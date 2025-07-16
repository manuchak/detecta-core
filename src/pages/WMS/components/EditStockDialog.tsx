import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { StockProducto } from '@/types/wms';
import { useStockProductos } from '@/hooks/useStockProductos';
import { useToast } from '@/hooks/use-toast';

interface EditStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stockItem: StockProducto | null;
}

export const EditStockDialog = ({ open, onOpenChange, stockItem }: EditStockDialogProps) => {
  const [nuevaCantidad, setNuevaCantidad] = useState<string>('');
  const [motivo, setMotivo] = useState('');
  const { ajustarStock } = useStockProductos();
  const { toast } = useToast();

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && stockItem) {
      setNuevaCantidad(stockItem.cantidad_disponible.toString());
      setMotivo('');
    } else {
      setNuevaCantidad('');
      setMotivo('');
    }
    onOpenChange(newOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stockItem) return;
    
    const nuevaCantidadNum = parseInt(nuevaCantidad);
    if (isNaN(nuevaCantidadNum) || nuevaCantidadNum < 0) {
      toast({
        title: "Error",
        description: "La cantidad debe ser un número válido mayor o igual a 0.",
        variant: "destructive",
      });
      return;
    }

    if (!motivo.trim()) {
      toast({
        title: "Error",
        description: "Debe especificar un motivo para el ajuste.",
        variant: "destructive",
      });
      return;
    }

    try {
      await ajustarStock.mutateAsync({
        producto_id: stockItem.producto_id,
        nueva_cantidad: nuevaCantidadNum,
        motivo: motivo.trim()
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error adjusting stock:', error);
    }
  };

  if (!stockItem) return null;

  const diferencia = parseInt(nuevaCantidad || '0') - stockItem.cantidad_disponible;
  const tipoAjuste = diferencia > 0 ? 'entrada' : diferencia < 0 ? 'salida' : 'sin cambio';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajustar Stock Manualmente</DialogTitle>
          <DialogDescription>
            Modifique la cantidad disponible del producto y registre el motivo del ajuste.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Información del producto */}
          <div className="border rounded-lg p-4 bg-muted/50">
            <h4 className="font-medium text-sm mb-2">Producto</h4>
            <div className="space-y-1">
              <p className="font-medium">{stockItem.producto?.nombre}</p>
              <p className="text-sm text-muted-foreground">
                {stockItem.producto?.codigo_producto}
              </p>
              <div className="flex items-center gap-2 text-sm">
                <span>Stock actual:</span>
                <Badge variant="outline">
                  {stockItem.cantidad_disponible} {stockItem.producto?.unidad_medida || 'unidades'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Nueva cantidad */}
          <div className="space-y-2">
            <Label htmlFor="nueva-cantidad">Nueva Cantidad</Label>
            <Input
              id="nueva-cantidad"
              type="number"
              min="0"
              value={nuevaCantidad}
              onChange={(e) => setNuevaCantidad(e.target.value)}
              placeholder="Ingrese la nueva cantidad"
              required
            />
            
            {/* Mostrar diferencia */}
            {nuevaCantidad && !isNaN(parseInt(nuevaCantidad)) && (
              <div className="text-sm">
                <span className="text-muted-foreground">Diferencia: </span>
                <span className={`font-medium ${
                  diferencia > 0 ? 'text-green-600' : 
                  diferencia < 0 ? 'text-red-600' : 
                  'text-muted-foreground'
                }`}>
                  {diferencia > 0 ? '+' : ''}{diferencia} 
                  {diferencia !== 0 && (
                    <span className="ml-1">
                      ({tipoAjuste === 'entrada' ? 'Entrada' : 'Salida'})
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Motivo */}
          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo del Ajuste *</Label>
            <Textarea
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: Conteo físico, producto dañado, corrección de error..."
              rows={3}
              required
            />
            <p className="text-xs text-muted-foreground">
              Este motivo quedará registrado en el historial de movimientos.
            </p>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={ajustarStock.isPending}
            >
              {ajustarStock.isPending ? 'Ajustando...' : 'Confirmar Ajuste'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};