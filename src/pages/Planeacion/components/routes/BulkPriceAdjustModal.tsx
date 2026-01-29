import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Percent, TrendingUp, TrendingDown, Calculator } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface Route {
  id: string;
  cliente_nombre: string;
  origen_texto: string;
  destino_texto: string;
  valor_bruto: number;
  precio_custodio: number;
  costo_operativo: number;
}

interface BulkPriceAdjustModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRoutes: Route[];
  onSuccess?: () => void;
}

export function BulkPriceAdjustModal({ open, onOpenChange, selectedRoutes, onSuccess }: BulkPriceAdjustModalProps) {
  const [percentage, setPercentage] = useState('5');
  const [adjustmentType, setAdjustmentType] = useState<'increment' | 'decrement'>('increment');
  const [applyToValorBruto, setApplyToValorBruto] = useState(true);
  const [applyToPrecioCustodio, setApplyToPrecioCustodio] = useState(true);
  const [motivo, setMotivo] = useState('Ajuste por inflación');
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const percentageNum = parseFloat(percentage) || 0;
  const multiplier = adjustmentType === 'increment' ? (1 + percentageNum / 100) : (1 - percentageNum / 100);

  const preview = useMemo(() => {
    return selectedRoutes.map(route => {
      const nuevoValorBruto = applyToValorBruto ? Math.round(route.valor_bruto * multiplier) : route.valor_bruto;
      const nuevoPrecioCustodio = applyToPrecioCustodio ? Math.round(route.precio_custodio * multiplier) : route.precio_custodio;
      const cambioValorBruto = nuevoValorBruto - route.valor_bruto;
      const cambioPrecioCustodio = nuevoPrecioCustodio - route.precio_custodio;
      
      return {
        ...route,
        nuevoValorBruto,
        nuevoPrecioCustodio,
        cambioValorBruto,
        cambioPrecioCustodio
      };
    });
  }, [selectedRoutes, multiplier, applyToValorBruto, applyToPrecioCustodio]);

  const handleApply = async () => {
    if (selectedRoutes.length === 0) return;
    if (!applyToValorBruto && !applyToPrecioCustodio) {
      toast.error('Selecciona al menos un campo para aplicar el ajuste');
      return;
    }

    setSaving(true);
    try {
      // Actualizar cada ruta individualmente para que el trigger capture los cambios
      const updates = preview.map(async (route) => {
        const updateData: Record<string, any> = {
          updated_at: new Date().toISOString()
        };
        
        if (applyToValorBruto) {
          updateData.valor_bruto = route.nuevoValorBruto;
        }
        if (applyToPrecioCustodio) {
          updateData.precio_custodio = route.nuevoPrecioCustodio;
        }
        
        // Recalcular márgenes
        const valorBruto = updateData.valor_bruto ?? route.valor_bruto;
        const precioCustodio = updateData.precio_custodio ?? route.precio_custodio;
        updateData.margen_neto_calculado = valorBruto - precioCustodio - route.costo_operativo;
        updateData.porcentaje_utilidad = valorBruto > 0 
          ? (updateData.margen_neto_calculado / valorBruto) * 100 
          : 0;
        
        const { error } = await supabase
          .from('matriz_precios_rutas')
          .update(updateData)
          .eq('id', route.id);
        
        if (error) throw error;
      });

      await Promise.all(updates);

      toast.success(`${selectedRoutes.length} rutas actualizadas correctamente`);
      queryClient.invalidateQueries({ queryKey: ['routes-pending-prices'] });
      queryClient.invalidateQueries({ queryKey: ['all-routes'] });
      queryClient.invalidateQueries({ queryKey: ['routes-stats'] });
      queryClient.invalidateQueries({ queryKey: ['price-history'] });
      queryClient.invalidateQueries({ queryKey: ['matriz-precios'] });
      
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error applying bulk adjustment:', error);
      toast.error('Error al aplicar el ajuste masivo');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Ajuste Masivo de Precios
          </DialogTitle>
          <DialogDescription>
            Rutas seleccionadas: <Badge variant="secondary">{selectedRoutes.length}</Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Configuración del ajuste */}
          <div className="grid grid-cols-2 gap-6">
            {/* Porcentaje */}
            <div className="space-y-2">
              <Label htmlFor="percentage">Porcentaje de Ajuste</Label>
              <div className="relative">
                <Input
                  id="percentage"
                  type="number"
                  value={percentage}
                  onChange={(e) => setPercentage(e.target.value)}
                  className="pr-8"
                  min="0"
                  max="100"
                  step="0.5"
                />
                <Percent className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            {/* Tipo de ajuste */}
            <div className="space-y-2">
              <Label>Tipo de Ajuste</Label>
              <RadioGroup value={adjustmentType} onValueChange={(v) => setAdjustmentType(v as 'increment' | 'decrement')}>
                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="increment" id="increment" />
                    <Label htmlFor="increment" className="flex items-center gap-1 cursor-pointer">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      Incremento
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="decrement" id="decrement" />
                    <Label htmlFor="decrement" className="flex items-center gap-1 cursor-pointer">
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      Reducción
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* Campos a aplicar */}
          <div className="space-y-2">
            <Label>Aplicar a:</Label>
            <div className="flex items-center gap-6">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="valorBruto" 
                  checked={applyToValorBruto} 
                  onCheckedChange={(checked) => setApplyToValorBruto(!!checked)} 
                />
                <Label htmlFor="valorBruto" className="cursor-pointer">Valor Bruto (Precio Cliente)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="precioCustodio" 
                  checked={applyToPrecioCustodio} 
                  onCheckedChange={(checked) => setApplyToPrecioCustodio(!!checked)} 
                />
                <Label htmlFor="precioCustodio" className="cursor-pointer">Pago Custodio</Label>
              </div>
            </div>
          </div>

          {/* Vista previa */}
          <div className="space-y-2">
            <Label>Vista Previa</Label>
            <ScrollArea className="h-48 rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Ruta</TableHead>
                    <TableHead className="text-right">Actual</TableHead>
                    <TableHead className="text-right">Nuevo</TableHead>
                    <TableHead className="text-right">Cambio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.slice(0, 10).map((route) => (
                    <TableRow key={route.id}>
                      <TableCell className="font-medium text-xs">{route.cliente_nombre}</TableCell>
                      <TableCell className="text-xs">{route.origen_texto.slice(0, 15)}→{route.destino_texto.slice(0, 15)}</TableCell>
                      <TableCell className="text-right text-xs">${route.valor_bruto.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-xs font-medium">${route.nuevoValorBruto.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={route.cambioValorBruto >= 0 ? 'default' : 'destructive'} className="text-xs">
                          {route.cambioValorBruto >= 0 ? '+' : ''}${route.cambioValorBruto.toLocaleString()}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {preview.length > 10 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground text-xs">
                        ...y {preview.length - 10} rutas más
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>

          {/* Motivo */}
          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo del Ajuste</Label>
            <Textarea
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: Ajuste inflación Q1 2026"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button 
            onClick={handleApply} 
            disabled={saving || selectedRoutes.length === 0 || (!applyToValorBruto && !applyToPrecioCustodio)}
            className="gap-2"
          >
            {saving ? (
              <>
                <span className="animate-spin">⏳</span>
                Aplicando...
              </>
            ) : (
              <>
                <Calculator className="h-4 w-4" />
                Aplicar a {selectedRoutes.length} rutas
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
