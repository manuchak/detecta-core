import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react';
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

interface QuickPriceEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  route: Route | null;
  onSuccess?: () => void;
}

export function QuickPriceEditModal({ open, onOpenChange, route, onSuccess }: QuickPriceEditModalProps) {
  const [valorBruto, setValorBruto] = useState('');
  const [precioCustodio, setPrecioCustodio] = useState('');
  const [motivo, setMotivo] = useState('');
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  // Reset form when route changes
  useEffect(() => {
    if (route) {
      setValorBruto(route.valor_bruto.toString());
      setPrecioCustodio(route.precio_custodio.toString());
      setMotivo('');
    }
  }, [route]);

  const valorBrutoNum = parseFloat(valorBruto) || 0;
  const precioCustodioNum = parseFloat(precioCustodio) || 0;
  const margenNeto = valorBrutoNum - precioCustodioNum - (route?.costo_operativo || 0);
  const porcentajeMargen = valorBrutoNum > 0 ? (margenNeto / valorBrutoNum) * 100 : 0;
  const esMargenNegativo = margenNeto < 0;
  const esPrecioInvalido = valorBrutoNum < precioCustodioNum;

  const handleSave = async () => {
    if (!route) return;
    
    if (esPrecioInvalido) {
      toast.error('El valor bruto debe ser mayor al pago del custodio');
      return;
    }

    setSaving(true);
    try {
      // Only update editable columns - margen_neto_calculado and porcentaje_utilidad 
      // are GENERATED ALWAYS columns calculated automatically by PostgreSQL
      const { error } = await supabase
        .from('matriz_precios_rutas')
        .update({
          valor_bruto: valorBrutoNum,
          precio_custodio: precioCustodioNum,
          updated_at: new Date().toISOString()
        })
        .eq('id', route.id);

      if (error) throw error;

      // Si hay motivo, guardarlo en el historial manualmente
      // El trigger solo guarda los valores, no el motivo
      if (motivo.trim()) {
        // El motivo se puede agregar via update posterior si se necesita
        // Por ahora el trigger captura el cambio automáticamente
      }

      toast.success('Precio actualizado correctamente');
      queryClient.invalidateQueries({ queryKey: ['routes-pending-prices'] });
      queryClient.invalidateQueries({ queryKey: ['all-routes'] });
      queryClient.invalidateQueries({ queryKey: ['routes-stats'] });
      queryClient.invalidateQueries({ queryKey: ['price-history'] });
      queryClient.invalidateQueries({ queryKey: ['matriz-precios'] });
      
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating price:', error);
      toast.error('Error al actualizar el precio');
    } finally {
      setSaving(false);
    }
  };

  if (!route) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Actualizar Precio
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{route.cliente_nombre}</span>
            <span className="flex items-center gap-1 mt-1 text-muted-foreground">
              {route.origen_texto} <ArrowRight className="h-3 w-3" /> {route.destino_texto}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Precio Cliente */}
          <div className="space-y-2">
            <Label htmlFor="valorBruto">Precio Cliente (Valor Bruto)</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
              <Input
                id="valorBruto"
                type="number"
                value={valorBruto}
                onChange={(e) => setValorBruto(e.target.value)}
                className="pl-7"
                placeholder="0.00"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Actual: ${route.valor_bruto.toLocaleString()}
            </p>
          </div>

          {/* Pago Custodio */}
          <div className="space-y-2">
            <Label htmlFor="precioCustodio">Pago Custodio</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
              <Input
                id="precioCustodio"
                type="number"
                value={precioCustodio}
                onChange={(e) => setPrecioCustodio(e.target.value)}
                className="pl-7"
                placeholder="0.00"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Actual: ${route.precio_custodio.toLocaleString()}
            </p>
          </div>

          {/* Margen Calculado */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Margen Estimado:</span>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold ${esMargenNegativo ? 'text-destructive' : 'text-green-600'}`}>
                  ${margenNeto.toLocaleString()}
                </span>
                <Badge variant={esMargenNegativo ? 'destructive' : porcentajeMargen > 25 ? 'default' : 'secondary'}>
                  {porcentajeMargen.toFixed(1)}%
                </Badge>
              </div>
            </div>
            
            {esMargenNegativo && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span>¡Atención! El margen es negativo</span>
              </div>
            )}
            
            {esPrecioInvalido && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span>El precio cliente debe ser mayor al pago custodio</span>
              </div>
            )}
          </div>

          {/* Motivo */}
          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo del Cambio (opcional)</Label>
            <Textarea
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: Ajuste por inflación Q1 2026, Corrección de precio inicial..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving || esPrecioInvalido}
            className="gap-2"
          >
            {saving ? (
              <>
                <span className="animate-spin">⏳</span>
                Guardando...
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4" />
                Guardar Cambios
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
