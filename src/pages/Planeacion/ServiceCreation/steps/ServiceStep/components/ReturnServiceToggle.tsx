/**
 * ReturnServiceToggle - Toggle for marking a service as a return trip
 * Bypasses the 30-minute validation for same-day return services
 */

import { RotateCcw, Info } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface ReturnServiceToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  showValidationBypass?: boolean;
}

export function ReturnServiceToggle({ 
  checked, 
  onCheckedChange,
  showValidationBypass = false
}: ReturnServiceToggleProps) {
  return (
    <div className={cn(
      "rounded-lg border p-4 transition-colors",
      checked ? "bg-primary/5 border-primary/30" : "bg-muted/30 border-border"
    )}>
      <div className="flex items-start gap-3">
        <div className={cn(
          "p-2 rounded-full transition-colors",
          checked ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
        )}>
          <RotateCcw className="h-4 w-4" />
        </div>
        
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <Label 
              htmlFor="return-service-toggle" 
              className="text-sm font-medium cursor-pointer"
            >
              Este es un servicio de retorno
            </Label>
            <Switch
              id="return-service-toggle"
              checked={checked}
              onCheckedChange={onCheckedChange}
            />
          </div>
          
          <p className="text-xs text-muted-foreground">
            El custodio regresa con la unidad después de completar el servicio de ida
          </p>
          
          {checked && showValidationBypass && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-primary">
              <Info className="h-3.5 w-3.5" />
              <span>La validación de 30 min no aplica para retornos</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
